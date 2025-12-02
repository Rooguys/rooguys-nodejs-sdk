import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockSuccessResponse, mockErrorResponse } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Leaderboards Resource', () => {
  let client: Rooguys;
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('getGlobal', () => {
    it('should get global leaderboard with default parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.leaderboardResponse)
      );

      const result = await client.leaderboards.getGlobal();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/leaderboard', {
        params: { timeframe: 'all-time', page: 1, limit: 50 },
      });
      expect(result).toEqual(mockResponses.leaderboardResponse);
      expect(result.rankings).toHaveLength(2);
    });

    it('should get global leaderboard with weekly timeframe', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.leaderboardResponse)
      );

      await client.leaderboards.getGlobal('weekly');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/leaderboard', {
        params: { timeframe: 'weekly', page: 1, limit: 50 },
      });
    });

    it('should get global leaderboard with monthly timeframe', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.leaderboardResponse)
      );

      await client.leaderboards.getGlobal('monthly');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/leaderboard', {
        params: { timeframe: 'monthly', page: 1, limit: 50 },
      });
    });

    it('should get global leaderboard with custom pagination', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.leaderboardResponse)
      );

      await client.leaderboards.getGlobal('all-time', 2, 25);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/leaderboard', {
        params: { timeframe: 'all-time', page: 2, limit: 25 },
      });
    });

    it('should handle empty leaderboard', async () => {
      const emptyLeaderboard = {
        ...mockResponses.leaderboardResponse,
        rankings: [],
        total: 0,
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(emptyLeaderboard));

      const result = await client.leaderboards.getGlobal();

      expect(result.rankings).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error for invalid timeframe', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(400, mockErrors.invalidTimeframeError.message)
      );

      await expect(
        client.leaderboards.getGlobal('invalid' as any)
      ).rejects.toThrow('Timeframe must be one of');
    });

    it('should throw error for invalid pagination', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(400, mockErrors.invalidPaginationError.message)
      );

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
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(leaderboardWithTies));

      const result = await client.leaderboards.getGlobal();

      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(1);
      expect(result.rankings[2].rank).toBe(3);
    });
  });
});
