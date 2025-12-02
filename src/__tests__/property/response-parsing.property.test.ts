/**
 * Property-Based Test: Response Parsing Preservation
 * Feature: sdk-testing-enhancement, Property 2: Response Parsing Preservation
 * 
 * Tests that any successful response is parsed correctly and data structure
 * is preserved including nested objects, arrays, and null values.
 */

import fc from 'fast-check';
import { Rooguys } from '../../index';
import { createMockAxiosInstance } from '../utils/mockClient';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Property: Response Parsing Preservation', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve nested object structures in responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
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
        async (apiKey, userId, responseData) => {
          // Arrange
          mockClient.get.mockResolvedValue({ data: responseData });
          const sdk = new Rooguys(apiKey);

          // Act
          const result = await sdk.users.get(userId);

          // Assert
          expect(result).toEqual(responseData);
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
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.array(fc.string({ minLength: 1, maxLength: 255 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.record({
          user_id: fc.string(),
          points: fc.integer(),
        }), { minLength: 0, maxLength: 20 }),
        async (apiKey, userIds, usersData) => {
          // Arrange
          const responseData = { users: usersData };
          mockClient.post.mockResolvedValue({ data: responseData });
          const sdk = new Rooguys(apiKey);

          // Act
          const result = await sdk.users.getBulk(userIds);

          // Assert
          expect(result).toEqual(responseData);
          expect(Array.isArray(result.users)).toBe(true);
          expect(result.users).toHaveLength(usersData.length);
          expect(result.users).toEqual(usersData);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve null values in responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 255 }),
        fc.record({
          user_id: fc.string(),
          declarative_score: fc.option(fc.integer({ min: 1, max: 5 }), { nil: null }),
          inferred_score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
          history: fc.record({
            initial: fc.option(fc.integer(), { nil: null }),
            initial_date: fc.option(fc.string(), { nil: null }),
            previous: fc.option(fc.integer(), { nil: null }),
          }),
        }),
        async (apiKey, userId, responseData) => {
          // Arrange
          mockClient.get.mockResolvedValue({ data: responseData });
          const sdk = new Rooguys(apiKey);

          // Act
          const result = await sdk.aha.getUserScore(userId);

          // Assert
          expect(result).toEqual(responseData);
          expect((result as any).declarative_score).toBe(responseData.declarative_score);
          expect((result as any).inferred_score).toBe(responseData.inferred_score);
          expect((result as any).history.initial).toBe(responseData.history.initial);
          expect((result as any).history.initial_date).toBe(responseData.history.initial_date);
          expect((result as any).history.previous).toBe(responseData.history.previous);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty objects and arrays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.constantFrom('all-time', 'weekly', 'monthly'),
        async (apiKey, timeframe) => {
          // Arrange
          const responseData = {
            timeframe,
            page: 1,
            limit: 50,
            total: 0,
            rankings: [],
          };
          mockClient.get.mockResolvedValue({ data: responseData });
          const sdk = new Rooguys(apiKey);

          // Act
          const result = await sdk.leaderboards.getGlobal(timeframe as any);

          // Assert
          expect(result).toEqual(responseData);
          expect(Array.isArray(result.rankings)).toBe(true);
          expect(result.rankings).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve complex nested structures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.record({
          success: fc.boolean(),
          data: fc.record({
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
        }),
        async (apiKey, responseData) => {
          // Arrange
          mockClient.get.mockResolvedValue({ data: responseData });
          const sdk = new Rooguys(apiKey);

          // Act
          const result = await sdk.aha.getUserScore('test-user');

          // Assert
          expect(result).toEqual(responseData);
          expect(result.data).toEqual(responseData.data);
          expect(result.data.history).toEqual(responseData.data.history);
        }
      ),
      { numRuns: 100 }
    );
  });
});
