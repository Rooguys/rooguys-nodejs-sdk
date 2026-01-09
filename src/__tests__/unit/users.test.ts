import { Rooguys, ValidationError } from '../../index';
import {
  createMockRooguysClient,
  setupMockRequest,
  setupMockRequestError,
  expectRequestWith,
  MockAxiosInstance,
} from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

describe('Users Resource', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  describe('get', () => {
    it('should get a user profile', async () => {
      setupMockRequest(mockAxios, mockResponses.userProfile);

      const result = await client.users.get('user123');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user123',
      });
      expect(result.user_id).toBe('user123');
      expect(result.points).toBe(100);
    });

    it('should handle user with no level', async () => {
      const userWithoutLevel = {
        ...mockResponses.userProfile,
        level: null,
        next_level: null,
      };
      setupMockRequest(mockAxios, userWithoutLevel);

      const result = await client.users.get('user_new');

      expect(result.level).toBeNull();
      expect(result.next_level).toBeNull();
    });

    it('should handle user with no badges', async () => {
      const userWithoutBadges = {
        ...mockResponses.userProfile,
        badges: [],
      };
      setupMockRequest(mockAxios, userWithoutBadges);

      const result = await client.users.get('user_123');

      expect(result.badges).toEqual([]);
    });

    it('should throw 404 error when user not found', async () => {
      setupMockRequestError(mockAxios, 404, "User 'user123' does not exist in this project");

      await expect(client.users.get('nonexistent_user')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });

    it('should handle special characters in user ID', async () => {
      setupMockRequest(mockAxios, mockResponses.userProfile);

      await client.users.get('user@example.com');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user%40example.com',
      });
    });

    it('should support field selection', async () => {
      setupMockRequest(mockAxios, mockResponses.userProfile);

      await client.users.get('user123', { fields: ['points', 'level'] });

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user123',
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      setupMockRequest(mockAxios, mockResponses.userProfile);

      const result = await client.users.create({
        userId: 'new_user',
        displayName: 'New User',
        email: 'new@example.com',
      });

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/users',
        data: {
          user_id: 'new_user',
          display_name: 'New User',
          email: 'new@example.com',
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw error for missing user ID', async () => {
      await expect(client.users.create({} as any)).rejects.toThrow(ValidationError);
      await expect(client.users.create({} as any)).rejects.toThrow('User ID is required');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        client.users.create({ userId: 'user1', email: 'invalid-email' })
      ).rejects.toThrow(ValidationError);
      await expect(
        client.users.create({ userId: 'user1', email: 'invalid-email' })
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      setupMockRequest(mockAxios, mockResponses.userProfile);

      const result = await client.users.update('user123', {
        displayName: 'Updated Name',
      });

      expectRequestWith(mockAxios, {
        method: 'PATCH',
        url: '/users/user123',
        data: {
          display_name: 'Updated Name',
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw error for missing user ID', async () => {
      await expect(client.users.update('', { displayName: 'Test' })).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        client.users.update('user123', { email: 'invalid-email' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('createBatch', () => {
    it('should create multiple users', async () => {
      const batchResponse = { created: 2, failed: 0 };
      setupMockRequest(mockAxios, batchResponse);

      const users = [
        { userId: 'user1', displayName: 'User 1' },
        { userId: 'user2', displayName: 'User 2' },
      ];

      const result = await client.users.createBatch(users);

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/users/batch',
      });
      expect(result).toEqual(batchResponse);
    });

    it('should throw error for empty users array', async () => {
      await expect(client.users.createBatch([])).rejects.toThrow(ValidationError);
      await expect(client.users.createBatch([])).rejects.toThrow('cannot be empty');
    });

    it('should throw error for more than 100 users', async () => {
      const manyUsers = Array.from({ length: 101 }, (_, i) => ({
        userId: `user_${i}`,
      }));

      await expect(client.users.createBatch(manyUsers)).rejects.toThrow(ValidationError);
      await expect(client.users.createBatch(manyUsers)).rejects.toThrow('maximum of 100');
    });

    it('should throw error for user without userId', async () => {
      const users = [{ displayName: 'User 1' }] as any;

      await expect(client.users.createBatch(users)).rejects.toThrow(ValidationError);
      await expect(client.users.createBatch(users)).rejects.toThrow('User ID is required');
    });
  });

  describe('getBulk', () => {
    it('should get multiple user profiles', async () => {
      setupMockRequest(mockAxios, mockResponses.bulkUsersResponse);

      const result = await client.users.getBulk(['user1', 'user2']);

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/users/bulk',
        data: {
          user_ids: ['user1', 'user2'],
        },
      });
      expect(result).toEqual(mockResponses.bulkUsersResponse);
      expect(result.users).toHaveLength(2);
    });

    it('should handle single user in bulk request', async () => {
      setupMockRequest(mockAxios, { users: [mockResponses.userProfile] });

      const result = await client.users.getBulk(['user_123']);

      expect(result.users).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      setupMockRequest(mockAxios, { users: [] });

      const result = await client.users.getBulk(['nonexistent1', 'nonexistent2']);

      expect(result.users).toEqual([]);
    });
  });

  describe('getBadges', () => {
    it('should get user badges', async () => {
      setupMockRequest(mockAxios, { badges: mockResponses.userProfile.badges });

      const result = await client.users.getBadges('user_123');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user_123/badges',
      });
      expect(result.badges).toHaveLength(1);
      expect(result.badges[0].name).toBe('First Steps');
    });

    it('should handle user with no badges', async () => {
      setupMockRequest(mockAxios, { badges: [] });

      const result = await client.users.getBadges('user_new');

      expect(result.badges).toEqual([]);
    });

    it('should throw 404 error when user not found', async () => {
      setupMockRequestError(mockAxios, 404, "User 'user123' does not exist in this project");

      await expect(client.users.getBadges('nonexistent_user')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });
  });

  describe('getRank', () => {
    it('should get user rank with default timeframe', async () => {
      setupMockRequest(mockAxios, mockResponses.userRankResponse);

      const result = await client.users.getRank('user_123');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user_123/rank',
      });
      expect(result.rank).toBe(42);
    });

    it('should get user rank with weekly timeframe', async () => {
      setupMockRequest(mockAxios, mockResponses.userRankResponse);

      await client.users.getRank('user_123', 'weekly');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user_123/rank',
      });
    });

    it('should get user rank with monthly timeframe', async () => {
      setupMockRequest(mockAxios, mockResponses.userRankResponse);

      await client.users.getRank('user_123', 'monthly');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user_123/rank',
      });
    });

    it('should throw 404 error when user not found', async () => {
      setupMockRequestError(mockAxios, 404, "User 'user123' does not exist in this project");

      await expect(client.users.getRank('nonexistent_user')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });
  });

  describe('submitAnswers', () => {
    it('should submit questionnaire answers', async () => {
      setupMockRequest(mockAxios, mockResponses.answerSubmissionResponse);

      const answers = [
        { question_id: 'q1', answer_option_id: 'a1' },
        { question_id: 'q2', answer_option_id: 'a2' },
      ];

      const result = await client.users.submitAnswers(
        'user_123',
        'questionnaire_id',
        answers
      );

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/users/user_123/answers',
        data: {
          questionnaire_id: 'questionnaire_id',
          answers,
        },
      });
      expect(result).toEqual(mockResponses.answerSubmissionResponse);
      expect(result.status).toBe('accepted');
    });

    it('should handle single answer submission', async () => {
      setupMockRequest(mockAxios, mockResponses.answerSubmissionResponse);

      const answers = [{ question_id: 'q1', answer_option_id: 'a1' }];

      await client.users.submitAnswers('user_123', 'questionnaire_id', answers);

      expect(mockAxios.request).toHaveBeenCalled();
    });

    it('should throw error for invalid questionnaire ID', async () => {
      setupMockRequestError(mockAxios, 400, 'Invalid questionnaire ID');

      const answers = [{ question_id: 'q1', answer_option_id: 'a1' }];

      await expect(
        client.users.submitAnswers('user_123', 'invalid_id', answers)
      ).rejects.toThrow('Invalid questionnaire ID');
    });
  });

  describe('search', () => {
    it('should search users', async () => {
      const searchResponse = {
        users: [mockResponses.userProfile],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      };
      setupMockRequest(mockAxios, searchResponse);

      const result = await client.users.search('john');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/search',
      });
      expect(result.users).toHaveLength(1);
    });

    it('should search users with pagination', async () => {
      const searchResponse = {
        users: [],
        pagination: { page: 2, limit: 25, total: 0, totalPages: 0 },
      };
      setupMockRequest(mockAxios, searchResponse);

      await client.users.search('john', { page: 2, limit: 25 });

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/search',
      });
    });
  });
});
