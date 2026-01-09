"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockAxiosInstance = createMockAxiosInstance;
exports.createMockRooguysClient = createMockRooguysClient;
exports.mockAxiosResponse = mockAxiosResponse;
exports.mockStandardizedResponse = mockStandardizedResponse;
exports.mockSuccessResponse = mockSuccessResponse;
exports.mockErrorResponse = mockErrorResponse;
exports.mockRateLimitError = mockRateLimitError;
exports.setupMockRequest = setupMockRequest;
exports.setupMockRequestError = setupMockRequestError;
exports.getLastRequestConfig = getLastRequestConfig;
exports.expectRequestWith = expectRequestWith;
const index_1 = require("../../index");
function createMockAxiosInstance() {
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
function createMockRooguysClient(apiKey = 'test-api-key') {
    const client = new index_1.Rooguys(apiKey);
    const mockAxios = createMockAxiosInstance();
    // Access the internal HttpClient and replace its axios instance
    const httpClient = client._httpClient;
    httpClient.client = mockAxios;
    return { client, mockAxios };
}
/**
 * Create a mock AxiosResponse with rate limit headers
 */
function mockAxiosResponse(data, status = 200, headers = {}) {
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
        config: {},
    };
}
/**
 * Create a mock AxiosResponse for standardized API format
 */
function mockStandardizedResponse(data, requestId = 'req-123', headers = {}) {
    return mockAxiosResponse({
        success: true,
        data,
        request_id: requestId,
    }, 200, {
        'x-request-id': requestId,
        ...headers,
    });
}
/**
 * Create a mock success response (legacy format - data directly in response)
 */
function mockSuccessResponse(data, headers = {}) {
    return mockAxiosResponse(data, 200, headers);
}
/**
 * Create a mock error that mimics an Axios error
 */
function mockErrorResponse(status, message, code, details) {
    const error = new Error(message);
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
function mockRateLimitError(retryAfter = 60) {
    const error = new Error('Rate limit exceeded');
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
function setupMockRequest(mockAxios, responseData, headers = {}) {
    mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData, 200, headers));
}
/**
 * Helper to set up mock for a failed request
 */
function setupMockRequestError(mockAxios, status, message, code, details) {
    mockAxios.request.mockRejectedValue(mockErrorResponse(status, message, code, details));
}
/**
 * Get the last request config from mock axios
 */
function getLastRequestConfig(mockAxios) {
    const calls = mockAxios.request.mock.calls;
    if (calls.length === 0)
        return null;
    return calls[calls.length - 1][0];
}
/**
 * Assert that a request was made with specific config
 */
function expectRequestWith(mockAxios, expected) {
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
