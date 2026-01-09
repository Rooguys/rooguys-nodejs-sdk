import { Rooguys } from '../../index';
import {
  createMockRooguysClient,
  setupMockRequest,
  setupMockRequestError,
  expectRequestWith,
  MockAxiosInstance,
} from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

describe('Leaderboards Resource', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  describe('getGlobal', () => {
    it('should get global leaderboard with default parameters', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardResponse);

      const result = await client.leaderboards.getGlobal();

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/global',
      });
      expect(result.rankings).toHaveLength(2);
    });

    it('should get global leaderboard with weekly timeframe', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardResponse);

      await client.leaderboards.getGlobal('weekly');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/global',
      });
    });

    it('should get global leaderboard with monthly timeframe', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardResponse);

      await client.leaderboards.getGlobal('monthly');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/global',
      });
    });

    it('should get global leaderboard with custom pagination', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardResponse);

      await client.leaderboards.getGlobal('all-time', 2, 25);

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/global',
      });
    });

    it('should handle empty leaderboard', async () => {
      const emptyLeaderboard = {
        ...mockResponses.leaderboardResponse,
        rankings: [],
        total: 0,
      };
      setupMockRequest(mockAxios, emptyLeaderboard);

      const result = await client.leaderboards.getGlobal();

      expect(result.rankings).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error for invalid timeframe', async () => {
      setupMockRequestError(mockAxios, 400, "Timeframe must be one of: all-time, weekly, monthly");

      await expect(
        client.leaderboards.getGlobal('invalid' as any)
      ).rejects.toThrow('Timeframe must be one of');
    });

    it('should throw error for invalid pagination', async () => {
      setupMockRequestError(mockAxios, 400, 'Limit must be between 1 and 100');

      await expect(
        client.leaderboards.getGlobal('all-time', 1, 150)
      ).rejects.toThrow('Limit must be between 1 and 100');
    });

    it('should handle leaderboard with users at same rank', async () => {
      const leaderboardWithTies = {
        ...mockResponses.leaderboardResponse,
        rankings: [
          { rank: 1, user_id: 'user1', points: 1000, level: null },
          { rank: 1, user_id: 'user2', points: 1000, level: null },
          { rank: 3, user_id: 'user3', points: 900, level: null },
        ],
      };
      setupMockRequest(mockAxios, leaderboardWithTies);

      const result = await client.leaderboards.getGlobal();

      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(1);
      expect(result.rankings[2].rank).toBe(3);
    });

    it('should support filter options object', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardResponse);

      await client.leaderboards.getGlobal({
        timeframe: 'weekly',
        page: 2,
        limit: 25,
        persona: 'Achiever',
      });

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/global',
      });
    });
  });

  describe('list', () => {
    it('should list all leaderboards', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardsListResponse);

      const result = await client.leaderboards.list();

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards',
      });
      expect(result.leaderboards).toHaveLength(1);
    });

    it('should list leaderboards with pagination', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardsListResponse);

      await client.leaderboards.list(2, 25);

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards',
      });
    });

    it('should list leaderboards with search', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardsListResponse);

      await client.leaderboards.list(1, 50, 'top');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards',
      });
    });

    it('should support options object', async () => {
      setupMockRequest(mockAxios, mockResponses.leaderboardsListResponse);

      await client.leaderboards.list({ page: 2, limit: 25, search: 'top' });

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards',
      });
    });
  });

  describe('getCustom', () => {
    it('should get custom leaderboard by ID', async () => {
      setupMockRequest(mockAxios, mockResponses.customLeaderboardResponse);

      const result = await client.leaderboards.getCustom('lb1');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/lb1',
      });
      expect(result.rankings).toBeDefined();
    });

    it('should get custom leaderboard with pagination', async () => {
      setupMockRequest(mockAxios, mockResponses.customLeaderboardResponse);

      await client.leaderboards.getCustom('lb1', 2, 25);

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/lb1',
      });
    });

    it('should support filter options object', async () => {
      setupMockRequest(mockAxios, mockResponses.customLeaderboardResponse);

      await client.leaderboards.getCustom('lb1', {
        page: 2,
        limit: 25,
        persona: 'Achiever',
        minLevel: 5,
      });

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/lb1',
      });
    });

    it('should throw error for non-existent leaderboard', async () => {
      setupMockRequestError(mockAxios, 404, 'Leaderboard not found');

      await expect(client.leaderboards.getCustom('nonexistent')).rejects.toThrow('Leaderboard not found');
    });
  });

  describe('getUserRank', () => {
    it('should get user rank in leaderboard', async () => {
      setupMockRequest(mockAxios, mockResponses.userRankResponse);

      const result = await client.leaderboards.getUserRank('lb1', 'user123');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/lb1/users/user123/rank',
      });
      expect(result.rank).toBe(42);
    });
  });

  describe('getAroundUser', () => {
    it('should get leaderboard entries around user', async () => {
      const aroundResponse = {
        ...mockResponses.leaderboardResponse,
        user_rank: 42,
      };
      setupMockRequest(mockAxios, aroundResponse);

      const result = await client.leaderboards.getAroundUser('lb1', 'user123', 5);

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/leaderboards/lb1/users/user123/around',
      });
      expect(result.rankings).toBeDefined();
    });
  });
});
