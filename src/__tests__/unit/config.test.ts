import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance } from '../utils/mockClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SDK Configuration', () => {
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with API key', () => {
      const client = new Rooguys('test-api-key');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should use default base URL when not provided', () => {
      new Rooguys('test-api-key');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.rooguys.com/v1',
        })
      );
    });

    it('should use custom base URL when provided', () => {
      new Rooguys('test-api-key', {
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.api.com/v1',
        })
      );
    });

    it('should use default timeout when not provided', () => {
      new Rooguys('test-api-key');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });

    it('should use custom timeout when provided', () => {
      new Rooguys('test-api-key', {
        timeout: 30000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });

    it('should set Content-Type header', () => {
      new Rooguys('test-api-key');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should accept both baseUrl and timeout options', () => {
      new Rooguys('test-api-key', {
        baseUrl: 'https://staging.api.com/v1',
        timeout: 20000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://staging.api.com/v1',
          timeout: 20000,
        })
      );
    });

    it('should handle empty options object', () => {
      new Rooguys('test-api-key', {});

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.rooguys.com/v1',
          timeout: 10000,
        })
      );
    });

    it('should handle localhost base URL', () => {
      new Rooguys('test-api-key', {
        baseUrl: 'http://localhost:3001/v1',
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:3001/v1',
        })
      );
    });

    it('should handle very short timeout', () => {
      new Rooguys('test-api-key', {
        timeout: 1000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 1000,
        })
      );
    });

    it('should handle very long timeout', () => {
      new Rooguys('test-api-key', {
        timeout: 60000,
      });

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 60000,
        })
      );
    });
  });

  describe('API key handling', () => {
    it('should include API key in all requests', () => {
      new Rooguys('my-secret-key');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'my-secret-key',
          }),
        })
      );
    });

    it('should handle long API keys', () => {
      const longKey = 'sk_live_' + 'a'.repeat(100);
      new Rooguys(longKey);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': longKey,
          }),
        })
      );
    });

    it('should handle API keys with special characters', () => {
      const keyWithSpecialChars = 'sk_test_abc-123_XYZ.456';
      new Rooguys(keyWithSpecialChars);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': keyWithSpecialChars,
          }),
        })
      );
    });
  });
});
