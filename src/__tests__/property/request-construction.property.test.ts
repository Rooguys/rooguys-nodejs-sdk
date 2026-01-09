/**
 * Property-Based Test: HTTP Request Construction
 * Feature: sdk-testing-enhancement, Property 1: HTTP Request Construction
 * Validates: Requirements 1.1, 3.1
 * 
 * Tests that any valid SDK method call constructs correct HTTP request
 * with proper method, URL, headers, and body structure.
 */

import fc from 'fast-check';
import { Rooguys } from '../../index';
import {
  createMockRooguysClient,
  mockAxiosResponse,
  getLastRequestConfig,
  MockAxiosInstance,
} from '../utils/mockClient';
import { arbitraries } from '../utils/generators';

describe('Property: HTTP Request Construction', () => {
  let client: Rooguys;
  let mockAxios: MockAxiosInstance;

  beforeEach(() => {
    const mock = createMockRooguysClient();
    client = mock.client;
    mockAxios = mock.mockAxios;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should construct valid POST request for event tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.eventName(),
        arbitraries.userId(),
        arbitraries.properties(),
        async (eventName, userId, properties) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            status: 'queued',
            message: 'Event accepted'
          }));

          // Act
          await client.events.track(eventName, userId, properties);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('POST');
          expect(config.url).toBe('/events');
          expect(config.data).toEqual({
            event_name: eventName,
            user_id: userId,
            properties,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request for user profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.userId(),
        async (userId) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            user_id: userId,
            points: 100
          }));

          // Act
          await client.users.get(userId);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('GET');
          expect(config.url).toBe(`/users/${encodeURIComponent(userId)}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid POST request for bulk user fetch', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.userIds(),
        async (userIds) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            users: []
          }));

          // Act
          await client.users.getBulk(userIds);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('POST');
          expect(config.url).toBe('/users/bulk');
          expect(config.data).toEqual({ user_ids: userIds });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request with query parameters for leaderboard', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.timeframe(),
        arbitraries.pagination(),
        async (timeframe, { page, limit }) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page,
            limit,
            total: 0
          }));

          // Act
          await client.leaderboards.getGlobal(timeframe as any, page, limit);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('GET');
          expect(config.url).toBe('/leaderboards/global');
          expect(config.params).toEqual(expect.objectContaining({
            timeframe,
            page,
            limit
          }));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid POST request for Aha score declaration', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.userId(),
        arbitraries.ahaValue(),
        async (userId, value) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            success: true,
            message: 'Score declared'
          }));

          // Act
          await client.aha.declare(userId, value);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('POST');
          expect(config.url).toBe('/aha/declare');
          expect(config.data).toEqual({
            user_id: userId,
            value,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request for badges list', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.pagination(),
        fc.boolean(),
        async ({ page, limit }, activeOnly) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            badges: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }));

          // Act
          await client.badges.list(page, limit, activeOnly);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('GET');
          expect(config.url).toBe('/badges');
          expect(config.params).toEqual({
            page,
            limit,
            active_only: activeOnly
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request for levels list', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.pagination(),
        async ({ page, limit }) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            levels: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }));

          // Act
          await client.levels.list(page, limit);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('GET');
          expect(config.url).toBe('/levels');
          expect(config.params).toEqual({ page, limit });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request for questionnaire by slug', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
        async (slug) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            id: 'q1',
            slug,
            title: 'Test',
            questions: []
          }));

          // Act
          await client.questionnaires.get(slug);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.method).toBe('GET');
          expect(config.url).toBe(`/questionnaires/${slug}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
