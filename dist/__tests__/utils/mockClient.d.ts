export interface MockAxiosInstance {
    get: jest.Mock;
    post: jest.Mock;
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
export declare function mockSuccessResponse<T>(data: T): {
    data: T;
};
export declare function mockErrorResponse(status: number, message: string, details?: any): any;
