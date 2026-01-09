# Rooguys Node.js SDK

The official Node.js SDK for the Rooguys Gamification API with full TypeScript support.

## Installation

```bash
npm install @rooguys/sdk
```

## Initialization

```typescript
import { Rooguys, RooguysOptions } from '@rooguys/sdk';

const options: RooguysOptions = {
  baseUrl: 'https://api.rooguys.com/v1', // Optional
  timeout: 10000, // Optional, defaults to 10s
  // Rate limit handling
  onRateLimitWarning: (info) => {
    console.warn(`Rate limit: ${info.remaining}/${info.limit} remaining`);
  },
  autoRetry: true,
  maxRetries: 3,
};

const client = new Rooguys('YOUR_API_KEY', options);
```

## Migration Guide (v1.x to v2.x)

### Breaking Changes

1. **Event Tracking Endpoint**: The SDK now uses `/v1/events` instead of `/v1/event`
   ```typescript
   // Old (deprecated, still works with warning)
   await client.events.trackLegacy('event_name', 'user_id', properties);
   
   // New (recommended)
   await client.events.track('event-name', 'user_id', properties);
   ```

2. **Global Leaderboard Endpoint**: Now uses `/v1/leaderboards/global` with `timeframe` query parameter
   ```typescript
   // Both signatures work
   await client.leaderboards.getGlobal('weekly', 1, 10);
   await client.leaderboards.getGlobal({ timeframe: 'weekly', page: 1, limit: 10 });
   ```

3. **Response Format**: All responses now follow standardized format `{ success: true, data: {...} }`

### New Features

- Batch event tracking (`events.trackBatch`)
- User management (`users.create`, `users.update`, `users.createBatch`)
- User search (`users.search`)
- Field selection for user profiles
- Leaderboard filters (persona, level range, date range)
- "Around me" leaderboard view (`leaderboards.getAroundUser`)
- Health check endpoints
- Rate limit handling with auto-retry
- Full TypeScript type definitions

## Usage Examples

### Events

#### Track a Single Event

```typescript
import { TrackEventResponse, TrackOptions } from '@rooguys/sdk';

const options: TrackOptions = {
  includeProfile: true,
  idempotencyKey: 'unique-request-id'
};

const response: TrackEventResponse = await client.events.track(
  'level-completed',
  'user_123',
  { difficulty: 'hard', score: 1500 },
  options
);

console.log(`Event status: ${response.status}`);
if (response.profile) {
  console.log(`Updated points: ${response.profile.points}`);
}
```

#### Track Events with Custom Timestamp

```typescript
// Track historical events (up to 7 days in the past)
const response = await client.events.track(
  'purchase',
  'user_123',
  { amount: 99.99 },
  { timestamp: new Date('2024-01-15T10:30:00Z') }
);
```

#### Batch Event Tracking

```typescript
import { BatchEvent, BatchTrackResponse, BatchOptions } from '@rooguys/sdk';

const events: BatchEvent[] = [
  { eventName: 'page-view', userId: 'user_123', properties: { page: '/home' } },
  { eventName: 'button-click', userId: 'user_123', properties: { button: 'signup' } },
  { eventName: 'purchase', userId: 'user_456', properties: { amount: 50 }, timestamp: new Date() }
];

const options: BatchOptions = { idempotencyKey: 'batch-123' };
const response: BatchTrackResponse = await client.events.trackBatch(events, options);

// Check individual results
response.results.forEach((result, index) => {
  if (result.status === 'queued') {
    console.log(`Event ${index} queued successfully`);
  } else {
    console.error(`Event ${index} failed:`, result.error);
  }
});
```

### Users

#### Create a New User

```typescript
import { CreateUserData, UserProfile } from '@rooguys/sdk';

const userData: CreateUserData = {
  userId: 'user_123',
  displayName: 'John Doe',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  metadata: { plan: 'premium' }
};

const user: UserProfile = await client.users.create(userData);
```

#### Update User Profile

