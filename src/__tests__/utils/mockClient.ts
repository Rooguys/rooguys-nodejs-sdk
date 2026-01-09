import { AxiosResponse } from 'axios';
import { Rooguys } from '../../index';
import { HttpClient, ApiResponse, RateLimitInfo } from '../../http-client';

export interface MockAxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
  request: jest.Mock;
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
}

export function createMockAxiosInstance(): MockAxiosInstance {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
}

/**
 * Create a mock Rooguys client with mocked HTTP client
 * Returns both the client and the mock axios instance for setting up expectations
 */
export function createMockRooguysClient(apiKey = 'test-api-key'): {
  client: Rooguys;
  mockAxios: MockAxiosInstance;
} {
  const client = new Rooguys(apiKey);
  const mockAxios = createMockAxiosInstance();
  
  // Access the internal HttpClient and replace its axios instance
  const httpClient = (client as any)._httpClient as HttpClient;
  (httpClient as any).client = mockAxios;
  
  return { client, mockAxios };
}

/**
 * Create a mock AxiosResponse with rate limit headers
 */
export function mockAxiosResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {}
): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {
      'x-ratelimit-limit': '1000',
      'x-ratelimit-remaining': '999',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      ...headers,
    },
    config: {} as any,
  };
}

/**
 * Create a mock AxiosResponse for standardized API format
 */
export function mockStandardizedResponse<T>(
  data: T,
  requestId = 'req-123',
  headers: Record<string, string> = {}
): AxiosResponse<{ success: true; data: T; request_id: string }> {
  return mockAxiosResponse(
    {
      success: true as const,
      data,
      request_id: requestId,
    },
    200,
    {
      'x-request-id': requestId,
      ...headers,
    }
  );
}

/**
 * Create a mock success response (legacy format - data directly in response)
 */
export function mockSuccessResponse<T>(
  data: T,
  headers: Record<string, string> = {}
): AxiosResponse<T> {
  return mockAxiosResponse(data, 200, headers);
}

/**
 * Create a mock error that mimics an Axios error
 */
export function mockErrorResponse(
  status: number,
  message: string,
  code?: string,
  details?: Array<{ field: string; message: string }>
): any {
  const error: any = new Error(message);
  error.response = {
    status,
    data: {
      success: false,
      error: {
        message,
        code: code || 'ERROR',
        details,
      },
      request_id: 'req-error-123',
    },
    headers: {
      'x-ratelimit-limit': '1000',
      'x-ratelimit-remaining': '999',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      'x-request-id': 'req-error-123',
    },
  };
  error.isAxiosError = true;
  return error;
}

/**
 * Create a mock rate limit error
 */
export function mockRateLimitError(retryAfter = 60): any {
  const error: any = new Error('Rate limit exceeded');
  error.response = {
    status: 429,
    data: {
      success: false,
      error: {
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      request_id: 'req-ratelimit-123',
    },
    headers: {
      'x-ratelimit-limit': '1000',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + retryAfter),
      'retry-after': String(retryAfter),
      'x-request-id': 'req-ratelimit-123',
    },
  };
  error.isAxiosError = true;
  return error;
}

/**
 * Helper to set up mock for a successful request
 * The mock axios instance uses request() method internally
 */
export function setupMockRequest<T>(
  mockAxios: MockAxiosInstance,
  responseData: T,
  headers: Record<string, string> = {}
): void {
  mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData, 200, headers));
}

/**
 * Helper to set up mock for a failed request
 */
export function setupMockRequestError(
  mockAxios: MockAxiosInstance,
  status: number,
  message: string,
  code?: string,
  details?: Array<{ field: string; message: string }>
): void {
  mockAxios.request.mockRejectedValue(mockErrorResponse(status, message, code, details));
}

/**
 * Get the last request config from mock axios
 */
export function getLastRequestConfig(mockAxios: MockAxiosInstance): any {
  const calls = mockAxios.request.mock.calls;
  if (calls.length === 0) return null;
  return calls[calls.length - 1][0];
}

/**
 * Assert that a request was made with specific config
 */
export function expectRequestWith(
  mockAxios: MockAxiosInstance,
  expected: {
    method?: string;
    url?: string;
    data?: any;
    params?: any;
  }
): void {
  const lastConfig = getLastRequestConfig(mockAxios);
  expect(lastConfig).toBeTruthy();
  
  if (expected.method) {
    expect(lastConfig.method).toBe(expected.method);
  }
  if (expected.url) {
    expect(lastConfig.url).toBe(expected.url);
  }
  if (expected.data) {
    expect(lastConfig.data).toEqual(expected.data);
  }
  if (expected.params) {
    expect(lastConfig.params).toEqual(expected.params);
  }
}
