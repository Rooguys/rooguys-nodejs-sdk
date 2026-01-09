import { Rooguys } from '../../index';
import {
  createMockRooguysClient,
  setupMockRequest,
  setupMockRequestError,
  expectRequestWith,
  MockAxiosInstance,
} from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

describe('Badges Resource', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  describe('list', () => {
    it('should list badges with default parameters', async () => {
      setupMockRequest(mockAxios, mockResponses.badgesListResponse);

      const result = await client.badges.list();

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/badges',
        params: { page: 1, limit: 50, active_only: false },
      });
      expect(result).toEqual(mockResponses.badgesListResponse);
      expect(result.badges).toHaveLength(1);
    });

    it('should list badges with custom pagination', async () => {
      setupMockRequest(mockAxios, mockResponses.badgesListResponse);

      await client.badges.list(2, 25);

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/badges',
        params: { page: 2, limit: 25, active_only: false },
      });
    });

    it('should list only active badges', async () => {
      setupMockRequest(mockAxios, mockResponses.badgesListResponse);

      await client.badges.list(1, 50, true);

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/badges',
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
      setupMockRequest(mockAxios, emptyResponse);

      const result = await client.badges.list();

      expect(result.badges).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should throw error for invalid pagination', async () => {
      setupMockRequestError(mockAxios, 400, 'Limit must be between 1 and 100');

      await expect(client.badges.list(1, 150)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should handle badges with all fields', async () => {
      setupMockRequest(mockAxios, mockResponses.badgesListResponse);

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
      setupMockRequestError(mockAxios, 500, 'Internal server error');

      await expect(client.badges.list()).rejects.toThrow('Internal server error');
    });
  });
});
