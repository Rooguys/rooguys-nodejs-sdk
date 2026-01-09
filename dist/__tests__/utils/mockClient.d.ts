import { AxiosResponse } from 'axios';
import { Rooguys } from '../../index';
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
        request: {
            use: jest.Mock;
        };
        response: {
            use: jest.Mock;
        };
    };
}
export declare function createMockAxiosInstance(): MockAxiosInstance;
/**
 * Create a mock Rooguys client with mocked HTTP client
 * Returns both the client and the mock axios instance for setting up expectations
 */
export declare function createMockRooguysClient(apiKey?: string): {
    client: Rooguys;
    mockAxios: MockAxiosInstance;
};
/**
 * Create a mock AxiosResponse with rate limit headers
 */
export declare function mockAxiosResponse<T>(data: T, status?: number, headers?: Record<string, string>): AxiosResponse<T>;
/**
 * Create a mock AxiosResponse for standardized API format
 */
export declare function mockStandardizedResponse<T>(data: T, requestId?: string, headers?: Record<string, string>): AxiosResponse<{
    success: true;
    data: T;
    request_id: string;
}>;
/**
 * Create a mock success response (legacy format - data directly in response)
 */
export declare function mockSuccessResponse<T>(data: T, headers?: Record<string, string>): AxiosResponse<T>;
/**
 * Create a mock error that mimics an Axios error
 */
export declare function mockErrorResponse(status: number, message: string, code?: string, details?: Array<{
    field: string;
    message: string;
}>): any;
/**
 * Create a mock rate limit error
 */
export declare function mockRateLimitError(retryAfter?: number): any;
/**
 * Helper to set up mock for a successful request
 * The mock axios instance uses request() method internally
 */
export declare function setupMockRequest<T>(mockAxios: MockAxiosInstance, responseData: T, headers?: Record<string, string>): void;
/**
 * Helper to set up mock for a failed request
 */
export declare function setupMockRequestError(mockAxios: MockAxiosInstance, status: number, message: string, code?: string, details?: Array<{
    field: string;
    message: string;
}>): void;
/**
 * Get the last request config from mock axios
 */
export declare function getLastRequestConfig(mockAxios: MockAxiosInstance): any;
/**
 * Assert that a request was made with specific config
 */
export declare function expectRequestWith(mockAxios: MockAxiosInstance, expected: {
    method?: string;
    url?: string;
    data?: any;
    params?: any;
}): void;
