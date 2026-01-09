import { Rooguys, RooguysError, ValidationError, AuthenticationError, NotFoundError, RateLimitError, ServerError } from '../../index';
import {
  createMockRooguysClient,
  setupMockRequest,
  setupMockRequestError,
  mockErrorResponse,
  MockAxiosInstance,
} from '../utils/mockClient';
import { mockErrors } from '../fixtures/responses';

describe('Error Handling', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  describe('4xx client errors', () => {
    it('should throw ValidationError for 400 Bad Request', async () => {
      setupMockRequestError(mockAxios, 400, 'Bad Request', 'VALIDATION_ERROR');

      await expect(client.events.track('test', 'user1')).rejects.toThrow(ValidationError);
    });

    it('should throw AuthenticationError for 401 Unauthorized', async () => {
      setupMockRequestError(mockAxios, 401, 'Invalid or missing API key', 'UNAUTHORIZED');

      await expect(client.users.get('user1')).rejects.toThrow(AuthenticationError);
    });

    it('should throw NotFoundError for 404 Not Found', async () => {
      setupMockRequestError(mockAxios, 404, "User 'user123' does not exist in this project", 'NOT_FOUND');

      await expect(client.users.get('nonexistent')).rejects.toThrow(NotFoundError);
    });

    it('should include validation details in error', async () => {
      setupMockRequestError(mockAxios, 400, 'Validation failed', 'VALIDATION_ERROR', [
        { field: 'user_id', message: 'User ID is required' },
      ]);

      try {
        await client.events.track('', 'user1');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).fieldErrors).toBeDefined();
      }
    });

    it('should throw RateLimitError for 429 Too Many Requests', async () => {
      const error = mockErrorResponse(429, 'Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
      error.response.headers['retry-after'] = '60';
      mockAxios.request.mockRejectedValue(error);

      await expect(client.users.get('user1')).rejects.toThrow(RateLimitError);
    });
  });

  describe('5xx server errors', () => {
    it('should throw ServerError for 500 Internal Server Error', async () => {
      setupMockRequestError(mockAxios, 500, 'Internal server error', 'SERVER_ERROR');

      await expect(client.events.track('test', 'user1')).rejects.toThrow(ServerError);
    });

    it('should throw ServerError for 503 Service Unavailable', async () => {
      setupMockRequestError(mockAxios, 503, 'Event queue is full. Please retry later.', 'SERVICE_UNAVAILABLE');

      await expect(client.events.track('test', 'user1')).rejects.toThrow(ServerError);
    });

    it('should throw ServerError for 502 Bad Gateway', async () => {
      setupMockRequestError(mockAxios, 502, 'Bad Gateway', 'BAD_GATEWAY');

      await expect(client.users.get('user1')).rejects.toThrow(ServerError);
    });
  });

  describe('network errors', () => {
    it('should throw RooguysError for network timeout', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      mockAxios.request.mockRejectedValue(timeoutError);

      await expect(client.events.track('test', 'user1')).rejects.toThrow(RooguysError);
    });

    it('should throw RooguysError for connection refused', async () => {
      const connectionError = new Error('connect ECONNREFUSED');
      mockAxios.request.mockRejectedValue(connectionError);

      await expect(client.users.get('user1')).rejects.toThrow(RooguysError);
    });

    it('should throw RooguysError for DNS lookup failure', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND');
      mockAxios.request.mockRejectedValue(dnsError);

      await expect(client.users.get('user1')).rejects.toThrow(RooguysError);
    });
  });

  describe('error properties', () => {
    it('should include status code in error', async () => {
      setupMockRequestError(mockAxios, 404, 'Not found', 'NOT_FOUND');

      try {
        await client.users.get('user1');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).statusCode).toBe(404);
      }
    });

    it('should include error code in error', async () => {
      setupMockRequestError(mockAxios, 400, 'Validation failed', 'VALIDATION_ERROR');

      try {
        await client.events.track('test', 'user1');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('should include request ID in error when available', async () => {
      setupMockRequestError(mockAxios, 500, 'Server error', 'SERVER_ERROR');

      try {
        await client.users.get('user1');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).requestId).toBeDefined();
      }
    });
  });

  describe('error class hierarchy', () => {
    it('ValidationError should be instance of RooguysError', () => {
      const error = new ValidationError('Test error');
      expect(error).toBeInstanceOf(RooguysError);
      expect(error).toBeInstanceOf(Error);
    });

    it('AuthenticationError should be instance of RooguysError', () => {
      const error = new AuthenticationError('Test error');
      expect(error).toBeInstanceOf(RooguysError);
      expect(error).toBeInstanceOf(Error);
    });

    it('NotFoundError should be instance of RooguysError', () => {
      const error = new NotFoundError('Test error');
      expect(error).toBeInstanceOf(RooguysError);
      expect(error).toBeInstanceOf(Error);
    });

    it('RateLimitError should be instance of RooguysError', () => {
      const error = new RateLimitError('Test error', { retryAfter: 60 });
      expect(error).toBeInstanceOf(RooguysError);
      expect(error).toBeInstanceOf(Error);
      expect(error.retryAfter).toBe(60);
    });

    it('ServerError should be instance of RooguysError', () => {
      const error = new ServerError('Test error');
      expect(error).toBeInstanceOf(RooguysError);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
