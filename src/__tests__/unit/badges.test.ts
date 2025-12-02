import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockSuccessResponse, mockErrorResponse } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Badges Resource', () => {
  let client: Rooguys;
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should list badges with default parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.badgesListResponse)
      );

      const result = await client.badges.list();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges', {
        params: { page: 1, limit: 50, active_only: false },
      });
      expect(result).toEqual(mockResponses.badgesListResponse);
      expect(result.badges).toHaveLength(1);
    });

    it('should list badges with custom pagination', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.badgesListResponse)
      );

      await client.badges.list(2, 25);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges', {
        params: { page: 2, limit: 25, active_only: false },
      });
    });

    it('should list only active badges', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.badgesListResponse)
      );

      await client.badges.list(1, 50, true);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/badges', {
        params: { page: 1, limit: 50, active_only: true },
      });
    });

    it('should handle empty badge list', async () => {
      const emptyResponse = {
        badges: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(emptyResponse));

      const result = await client.badges.list();

      expect(result.badges).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw error for invalid pagination', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(400, mockErrors.invalidPaginationError.message)
      );

      await expect(client.badges.list(1, 150)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should handle badges with all fields', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.badgesListResponse)
      );

      const result = await client.badges.list();

      const badge = result.badges[0];
      expect(badge.id).toBeDefined();
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.icon_url).toBeDefined();
      expect(badge.is_active).toBeDefined();
      expect(badge.unlock_criteria).toBeDefined();
    });

    it('should handle server error', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(500, 'Internal server error')
      );

      await expect(client.badges.list()).rejects.toThrow('Internal server error');
    });
  });
});
