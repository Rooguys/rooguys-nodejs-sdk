"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockAxiosInstance = createMockAxiosInstance;
exports.mockSuccessResponse = mockSuccessResponse;
exports.mockErrorResponse = mockErrorResponse;
function createMockAxiosInstance() {
    return {
        get: jest.fn(),
        post: jest.fn(),
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
function mockSuccessResponse(data) {
    return { data };
}
function mockErrorResponse(status, message, details) {
    const error = new Error(message);
    error.response = {
        status,
        data: {
            error: message,
            details,
        },
    };
    error.isAxiosError = true;
    return error;
}
