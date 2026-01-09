/**
 * Property-Based Tests: Node.js SDK Modules
 * Task 8.5: Property tests for batch validation, email validation, filter construction
 * 
 * Properties tested:
 * - Property 4: Batch Event Validation (Requirements 3.1, 3.2)
 * - Property 7: Email Validation (Requirements 4.5)
 * - Property 10: Leaderboard Filter Query Construction (Requirements 6.1, 6.2, 6.3)
 */

import fc from 'fast-check';
import { Rooguys } from '../../index';
import { ValidationError } from '../../errors';
import {
  createMockRooguysClient,
  mockAxiosResponse,
  getLastRequestConfig,
  MockAxiosInstance,
} from '../utils/mockClient';

describe('Property 4: Batch Event Validation', () => {
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

  it('should reject batch with more than 100 events before making API request', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array with 101-500 events
        fc.array(
          fc.record({
            eventName: fc.string({ minLength: 1, maxLength: 50 }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            properties: fc.dictionary(fc.string(), fc.string()),
          }),
          { minLength: 101, maxLength: 500 }
        ),
        async (events) => {
          // Act & Assert
          await expect(client.events.trackBatch(events)).rejects.toThrow(ValidationError);
          await expect(client.events.trackBatch(events)).rejects.toMatchObject({
            code: 'BATCH_TOO_LARGE',
          });
          
          // Verify no API request was made
          expect(mockAxios.request).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept batch with 1-100 events and make exactly one API request', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array with 1-100 events
        fc.array(
          fc.record({
            eventName: fc.string({ minLength: 1, maxLength: 50 }),
            userId: fc.string({ minLength: 1, maxLength: 50 }),
            properties: fc.dictionary(fc.string(), fc.string()),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        async (events) => {
          // Reset mock before each iteration
          mockAxios.request.mockReset();
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            results: events.map((_, index) => ({ index, status: 'queued' })),
          }));

          // Act
          await client.events.trackBatch(events);

          // Assert - exactly one API request was made
          expect(mockAxios.request).toHaveBeenCalledTimes(1);
          
          // Verify request was to batch endpoint
          const config = getLastRequestConfig(mockAxios);
          expect(config.url).toBe('/events/batch');
          expect(config.method).toBe('POST');
          expect(config.data.events).toHaveLength(events.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject empty batch before making API request', async () => {
    // Act & Assert
    await expect(client.events.trackBatch([])).rejects.toThrow(ValidationError);
    await expect(client.events.trackBatch([])).rejects.toMatchObject({
      code: 'EMPTY_EVENTS',
    });
    
    // Verify no API request was made
    expect(mockAxios.request).not.toHaveBeenCalled();
  });
});

describe('Property 7: Email Validation', () => {
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

  it('should reject invalid email formats before making API request (user create)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        // Generate invalid emails (no @ or no domain)
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}@`),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `@${s}`),
          fc.constant('invalid'),
          fc.constant('no-at-sign'),
          fc.constant('@nodomain'),
          fc.constant('missing@'),
        ),
        async (userId, invalidEmail) => {
          // Act & Assert
          await expect(client.users.create({ userId, email: invalidEmail })).rejects.toThrow(ValidationError);
          await expect(client.users.create({ userId, email: invalidEmail })).rejects.toMatchObject({
            code: 'INVALID_EMAIL',
          });
          
          // Verify no API request was made
          expect(mockAxios.request).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid email formats before making API request (user update)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        // Generate invalid emails
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}@`),
          fc.constant('invalid'),
          fc.constant('no-at-sign'),
        ),
        async (userId, invalidEmail) => {
          // Act & Assert
          await expect(client.users.update(userId, { email: invalidEmail })).rejects.toThrow(ValidationError);
          await expect(client.users.update(userId, { email: invalidEmail })).rejects.toMatchObject({
            code: 'INVALID_EMAIL',
          });
          
          // Verify no API request was made
          expect(mockAxios.request).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid email formats and make API request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        // Generate valid emails
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9._-]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9.-]+$/.test(s)),
          fc.constantFrom('com', 'org', 'net', 'io', 'co.uk')
        ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`),
        async (userId, validEmail) => {
          // Reset mock before each iteration
          mockAxios.request.mockReset();
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            user_id: userId,
            email: validEmail,
            points: 0,
          }));

          // Act
          await client.users.create({ userId, email: validEmail });

          // Assert - API request was made
          expect(mockAxios.request).toHaveBeenCalledTimes(1);
          
          const config = getLastRequestConfig(mockAxios);
          expect(config.data.email).toBe(validEmail);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow user creation without email', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // userId
        async (userId) => {
          // Reset mock before each iteration
          mockAxios.request.mockReset();
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            user_id: userId,
            points: 0,
          }));

          // Act
          await client.users.create({ userId });

          // Assert - API request was made
          expect(mockAxios.request).toHaveBeenCalledTimes(1);
          
          const config = getLastRequestConfig(mockAxios);
          expect(config.data.user_id).toBe(userId);
          expect(config.data.email).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 10: Leaderboard Filter Query Construction', () => {
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

  it('should include persona filter in query parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('Competitor', 'Explorer', 'Achiever', 'Socializer'),
        async (persona) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page: 1,
            limit: 50,
            total: 0,
          }));

          // Act
          await client.leaderboards.getGlobal({ persona });

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.params.persona).toBe(persona);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include level range filters in query parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 51, max: 100 }),
        async (minLevel, maxLevel) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page: 1,
            limit: 50,
            total: 0,
          }));

          // Act
          await client.leaderboards.getGlobal({ minLevel, maxLevel });

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.params.min_level).toBe(minLevel);
          expect(config.params.max_level).toBe(maxLevel);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format date filters as ISO 8601 strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
        async (startDate, endDate) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page: 1,
            limit: 50,
            total: 0,
          }));

          // Act
          await client.leaderboards.getGlobal({ startDate, endDate });

          // Assert
          const config = getLastRequestConfig(mockAxios);
          
          // Verify dates are ISO 8601 formatted
          expect(config.params.start_date).toBe(startDate.toISOString());
          expect(config.params.end_date).toBe(endDate.toISOString());
          
          // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
          expect(config.params.start_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
          expect(config.params.end_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include all filter parameters when provided together', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          persona: fc.constantFrom('Competitor', 'Explorer', 'Achiever', 'Socializer'),
          minLevel: fc.integer({ min: 1, max: 50 }),
          maxLevel: fc.integer({ min: 51, max: 100 }),
          startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
          endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          page: fc.integer({ min: 1, max: 100 }),
          limit: fc.integer({ min: 1, max: 100 }),
        }),
        async (filters) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page: filters.page,
            limit: filters.limit,
            total: 0,
          }));

          // Act
          await client.leaderboards.getGlobal(filters);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.params.persona).toBe(filters.persona);
          expect(config.params.min_level).toBe(filters.minLevel);
          expect(config.params.max_level).toBe(filters.maxLevel);
          expect(config.params.start_date).toBe(filters.startDate.toISOString());
          expect(config.params.end_date).toBe(filters.endDate.toISOString());
          expect(config.params.page).toBe(filters.page);
          expect(config.params.limit).toBe(filters.limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work with custom leaderboard endpoint with filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.record({
          persona: fc.option(fc.constantFrom('Competitor', 'Explorer', 'Achiever', 'Socializer'), { nil: undefined }),
          minLevel: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
          maxLevel: fc.option(fc.integer({ min: 51, max: 100 }), { nil: undefined }),
        }),
        async (leaderboardId, filters) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page: 1,
            limit: 50,
            total: 0,
          }));

          // Act
          await client.leaderboards.getCustom(leaderboardId, filters);

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.url).toBe(`/leaderboards/${encodeURIComponent(leaderboardId)}`);
          
          // Verify only provided filters are included
          if (filters.persona !== undefined) {
            expect(config.params.persona).toBe(filters.persona);
          }
          if (filters.minLevel !== undefined) {
            expect(config.params.min_level).toBe(filters.minLevel);
          }
          if (filters.maxLevel !== undefined) {
            expect(config.params.max_level).toBe(filters.maxLevel);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include undefined filter parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('all-time', 'weekly', 'monthly'),
        async (timeframe) => {
          // Arrange
          mockAxios.request.mockResolvedValue(mockAxiosResponse({
            rankings: [],
            page: 1,
            limit: 50,
            total: 0,
          }));

          // Act - call with no filters
          await client.leaderboards.getGlobal({ timeframe: timeframe as any });

          // Assert
          const config = getLastRequestConfig(mockAxios);
          expect(config.params.timeframe).toBe(timeframe);
          
          // Verify undefined filters are not included
          expect(config.params.persona).toBeUndefined();
          expect(config.params.min_level).toBeUndefined();
          expect(config.params.max_level).toBeUndefined();
          expect(config.params.start_date).toBeUndefined();
          expect(config.params.end_date).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
