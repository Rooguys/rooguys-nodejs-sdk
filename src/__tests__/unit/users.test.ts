import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockSuccessResponse, mockErrorResponse } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Users Resource', () => {
  let client: Rooguys;
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get a user profile', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.userProfile)
      );

      const result = await client.users.get('user_123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user_123');
      expect(result).toEqual(mockResponses.userProfile);
      expect(result.user_id).toBe('user123');
      expect(result.points).toBe(100);
    });

    it('should handle user with no level', async () => {
      const userWithoutLevel = {
        ...mockResponses.userProfile,
        level: null,
        next_level: null,
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(userWithoutLevel));

      const result = await client.users.get('user_new');

      expect(result.level).toBeNull();
      expect(result.next_level).toBeNull();
    });

    it('should handle user with no badges', async () => {
      const userWithoutBadges = {
        ...mockResponses.userProfile,
        badges: [],
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(userWithoutBadges));

      const result = await client.users.get('user_123');

      expect(result.badges).toEqual([]);
    });

    it('should throw 404 error when user not found', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(404, mockErrors.notFoundError.message)
      );

      await expect(client.users.get('nonexistent_user')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });

    it('should handle special characters in user ID', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.userProfile)
      );

      await client.users.get('user@example.com');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user%40example.com');
    });
  });

  describe('getBulk', () => {
    it('should get multiple user profiles', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.bulkUsersResponse)
      );

      const result = await client.users.getBulk(['user1', 'user2']);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users/bulk', {
        user_ids: ['user1', 'user2'],
      });
      expect(result).toEqual(mockResponses.bulkUsersResponse);
      expect(result.users).toHaveLength(2);
    });

    it('should handle single user in bulk request', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse({ users: [mockResponses.userProfile] })
      );

      const result = await client.users.getBulk(['user_123']);

      expect(result.users).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse({ users: [] })
      );

      const result = await client.users.getBulk(['nonexistent1', 'nonexistent2']);

      expect(result.users).toEqual([]);
    });

    it('should throw error for more than 100 users', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Maximum 100 user IDs allowed')
      );

      const manyUsers = Array.from({ length: 101 }, (_, i) => `user_${i}`);

      await expect(client.users.getBulk(manyUsers)).rejects.toThrow(
        'Maximum 100 user IDs allowed'
      );
    });
  });

  describe('getBadges', () => {
    it('should get user badges', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse({ badges: mockResponses.userProfile.badges })
      );

      const result = await client.users.getBadges('user_123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user_123/badges');
      expect(result.badges).toHaveLength(1);
      expect(result.badges[0].name).toBe('First Steps');
    });

    it('should handle user with no badges', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse({ badges: [] })
      );

      const result = await client.users.getBadges('user_new');

      expect(result.badges).toEqual([]);
    });

    it('should throw 404 error when user not found', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(404, mockErrors.notFoundError.message)
      );

      await expect(client.users.getBadges('nonexistent_user')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });
  });

  describe('getRank', () => {
    it('should get user rank with default timeframe', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.userRankResponse)
      );

      const result = await client.users.getRank('user_123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user_123/rank', {
        params: { timeframe: 'all-time' },
      });
      expect(result).toEqual(mockResponses.userRankResponse);
      expect(result.rank).toBe(42);
    });

    it('should get user rank with weekly timeframe', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.userRankResponse)
      );

      await client.users.getRank('user_123', 'weekly');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user_123/rank', {
        params: { timeframe: 'weekly' },
      });
    });

    it('should get user rank with monthly timeframe', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.userRankResponse)
      );

      await client.users.getRank('user_123', 'monthly');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user_123/rank', {
        params: { timeframe: 'monthly' },
      });
    });

    it('should throw 404 error when user not found', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(404, mockErrors.notFoundError.message)
      );

      await expect(client.users.getRank('nonexistent_user')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });
  });

  describe('submitAnswers', () => {
    it('should submit questionnaire answers', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.answerSubmissionResponse)
      );

      const answers = [
        { question_id: 'q1', answer_option_id: 'a1' },
        { question_id: 'q2', answer_option_id: 'a2' },
      ];

      const result = await client.users.submitAnswers(
        'user_123',
        'questionnaire_id',
        answers
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/user_123/answers', {
        questionnaire_id: 'questionnaire_id',
        answers,
      });
      expect(result).toEqual(mockResponses.answerSubmissionResponse);
      expect(result.status).toBe('accepted');
    });

    it('should handle single answer submission', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.answerSubmissionResponse)
      );

      const answers = [{ question_id: 'q1', answer_option_id: 'a1' }];

      await client.users.submitAnswers('user_123', 'questionnaire_id', answers);

      expect(mockAxiosInstance.post).toHaveBeenCalled();
    });

    it('should throw error for invalid questionnaire ID', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Invalid questionnaire ID')
      );

      const answers = [{ question_id: 'q1', answer_option_id: 'a1' }];

      await expect(
        client.users.submitAnswers('user_123', 'invalid_id', answers)
      ).rejects.toThrow('Invalid questionnaire ID');
    });

    it('should throw error for empty answers array', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Answers must be a non-empty array')
      );

      await expect(
        client.users.submitAnswers('user_123', 'questionnaire_id', [])
      ).rejects.toThrow('non-empty array');
    });
  });
});
