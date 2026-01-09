import { Rooguys, ValidationError } from '../../index';
import {
  createMockRooguysClient,
  setupMockRequest,
  setupMockRequestError,
  expectRequestWith,
  MockAxiosInstance,
} from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

describe('Events Resource', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  describe('track', () => {
    it('should track an event with valid inputs', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

      const result = await client.events.track('purchase_completed', 'user_123', {
        amount: 50.0,
      });

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: {
          event_name: 'purchase_completed',
          user_id: 'user_123',
          properties: { amount: 50.0 },
        },
      });
      expect(result).toEqual(mockResponses.trackEventResponse);
    });

    it('should track an event with empty properties', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

      const result = await client.events.track('user_login', 'user_456');

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: {
          event_name: 'user_login',
          user_id: 'user_456',
          properties: {},
        },
      });
      expect(result).toEqual(mockResponses.trackEventResponse);
    });

    it('should include profile when includeProfile is true', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventWithProfileResponse);

      const result = await client.events.track(
        'purchase_completed',
        'user_123',
        { amount: 50.0 },
        { includeProfile: true }
      );

      expect(result).toEqual(mockResponses.trackEventWithProfileResponse);
      expect(result.profile).toBeDefined();
    });

    it('should handle special characters in event name', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

      await client.events.track('user-signup_v2', 'user_123');

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: expect.objectContaining({
          event_name: 'user-signup_v2',
        }),
      });
    });

    it('should handle special characters in user ID', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

      await client.events.track('user_login', 'user@example.com');

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: expect.objectContaining({
          user_id: 'user@example.com',
        }),
      });
    });

    it('should handle complex nested properties', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

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

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: expect.objectContaining({
          properties: complexProperties,
        }),
      });
    });

    it('should throw error when API returns 400', async () => {
      setupMockRequestError(mockAxios, 400, 'Validation failed', 'VALIDATION_ERROR');

      await expect(
        client.events.track('', 'user_123')
      ).rejects.toThrow('Validation failed');
    });

    it('should throw error when API returns 500', async () => {
      setupMockRequestError(mockAxios, 500, 'Internal server error', 'SERVER_ERROR');

      await expect(
        client.events.track('user_login', 'user_123')
      ).rejects.toThrow('Internal server error');
    });

    it('should throw error when API returns 503 (queue full)', async () => {
      setupMockRequestError(mockAxios, 503, 'Event queue is full. Please retry later.', 'SERVICE_UNAVAILABLE');

      await expect(
        client.events.track('user_login', 'user_123')
      ).rejects.toThrow('Event queue is full');
    });

    it('should handle properties with null values', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

      await client.events.track('user_updated', 'user_123', {
        email: 'user@example.com',
        phone: null,
        address: null,
      });

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: expect.objectContaining({
          properties: {
            email: 'user@example.com',
            phone: null,
            address: null,
          },
        }),
      });
    });

    it('should handle properties with boolean values', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);

      await client.events.track('feature_toggled', 'user_123', {
        feature_name: 'dark_mode',
        enabled: true,
      });

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: expect.objectContaining({
          properties: {
            feature_name: 'dark_mode',
            enabled: true,
          },
        }),
      });
    });

    it('should handle custom timestamp', async () => {
      setupMockRequest(mockAxios, mockResponses.trackEventResponse);
      const timestamp = new Date();

      await client.events.track('user_login', 'user_123', {}, { timestamp });

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events',
        data: expect.objectContaining({
          timestamp: timestamp.toISOString(),
        }),
      });
    });

    it('should reject timestamp more than 7 days old', async () => {
      const oldTimestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      await expect(
        client.events.track('user_login', 'user_123', {}, { timestamp: oldTimestamp })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('trackBatch', () => {
    it('should track multiple events', async () => {
      const batchResponse = { processed: 2, failed: 0 };
      setupMockRequest(mockAxios, batchResponse);

      const events = [
        { eventName: 'event1', userId: 'user1', properties: { a: 1 } },
        { eventName: 'event2', userId: 'user2', properties: { b: 2 } },
      ];

      const result = await client.events.trackBatch(events);

      expectRequestWith(mockAxios, {
        method: 'POST',
        url: '/events/batch',
      });
      expect(result).toEqual(batchResponse);
    });

    it('should throw error for empty events array', async () => {
      await expect(client.events.trackBatch([])).rejects.toThrow(ValidationError);
      await expect(client.events.trackBatch([])).rejects.toThrow('cannot be empty');
    });

    it('should throw error for more than 100 events', async () => {
      const manyEvents = Array.from({ length: 101 }, (_, i) => ({
        eventName: `event_${i}`,
        userId: `user_${i}`,
      }));

      await expect(client.events.trackBatch(manyEvents)).rejects.toThrow(ValidationError);
      await expect(client.events.trackBatch(manyEvents)).rejects.toThrow('maximum of 100');
    });

    it('should throw error for non-array input', async () => {
      await expect(client.events.trackBatch('not an array' as any)).rejects.toThrow(ValidationError);
    });
  });
});
