/**
 * Property-Based Test: HTTP Request Construction
 * Feature: sdk-testing-enhancement, Property 1: HTTP Request Construction
 * 
 * Tests that any valid SDK method call constructs correct HTTP request
 * with proper method, URL, headers, and body structure.
 */

import fc from 'fast-check';
import { Rooguys } from '../../index';
import { createMockAxiosInstance } from '../utils/mockClient';
import { arbitraries } from '../utils/generators';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Property: HTTP Request Construction', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should construct valid POST request for event tracking', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.apiKey(),
        arbitraries.eventName(),
        arbitraries.userId(),
        arbitraries.properties(),
        async (apiKey, eventName, userId, properties) => {
          // Arrange
          mockClient.post.mockResolvedValue({
            data: { status: 'queued', message: 'Event accepted' }
          });
          const sdk = new Rooguys(apiKey);

          // Act
          await sdk.events.track(eventName, userId, properties);

          // Assert
          expect(mockClient.post).toHaveBeenCalledWith(
            '/event',
            {
              event_name: eventName,
              user_id: userId,
              properties,
            },
            expect.objectContaining({
              params: expect.any(Object)
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request for user profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.apiKey(),
        arbitraries.userId(),
        async (apiKey, userId) => {
          // Arrange
          mockClient.get.mockResolvedValue({
            data: { user_id: userId, points: 100 }
          });
          const sdk = new Rooguys(apiKey);

          // Act
          await sdk.users.get(userId);

          // Assert
          expect(mockClient.get).toHaveBeenCalledWith(`/user/${encodeURIComponent(userId)}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid POST request for bulk user fetch', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.apiKey(),
        arbitraries.userIds(),
        async (apiKey, userIds) => {
          // Arrange
          mockClient.post.mockResolvedValue({
            data: { users: [] }
          });
          const sdk = new Rooguys(apiKey);

          // Act
          await sdk.users.getBulk(userIds);

          // Assert
          expect(mockClient.post).toHaveBeenCalledWith(
            '/users/bulk',
            { user_ids: userIds }
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid GET request with query parameters for leaderboard', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.apiKey(),
        arbitraries.timeframe(),
        arbitraries.pagination(),
        async (apiKey, timeframe, { page, limit }) => {
          // Arrange
          mockClient.get.mockResolvedValue({
            data: { rankings: [], page, limit, total: 0 }
          });
          const sdk = new Rooguys(apiKey);

          // Act
          await sdk.leaderboards.getGlobal(timeframe as any, page, limit);

          // Assert
          expect(mockClient.get).toHaveBeenCalledWith(
            '/leaderboard',
            {
              params: { timeframe, page, limit }
            }
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should construct valid POST request for Aha score declaration', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.apiKey(),
        arbitraries.userId(),
        arbitraries.ahaValue(),
        async (apiKey, userId, value) => {
          // Arrange
          mockClient.post.mockResolvedValue({
            data: { success: true, message: 'Score declared' }
          });
          const sdk = new Rooguys(apiKey);

          // Act
          await sdk.aha.declare(userId, value);

          // Assert
          expect(mockClient.post).toHaveBeenCalledWith(
            '/aha/declare',
            {
              user_id: userId,
              value,
            }
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include API key in request headers', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraries.apiKey(),
        arbitraries.userId(),
        async (apiKey, userId) => {
          // Arrange
          mockClient.get.mockResolvedValue({
            data: { user_id: userId, points: 100 }
          });

          // Act
          const sdk = new Rooguys(apiKey);
          await sdk.users.get(userId);

          // Assert - verify axios.create was called with correct headers
          expect(mockedAxios.create).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
              })
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
