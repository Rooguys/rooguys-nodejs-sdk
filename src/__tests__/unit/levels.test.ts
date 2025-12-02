import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockSuccessResponse, mockErrorResponse } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Levels Resource', () => {
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
    it('should list levels with default parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.levelsListResponse)
      );

      const result = await client.levels.list();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/levels', {
        params: { page: 1, limit: 50 },
      });
      expect(result).toEqual(mockResponses.levelsListResponse);
      expect(result.levels).toHaveLength(2);
    });

    it('should list levels with custom pagination', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.levelsListResponse)
      );

      await client.levels.list(2, 25);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/levels', {
        params: { page: 2, limit: 25 },
      });
    });

    it('should handle empty levels list', async () => {
      const emptyResponse = {
        levels: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(emptyResponse));

      const result = await client.levels.list();

      expect(result.levels).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should handle levels with all fields', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.levelsListResponse)
      );

      const result = await client.levels.list();

      const level = result.levels[0];
      expect(level.id).toBeDefined();
      expect(level.name).toBeDefined();
      expect(level.level_number).toBeDefined();
      expect(level.points_required).toBeDefined();
      expect(level.description).toBeDefined();
      expect(level.icon_url).toBeDefined();
    });

    it('should handle levels sorted by level_number', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.levelsListResponse)
      );

      const result = await client.levels.list();

      expect(result.levels[0].level_number).toBe(1);
      expect(result.levels[1].level_number).toBe(2);
    });

    it('should throw error for invalid pagination', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(400, mockErrors.invalidPaginationError.message)
      );

      await expect(client.levels.list(1, 150)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should handle server error', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(500, 'Internal server error')
      );

      await expect(client.levels.list()).rejects.toThrow('Internal server error');
    });

    it('should handle levels with nullable fields', async () => {
      const levelsWithNulls = {
        levels: [
          {
            id: 'level1',
            name: 'Bronze',
            level_number: 1,
            points_required: 0,
            description: null,
            icon_url: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(levelsWithNulls));

      const result = await client.levels.list();

      expect(result.levels[0].description).toBeNull();
      expect(result.levels[0].icon_url).toBeNull();
    });
  });
});