```typescript
import { UpdateUserData, UserProfile } from '@rooguys/sdk';

// Partial update - only sends provided fields
const updateData: UpdateUserData = {
  displayName: 'Johnny Doe',
  metadata: { plan: 'enterprise' }
};

const updated: UserProfile = await client.users.update('user_123', updateData);
```

#### Batch User Creation

```typescript
import { CreateUserData, BatchCreateResponse } from '@rooguys/sdk';

const users: CreateUserData[] = [
  { userId: 'user_1', displayName: 'User One', email: 'one@example.com' },
  { userId: 'user_2', displayName: 'User Two', email: 'two@example.com' },
  // ... up to 100 users
];

const response: BatchCreateResponse = await client.users.createBatch(users);
```

#### Get User Profile with Field Selection

```typescript
import { GetUserOptions, UserProfile } from '@rooguys/sdk';

const options: GetUserOptions = {
  fields: ['points', 'level', 'badges']
};

const user: UserProfile = await client.users.get('user_123', options);
```

#### Search Users

```typescript
import { SearchOptions, PaginatedResponse, UserProfile } from '@rooguys/sdk';

const options: SearchOptions = {
  page: 1,
  limit: 20,
  fields: ['userId', 'displayName', 'points']
};

const results: PaginatedResponse<UserProfile> = await client.users.search('john', options);

results.users?.forEach(user => {
  console.log(`${user.display_name}: ${user.points} points`);
});
```

#### Access Enhanced Profile Data

```typescript
const user: UserProfile = await client.users.get('user_123');

// Activity summary
if (user.activitySummary) {
  console.log(`Last active: ${user.activitySummary.lastEventAt}`);
  console.log(`Total events: ${user.activitySummary.eventCount}`);
  console.log(`Days active: ${user.activitySummary.daysActive}`);
}

// Streak information
if (user.streak) {
  console.log(`Current streak: ${user.streak.currentStreak} days`);
  console.log(`Longest streak: ${user.streak.longestStreak} days`);
}

// Inventory summary
if (user.inventory) {
  console.log(`Items owned: ${user.inventory.itemCount}`);
  console.log(`Active effects: ${user.inventory.activeEffects.join(', ')}`);
}
```

### Leaderboards

#### Global Leaderboard with Filters

```typescript
import { LeaderboardFilterOptions, LeaderboardResult } from '@rooguys/sdk';

const options: LeaderboardFilterOptions = {
  timeframe: 'weekly',
  page: 1,
  limit: 10,
  persona: 'competitor',
  minLevel: 5,
  maxLevel: 20,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
};

const leaderboard: LeaderboardResult = await client.leaderboards.getGlobal(options);

// Access cache metadata
if (leaderboard.cacheMetadata) {
  console.log(`Cached at: ${leaderboard.cacheMetadata.cachedAt}`);
  console.log(`TTL: ${leaderboard.cacheMetadata.ttl}s`);
}

// Rankings include percentile
leaderboard.rankings.forEach(entry => {
  console.log(`#${entry.rank} ${entry.user_id}: ${entry.points} pts (top ${entry.percentile}%)`);
});
```

#### Custom Leaderboard with Filters

```typescript
const customLb: LeaderboardResult = await client.leaderboards.getCustom('leaderboard_id', {
  page: 1,
  limit: 10,
  persona: 'achiever',
  minLevel: 10
});
```

#### "Around Me" View

```typescript
import { AroundUserResponse } from '@rooguys/sdk';

const aroundMe: AroundUserResponse = await client.leaderboards.getAroundUser(
  'leaderboard_id',
  'user_123',
  5  // 5 entries above and below
);

aroundMe.rankings.forEach(entry => {
  const marker = entry.user_id === 'user_123' ? '→' : ' ';
  console.log(`${marker} #${entry.rank} ${entry.user_id}: ${entry.points}`);
});
```

#### Get User Rank with Percentile

```typescript
import { UserRank } from '@rooguys/sdk';

