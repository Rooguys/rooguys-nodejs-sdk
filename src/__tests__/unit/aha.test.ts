import { Rooguys } from '../../index';
import { createMockAxiosInstance } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

describe('Aha Resource', () => {
  let client: Rooguys;
  let mockAxios: any;

  beforeEach(() => {
    mockAxios = createMockAxiosInstance();
    client = new Rooguys('test-api-key');
    (client as any).client = mockAxios;
  });

  describe('declare', () => {
    it('should declare aha score with valid value', async () => {
      mockAxios.post.mockResolvedValue({ data: mockResponses.ahaDeclarationResponse });

      const result = await client.aha.declare('user123', 4);

      expect(mockAxios.post).toHaveBeenCalledWith('/aha/declare', {
        user_id: 'user123',
        value: 4,
      });
      expect(result).toEqual(mockResponses.ahaDeclarationResponse);
    });

    it('should declare aha score with value 1', async () => {
      mockAxios.post.mockResolvedValue({ data: mockResponses.ahaDeclarationResponse });

      const result = await client.aha.declare('user123', 1);

      expect(mockAxios.post).toHaveBeenCalledWith('/aha/declare', {
        user_id: 'user123',
        value: 1,
      });
      expect(result).toEqual(mockResponses.ahaDeclarationResponse);
    });

    it('should declare aha score with value 5', async () => {
      mockAxios.post.mockResolvedValue({ data: mockResponses.ahaDeclarationResponse });

      const result = await client.aha.declare('user123', 5);

      expect(mockAxios.post).toHaveBeenCalledWith('/aha/declare', {
        user_id: 'user123',
        value: 5,
      });
      expect(result).toEqual(mockResponses.ahaDeclarationResponse);
    });

    it('should throw error for value 0', async () => {
      await expect(client.aha.declare('user123', 0)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should throw error for value 6', async () => {
      await expect(client.aha.declare('user123', 6)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should throw error for negative value', async () => {
      await expect(client.aha.declare('user123', -1)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should throw error for non-integer value', async () => {
      await expect(client.aha.declare('user123', 3.5)).rejects.toThrow(
        'Aha score value must be an integer between 1 and 5'
      );
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      mockAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          data: mockErrors.ahaValueError,
        },
      });

      await expect(client.aha.declare('user123', 3)).rejects.toThrow();
    });
  });

  describe('getUserScore', () => {
    it('should get user aha score successfully', async () => {
      mockAxios.get.mockResolvedValue({ data: mockResponses.ahaScoreResponse });

      const result = await client.aha.getUserScore('user123');

      expect(mockAxios.get).toHaveBeenCalledWith('/users/user123/aha');
      expect(result).toEqual(mockResponses.ahaScoreResponse);
    });

    it('should parse all aha score fields correctly', async () => {
      mockAxios.get.mockResolvedValue({ data: mockResponses.ahaScoreResponse });

      const result = await client.aha.getUserScore('user123');

      expect(result.success).toBe(true);
      expect(result.data.user_id).toBe('user123');
      expect(result.data.current_score).toBe(75);
      expect(result.data.declarative_score).toBe(80);
      expect(result.data.inferred_score).toBe(70);
      expect(result.data.status).toBe('activated');
    });

    it('should preserve history structure', async () => {
      mockAxios.get.mockResolvedValue({ data: mockResponses.ahaScoreResponse });

      const result = await client.aha.getUserScore('user123');

      expect(result.data.history).toEqual({
        initial: 50,
        initial_date: '2024-01-01T00:00:00Z',
        previous: 70,
      });
    });

    it('should handle 404 error when user not found', async () => {
      mockAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: mockErrors.notFoundError,
        },
      });

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
      mockAxios.get.mockResolvedValue({ data: responseWithNulls });

      const result = await client.aha.getUserScore('user123');

      expect(result.data.declarative_score).toBeNull();
      expect(result.data.inferred_score).toBeNull();
      expect(result.data.history.initial).toBeNull();
    });
  });
});
