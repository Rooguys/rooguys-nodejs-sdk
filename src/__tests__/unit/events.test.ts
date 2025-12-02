import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockSuccessResponse, mockErrorResponse } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Events Resource', () => {
  let client: Rooguys;
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('track', () => {
    it('should track an event with valid inputs', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      const result = await client.events.track('purchase-completed', 'user_123', {
        amount: 50.0,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        {
          event_name: 'purchase-completed',
          user_id: 'user_123',
          properties: { amount: 50.0 },
        },
        { params: { include_profile: undefined } }
      );
      expect(result).toEqual(mockResponses.trackEventResponse);
    });

    it('should track an event with empty properties', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      const result = await client.events.track('user-login', 'user_456');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        {
          event_name: 'user-login',
          user_id: 'user_456',
          properties: {},
        },
        { params: { include_profile: undefined } }
      );
      expect(result).toEqual(mockResponses.trackEventResponse);
    });

    it('should include profile when includeProfile is true', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventWithProfileResponse)
      );

      const result = await client.events.track(
        'purchase-completed',
        'user_123',
        { amount: 50.0 },
        { includeProfile: true }
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        {
          event_name: 'purchase-completed',
          user_id: 'user_123',
          properties: { amount: 50.0 },
        },
        { params: { include_profile: true } }
      );
      expect(result).toEqual(mockResponses.trackEventWithProfileResponse);
      expect(result.profile).toBeDefined();
    });

    it('should handle special characters in event name', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      await client.events.track('user-signup_v2', 'user_123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          event_name: 'user-signup_v2',
        }),
        expect.any(Object)
      );
    });

    it('should handle special characters in user ID', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      await client.events.track('user-login', 'user@example.com');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          user_id: 'user@example.com',
        }),
        expect.any(Object)
      );
    });

    it('should handle complex nested properties', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      const complexProperties = {
        order: {
          id: 'order_123',
          items: [
            { sku: 'ITEM1', quantity: 2 },
            { sku: 'ITEM2', quantity: 1 },
          ],
          total: 150.0,
        },
        metadata: {
          source: 'mobile_app',
          version: '2.1.0',
        },
      };

      await client.events.track('order_placed', 'user_123', complexProperties);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          properties: complexProperties,
        }),
        expect.any(Object)
      );
    });

    it('should throw error when API returns 400', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(400, 'Validation failed', mockErrors.validationError.details)
      );

      await expect(
        client.events.track('', 'user_123')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error when API returns 500', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(500, 'Internal server error')
      );

      await expect(
        client.events.track('user-login', 'user_123')
      ).rejects.toThrow('Internal server error');
    });

    it('should throw error when API returns 503 (queue full)', async () => {
      mockAxiosInstance.post.mockRejectedValue(
        mockErrorResponse(503, mockErrors.queueFullError.message)
      );

      await expect(
        client.events.track('user-login', 'user_123')
      ).rejects.toThrow('Event queue is full');
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      await expect(
        client.events.track('user-login', 'user_123')
      ).rejects.toThrow('timeout');
    });

    it('should handle properties with null values', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      await client.events.track('user_updated', 'user_123', {
        email: 'user@example.com',
        phone: null,
        address: null,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          properties: {
            email: 'user@example.com',
            phone: null,
            address: null,
          },
        }),
        expect.any(Object)
      );
    });

    it('should handle properties with boolean values', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      await client.events.track('feature_toggled', 'user_123', {
        feature_name: 'dark_mode',
        enabled: true,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          properties: {
            feature_name: 'dark_mode',
            enabled: true,
          },
        }),
        expect.any(Object)
      );
    });

    it('should handle properties with numeric values', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      await client.events.track('score_updated', 'user_123', {
        score: 1500,
        multiplier: 1.5,
        rank: 42,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          properties: {
            score: 1500,
            multiplier: 1.5,
            rank: 42,
          },
        }),
        expect.any(Object)
      );
    });

    it('should handle empty string properties', async () => {
      mockAxiosInstance.post.mockResolvedValue(
        mockSuccessResponse(mockResponses.trackEventResponse)
      );

      await client.events.track('form_submitted', 'user_123', {
        name: 'John Doe',
        comment: '',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        expect.objectContaining({
          properties: {
            name: 'John Doe',
            comment: '',
          },
        }),
        expect.any(Object)
      );
    });
  });
});
