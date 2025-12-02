import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockErrorResponse } from '../utils/mockClient';
import { mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Error Handling', () => {
  let client: Rooguys;
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('4xx client errors', () => {
    it('should throw error with message for 400 Bad Request', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Bad Request')
      );

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'Bad Request'
      );
    });

    it('should throw error with message for 401 Unauthorized', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(401, mockErrors.unauthorizedError.message)
      );

      await expect(client.users.get('user1')).rejects.toThrow(
        'Invalid or missing API key'
      );
    });

    it('should throw error with message for 404 Not Found', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(404, mockErrors.notFoundError.message)
      );

      await expect(client.users.get('nonexistent')).rejects.toThrow(
        "User 'user123' does not exist in this project"
      );
    });

    it('should include validation details in error', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Validation failed', mockErrors.validationError.details)
      );

      await expect(client.events.track('', 'user1')).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should throw error for 429 Too Many Requests', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(429, 'Rate limit exceeded')
      );

      await expect(client.users.get('user1')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('5xx server errors', () => {
    it('should throw error with message for 500 Internal Server Error', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(500, 'Internal server error')
      );

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should throw error with message for 503 Service Unavailable', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(503, mockErrors.queueFullError.message)
      );

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'Event queue is full'
      );
    });

    it('should throw error for 502 Bad Gateway', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(502, 'Bad Gateway')
      );

      await expect(client.users.get('user1')).rejects.toThrow(
        'Bad Gateway'
      );
    });
  });

  describe('network errors', () => {
    it('should throw error for network timeout', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'timeout'
      );
    });

    it('should throw error for connection refused', async () => {
      const connectionError = new Error('connect ECONNREFUSED');
      (connectionError as any).code = 'ECONNREFUSED';
      mockAxiosInstance.get.mockRejectedValue(connectionError);

      await expect(client.users.get('user1')).rejects.toThrow(
        'ECONNREFUSED'
      );
    });

    it('should throw error for DNS lookup failure', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND');
      (dnsError as any).code = 'ENOTFOUND';
      mockAxiosInstance.get.mockRejectedValue(dnsError);

      await expect(client.users.get('user1')).rejects.toThrow(
        'ENOTFOUND'
      );
    });
  });

  describe('malformed responses', () => {
    it('should handle response without error message', async () => {
      const error: any = new Error('Request failed');
      error.response = {
        status: 500,
        data: {},
      };
      error.isAxiosError = true;
      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'Request failed'
      );
    });

    it('should handle response with null data', async () => {
      const error: any = new Error('Request failed');
      error.response = {
        status: 500,
        data: null,
      };
      error.isAxiosError = true;
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.users.get('user1')).rejects.toThrow(
        'Request failed'
      );
    });
  });

  describe('error detail preservation', () => {
    it('should preserve error details from API response', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Validation failed', [
          { field: 'user_id', message: 'User ID is required' },
          { field: 'event_name', message: 'Event name is required' },
        ])
      );

      try {
        await client.events.track('', '');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Validation failed');
      }
    });

    it('should handle errors with nested details', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Complex validation error', {
          errors: {
            properties: {
              amount: 'Must be a positive number',
            },
          },
        })
      );

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'Complex validation error'
      );
    });
  });

  describe('non-axios errors', () => {
    it('should rethrow non-axios errors', async () => {
      const customError = new Error('Custom error');
      mockAxiosInstance.post.mockRejectedValue(customError);

      await expect(client.events.track('test', 'user1')).rejects.toThrow(
        'Custom error'
      );
    });

    it('should handle TypeError', async () => {
      const typeError = new TypeError('Cannot read property');
      mockAxiosInstance.get.mockRejectedValue(typeError);

      await expect(client.users.get('user1')).rejects.toThrow(
        'Cannot read property'
      );
    });
  });
});