const rank: UserRank = await client.leaderboards.getUserRank('leaderboard_id', 'user_123');

console.log(`Rank: #${rank.rank}`);
console.log(`Score: ${rank.points}`);
console.log(`Percentile: top ${rank.percentile}%`);
```

### Health Checks

```typescript
import { HealthCheckResponse } from '@rooguys/sdk';

// Full health check
const health: HealthCheckResponse = await client.health.check();
console.log(`Status: ${health.status}`);
console.log(`Version: ${health.version}`);

// Quick availability check
const isReady: boolean = await client.health.isReady();
if (isReady) {
  console.log('API is ready');
}
```

### Aha Score

```typescript
import { AhaDeclarationResult, AhaScoreResult } from '@rooguys/sdk';

// Declare user activation milestone (1-5)
const result: AhaDeclarationResult = await client.aha.declare('user_123', 4);
console.log(result.message);

// Get user's aha score
const score: AhaScoreResult = await client.aha.getUserScore('user_123');
console.log(`Current Score: ${score.data.current_score}`);
console.log(`Status: ${score.data.status}`);
```

## TypeScript Types

The SDK exports comprehensive TypeScript types for all operations:

### Core Types

```typescript
import {
  // SDK Options
  RooguysOptions,
  
  // User Types
  UserProfile,
  CreateUserData,
  UpdateUserData,
  GetUserOptions,
  SearchOptions,
  ActivitySummary,
  StreakInfo,
  InventorySummary,
  
  // Event Types
  TrackEventResponse,
  TrackOptions,
  BatchEvent,
  BatchTrackResponse,
  BatchOptions,
  
  // Leaderboard Types
  LeaderboardResult,
  LeaderboardFilterOptions,
  LeaderboardEntry,
  AroundUserResponse,
  UserRank,
  Timeframe,
  
  // Batch Types
  BatchCreateResponse,
  PaginatedResponse,
  
  // Other Types
  Badge,
  Level,
  Questionnaire,
  HealthCheckResponse,
  AhaDeclarationResult,
  AhaScoreResult,
} from '@rooguys/sdk';
```

### HTTP Client Types

```typescript
import {
  RateLimitInfo,
  CacheMetadata,
  Pagination,
  ApiResponse,
  RequestConfig,
  HttpClientOptions,
} from '@rooguys/sdk';
```

## API Reference

### Events

| Method | Return Type | Description |
|--------|-------------|-------------|
| `track(eventName, userId, properties?, options?)` | `Promise<TrackEventResponse>` | Track a single event |
| `trackBatch(events, options?)` | `Promise<BatchTrackResponse>` | Track multiple events (max 100) |
| `trackLegacy(eventName, userId, properties?, options?)` | `Promise<TrackEventResponse>` | **Deprecated** |

### Users

| Method | Return Type | Description |
|--------|-------------|-------------|
| `create(userData)` | `Promise<UserProfile>` | Create a new user |
| `update(userId, userData)` | `Promise<UserProfile>` | Update user profile |
| `createBatch(users)` | `Promise<BatchCreateResponse>` | Create multiple users (max 100) |
| `get(userId, options?)` | `Promise<UserProfile>` | Get user profile |
| `search(query, options?)` | `Promise<PaginatedResponse<UserProfile>>` | Search users |
| `getBulk(userIds)` | `Promise<{ users: UserProfile[] }>` | Get multiple profiles |
| `getBadges(userId)` | `Promise<{ badges: UserBadge[] }>` | Get user's badges |
| `getRank(userId, timeframe?)` | `Promise<UserRank>` | Get user's global rank |
| `submitAnswers(userId, questionnaireId, answers)` | `Promise<{ status, message }>` | Submit answers |

### Leaderboards

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getGlobal(timeframeOrOptions?, page?, limit?, options?)` | `Promise<LeaderboardResult>` | Get global leaderboard |
| `list(pageOrOptions?, limit?, search?)` | `Promise<LeaderboardListResult>` | List all leaderboards |
| `getCustom(leaderboardId, pageOrOptions?, ...)` | `Promise<LeaderboardResult>` | Get custom leaderboard |
| `getUserRank(leaderboardId, userId)` | `Promise<UserRank>` | Get user's rank |
| `getAroundUser(leaderboardId, userId, range?)` | `Promise<AroundUserResponse>` | Get entries around user |

