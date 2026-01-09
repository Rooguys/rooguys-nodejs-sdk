import { Rooguys } from '../../index';
import {
  createMockRooguysClient,
  setupMockRequest,
  setupMockRequestError,
  expectRequestWith,
  MockAxiosInstance,
} from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

describe('Aha Resource', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  describe('declare', () => {
    it('should declare aha score with valid value', async () => {
      setupMockRequest(mockAxios, mockResponses.ahaDeclarationResponse);

      const result = await client.aha.declare('user123', 4);

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/aha/declare',
        data: { user_id: 'user123', value: 4 },
      });
      // SDK returns the full response since there's no data field to unwrap
      expect(result).toEqual(mockResponses.ahaDeclarationResponse);
    });

    it('should declare aha score with value 1', async () => {
      setupMockRequest(mockAxios, mockResponses.ahaDeclarationResponse);

      const result = await client.aha.declare('user123', 1);

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/aha/declare',
        data: { user_id: 'user123', value: 1 },
      });
      expect(result).toEqual(mockResponses.ahaDeclarationResponse);
    });

    it('should declare aha score with value 5', async () => {
      setupMockRequest(mockAxios, mockResponses.ahaDeclarationResponse);

      const result = await client.aha.declare('user123', 5);

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/aha/declare',
        data: { user_id: 'user123', value: 5 },
      });
      expect(result).toEqual(mockResponses.ahaDeclarationResponse);
    });

    it('should throw error for value 0', async () => {
      await expect(client.aha.declare('user123', 0)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.request).not.toHaveBeenCalled();
    });

    it('should throw error for value 6', async () => {
      await expect(client.aha.declare('user123', 6)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.request).not.toHaveBeenCalled();
    });

    it('should throw error for negative value', async () => {
      await expect(client.aha.declare('user123', -1)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.request).not.toHaveBeenCalled();
    });

    it('should throw error for non-integer value', async () => {
      await expect(client.aha.declare('user123', 3.5)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.request).not.toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      setupMockRequestError(mockAxios, 400, 'Validation failed', 'VALIDATION_ERROR', [
        { field: 'value', message: 'value must be an integer between 1 and 5' },
      ]);

      await expect(client.aha.declare('user123', 3)).rejects.toThrow();
    });
  });

  describe('getUserScore', () => {
    it('should get user aha score successfully', async () => {
      // The API returns { success: true, data: {...} } and SDK unwraps to just data
      // So we mock the wrapped response but expect the unwrapped data
      setupMockRequest(mockAxios, mockResponses.ahaScoreResponse);

      const result = await client.aha.getUserScore('user123');

      expectRequestWith(mockAxios, {
        method: 'GET',
        url: '/users/user123/aha',
      });
      // SDK unwraps { success: true, data: {...} } to just the data part
      // Cast to any since the type expects the wrapper but we get unwrapped data
      expect((result as any).user_id).toBe('user123');
    });

    it('should parse all aha score fields correctly', async () => {
      setupMockRequest(mockAxios, mockResponses.ahaScoreResponse);

      const result = await client.aha.getUserScore('user123');

      // Result is the unwrapped data (cast to any to access fields)
      const data = result as any;
      expect(data.user_id).toBe('user123');
      expect(data.current_score).toBe(75);
      expect(data.declarative_score).toBe(80);
      expect(data.inferred_score).toBe(70);
      expect(data.status).toBe('activated');
    });

    it('should preserve history structure', async () => {
      setupMockRequest(mockAxios, mockResponses.ahaScoreResponse);

      const result = await client.aha.getUserScore('user123');

      expect((result as any).history).toEqual({
        initial: 50,
        initial_date: '2024-01-01T00:00:00Z',
        previous: 70,
      });
    });

    it('should handle 404 error when user not found', async () => {
      setupMockRequestError(mockAxios, 404, 'User not found', 'NOT_FOUND');

      await expect(client.aha.getUserScore('nonexistent')).rejects.toThrow();
    });

    it('should handle null declarative and inferred scores', async () => {
      const responseWithNulls = {
        success: true,
        data: {
          user_id: 'user123',
          current_score: 0,
          declarative_score: null,
          inferred_score: null,
          status: 'not_started',
          history: {
            initial: null,
            initial_date: null,
            previous: null,
          },
        },
      };
      setupMockRequest(mockAxios, responseWithNulls);

      const result = await client.aha.getUserScore('user123');

      // Result is the unwrapped data
      const data = result as any;
      expect(data.declarative_score).toBeNull();
      expect(data.inferred_score).toBeNull();
      expect(data.history.initial).toBeNull();
    });
  });
});
