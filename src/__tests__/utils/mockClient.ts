import { AxiosInstance } from 'axios';

export interface MockAxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
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

export function mockSuccessResponse<T>(data: T) {
  return { data };
}

export function mockErrorResponse(status: number, message: string, details?: any) {
  const error: any = new Error(message);
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
