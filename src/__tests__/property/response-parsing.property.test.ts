/**
 * Property-Based Test: Response Parsing Round-Trip
 * Task 7.2: Property test for response parsing
 * Validates: Requirements 2.1, 2.3, 2.4, 2.5
 * 
 * Tests that any successful response is parsed correctly and data structure
 * is preserved including nested objects, arrays, and null values.
 */

import fc from 'fast-check';
import { Rooguys } from '../../index';
import { HttpClient } from '../../http-client';
import {
  createMockRooguysClient,
  mockAxiosResponse,
  MockAxiosInstance,
} from '../utils/mockClient';

describe('Property: Response Parsing Round-Trip', () => {
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

  it('should preserve nested object structures in responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 255 }),
        fc.record({
          user_id: fc.string(),
          points: fc.integer(),
          level: fc.record({
            id: fc.string(),
            name: fc.string(),
            level_number: fc.integer(),
          }),
          next_level: fc.option(fc.record({
            id: fc.string(),
            name: fc.string(),
            points_required: fc.integer(),
          }), { nil: null }),
          metrics: fc.dictionary(fc.string(), fc.integer()),
        }),
        async (userId, responseData) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData));

          // Act
          const result = await client.users.get(userId);

          // Assert - SDK preserves the response structure
          expect(result.user_id).toEqual(responseData.user_id);
          expect(result.points).toEqual(responseData.points);
          expect(result.level).toEqual(responseData.level);
          expect(result.next_level).toEqual(responseData.next_level);
          expect(result.metrics).toEqual(responseData.metrics);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve arrays in responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 255 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.record({
          user_id: fc.string(),
          points: fc.integer(),
        }), { minLength: 0, maxLength: 20 }),
        async (userIds, usersData) => {
          // Arrange
          const responseData = { users: usersData };
          mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData));

          // Act
          const result = await client.users.getBulk(userIds);

          // Assert
          expect(Array.isArray(result.users)).toBe(true);
          expect(result.users).toHaveLength(usersData.length);
          result.users.forEach((user, index) => {
            expect(user.user_id).toEqual(usersData[index].user_id);
            expect(user.points).toEqual(usersData[index].points);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve null values in aha score responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 255 }),
        fc.record({
          user_id: fc.string(),
          current_score: fc.integer({ min: 0, max: 100 }),
          declarative_score: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
          inferred_score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
          status: fc.constantFrom('not_started', 'progressing', 'activated'),
          history: fc.record({
            initial: fc.option(fc.integer(), { nil: null }),
            initial_date: fc.option(fc.string(), { nil: null }),
            previous: fc.option(fc.integer(), { nil: null }),
          }),
        }),
        async (userId, ahaData) => {
          // Arrange - mock the wrapped response { success: true, data: {...} }
          const responseData = { success: true, data: ahaData };
          mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData));

          // Act
          const result = await client.aha.getUserScore(userId);

          // Assert - SDK unwraps { success: true, data: {...} } to just the data part
          const data = result as any;
          expect(data.declarative_score).toBe(ahaData.declarative_score);
          expect(data.inferred_score).toBe(ahaData.inferred_score);
          expect(data.history.initial).toBe(ahaData.history.initial);
          expect(data.history.initial_date).toBe(ahaData.history.initial_date);
          expect(data.history.previous).toBe(ahaData.history.previous);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty objects and arrays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('all-time', 'weekly', 'monthly'),
        async (timeframe) => {
          // Arrange
          const responseData = {
            timeframe,
            page: 1,
            limit: 50,
            total: 0,
            rankings: [],
          };
          mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData));

          // Act
          const result = await client.leaderboards.getGlobal(timeframe as any);

          // Assert
          expect(Array.isArray(result.rankings)).toBe(true);
          expect(result.rankings).toHaveLength(0);
          expect(result.timeframe).toBe(timeframe);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve complex nested structures with cache metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          timeframe: fc.constantFrom('all-time', 'weekly', 'monthly'),
          page: fc.integer({ min: 1, max: 100 }),
          limit: fc.integer({ min: 1, max: 100 }),
          total: fc.integer({ min: 0, max: 10000 }),
          rankings: fc.array(fc.record({
            rank: fc.integer({ min: 1, max: 1000 }),
            user_id: fc.string(),
            points: fc.integer({ min: 0, max: 100000 }),
            percentile: fc.option(fc.float({ min: 0, max: 100 }), { nil: null }),
          }), { minLength: 0, maxLength: 10 }),
          cache_metadata: fc.option(fc.record({
            cached_at: fc.string(),
            ttl: fc.integer({ min: 0, max: 3600 }),
          }), { nil: undefined }),
        }),
        async (responseData) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData));

          // Act
          const result = await client.leaderboards.getGlobal();

          // Assert
          expect(result.timeframe).toBe(responseData.timeframe);
          expect(result.page).toBe(responseData.page);
          expect(result.limit).toBe(responseData.limit);
          expect(result.total).toBe(responseData.total);
          expect(result.rankings).toHaveLength(responseData.rankings.length);
          
          // Verify each ranking entry
          result.rankings.forEach((entry, index) => {
            expect(entry.rank).toBe(responseData.rankings[index].rank);
            expect(entry.user_id).toBe(responseData.rankings[index].user_id);
            expect(entry.points).toBe(responseData.rankings[index].points);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve badge list structures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          badges: fc.array(fc.record({
            id: fc.string(),
            name: fc.string(),
            description: fc.option(fc.string(), { nil: null }),
            icon_url: fc.option(fc.string(), { nil: null }),
            is_active: fc.boolean(),
          }), { minLength: 0, maxLength: 10 }),
          pagination: fc.record({
            page: fc.integer({ min: 1, max: 100 }),
            limit: fc.integer({ min: 1, max: 100 }),
            total: fc.integer({ min: 0, max: 1000 }),
            totalPages: fc.integer({ min: 0, max: 100 }),
          }),
        }),
        async (responseData) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse(responseData));

          // Act
          const result = await client.badges.list();

          // Assert
          expect(result.badges).toHaveLength(responseData.badges.length);
          expect(result.pagination).toEqual(responseData.pagination);
          
          result.badges.forEach((badge, index) => {
            expect(badge.id).toBe(responseData.badges[index].id);
            expect(badge.name).toBe(responseData.badges[index].name);
            expect(badge.description).toBe(responseData.badges[index].description);
            expect(badge.icon_url).toBe(responseData.badges[index].icon_url);
            expect(badge.is_active).toBe(responseData.badges[index].is_active);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