### Badges

| Method | Return Type | Description |
|--------|-------------|-------------|
| `list(page?, limit?, activeOnly?)` | `Promise<BadgeListResult>` | List all badges |

### Levels

| Method | Return Type | Description |
|--------|-------------|-------------|
| `list(page?, limit?)` | `Promise<LevelListResult>` | List all levels |

### Questionnaires

| Method | Return Type | Description |
|--------|-------------|-------------|
| `get(slug)` | `Promise<Questionnaire>` | Get questionnaire by slug |
| `getActive()` | `Promise<Questionnaire>` | Get active questionnaire |

### Aha Score

| Method | Return Type | Description |
|--------|-------------|-------------|
| `declare(userId, value)` | `Promise<AhaDeclarationResult>` | Declare aha score (1-5) |
| `getUserScore(userId)` | `Promise<AhaScoreResult>` | Get user's aha score |

### Health

| Method | Return Type | Description |
|--------|-------------|-------------|
| `check()` | `Promise<HealthCheckResponse>` | Get full health status |
| `isReady()` | `Promise<boolean>` | Quick availability check |

## Error Handling

The SDK provides typed error classes for different error scenarios:

```typescript
import {
  Rooguys,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  FieldError
} from '@rooguys/sdk';

try {
  await client.users.create({ userId: 'user_123', email: 'invalid-email' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Field errors:', error.fieldErrors);
    console.error('Error code:', error.code);
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found');
  } else if (error instanceof ConflictError) {
    console.error('Resource already exists');
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof ServerError) {
    console.error('Server error:', error.message);
  }
  
  // All errors include requestId for debugging
  if (error instanceof RooguysError) {
    console.error('Request ID:', error.requestId);
  }
}
```

### Error Types

| Error Class | HTTP Status | Properties |
|-------------|-------------|------------|
| `ValidationError` | 400 | `fieldErrors?: FieldError[]` |
| `AuthenticationError` | 401 | - |
| `ForbiddenError` | 403 | - |
| `NotFoundError` | 404 | - |
| `ConflictError` | 409 | - |
| `RateLimitError` | 429 | `retryAfter: number` |
| `ServerError` | 500+ | - |

### Common Error Properties

All errors extend `RooguysError` and include:
- `message: string` - Human-readable error message
- `code: string` - Machine-readable error code
- `requestId?: string` - Unique request identifier
- `statusCode: number` - HTTP status code

### FieldError Type

```typescript
interface FieldError {
  field: string;
  message: string;
}
```

## Rate Limiting

The SDK provides built-in rate limit handling:

```typescript
const client = new Rooguys('YOUR_API_KEY', {
  // Get notified when 80% of rate limit is consumed
  onRateLimitWarning: (info: RateLimitInfo) => {
    console.warn(`Rate limit: ${info.remaining}/${info.limit} remaining`);
    console.warn(`Resets at: ${new Date(info.reset * 1000)}`);
  },
  
  // Automatically retry rate-limited requests
  autoRetry: true,
  maxRetries: 3
});
```

### RateLimitInfo Type

```typescript
interface RateLimitInfo {
  limit: number;      // Total requests allowed
  remaining: number;  // Requests remaining
  reset: number;      // Unix timestamp when limit resets
}
```

## Testing

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

The SDK maintains >90% test coverage with:
- Unit tests for all API methods
- Property-based tests using fast-check
- TypeScript type validation
- Error handling tests

## Requirements

- Node.js >= 18.x
- TypeScript >= 4.7 (for TypeScript users)

## License

MIT
