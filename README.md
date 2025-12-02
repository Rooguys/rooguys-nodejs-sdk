# Rooguys Node.js SDK

The official Node.js SDK for the Rooguys Gamification API.

## Installation

```bash
npm install @rooguys/sdk
```

## Initialization

```typescript
import { Rooguys } from '@rooguys/sdk';

const client = new Rooguys('YOUR_API_KEY', {
  baseUrl: 'https://api.rooguys.com/v1', // Optional, defaults to production
  timeout: 10000, // Optional, defaults to 10s
});
```

## Usage Examples

### 1. Track an Event

Track user actions to award points and unlock badges.

```typescript
try {
  const response = await client.events.track(
    'purchase_completed', // Event name
    'user_123',           // User ID
    { amount: 50.00 },    // Event properties
    { includeProfile: true } // Optional: Return updated profile
  );
  
  console.log(`Event status: ${response.status}`);
  if (response.profile) {
    console.log(`New points: ${response.profile.points}`);
  }
} catch (error) {
  console.error('Tracking failed:', error.message);
}
```

### 2. Get User Profile

Retrieve a user's current level, points, and badges.

```typescript
const user = await client.users.get('user_123');

console.log(`User: ${user.user_id}`);
console.log(`Points: ${user.points}`);
console.log(`Level: ${user.level?.name}`);
console.log('Badges:', user.badges.map(b => b.name).join(', '));
```

### 3. Global Leaderboard

Fetch the top players.

```typescript
// Get top 10 all-time
const leaderboard = await client.leaderboards.getGlobal('all-time', 1, 10);

leaderboard.rankings.forEach(entry => {
  console.log(`#${entry.rank} - ${entry.user_id} (${entry.points} pts)`);
});
```

### 4. Submit Questionnaire Answers

Submit answers for a user.

```typescript
await client.users.submitAnswers('user_123', 'questionnaire_id', [
  { question_id: 'q1', answer_option_id: 'opt_a' },
  { question_id: 'q2', answer_option_id: 'opt_b' }
]);
```

### 5. Aha Score - Declare User Activation

Track when users reach their "Aha Moment" with declarative scores (1-5).

```typescript
// Declare that a user has reached an activation milestone
const result = await client.aha.declare('user_123', 4);

console.log(result.message); // "Aha score declared successfully"
```

### 6. Aha Score - Get User Score

Retrieve a user's Aha Score, including declarative and inferred scores.

```typescript
const ahaScore = await client.aha.getUserScore('user_123');

console.log(`Current Score: ${ahaScore.data.current_score}`);
console.log(`Status: ${ahaScore.data.status}`); // 'not_started', 'progressing', or 'activated'
console.log(`Declarative Score: ${ahaScore.data.declarative_score}`);
console.log(`Inferred Score: ${ahaScore.data.inferred_score}`);

// Access history
if (ahaScore.data.history.initial) {
  console.log(`Initial Score: ${ahaScore.data.history.initial}`);
  console.log(`Initial Date: ${ahaScore.data.history.initial_date}`);
}
```

## API Reference

### Events

- `track(eventName: string, userId: string, properties?: object, options?: { includeProfile?: boolean }): Promise<TrackEventResponse>`

### Users

- `get(userId: string): Promise<UserProfile>`
- `getBulk(userIds: string[]): Promise<UserProfile[]>`
- `getBadges(userId: string): Promise<Badge[]>`
- `getRank(userId: string, timeframe?: 'all-time' | 'weekly' | 'monthly'): Promise<RankInfo>`
- `submitAnswers(userId: string, questionnaireId: string, answers: Answer[]): Promise<void>`

### Leaderboards

- `getGlobal(timeframe?: 'all-time' | 'weekly' | 'monthly', page?: number, limit?: number): Promise<LeaderboardResponse>`
- `list(page?: number, limit?: number, search?: string): Promise<LeaderboardListResponse>`
- `getCustom(leaderboardId: string, page?: number, limit?: number, search?: string): Promise<LeaderboardResponse>`
- `getUserRank(leaderboardId: string, userId: string): Promise<RankInfo>`

### Badges

- `list(page?: number, limit?: number, activeOnly?: boolean): Promise<BadgeListResponse>`

### Levels

- `list(page?: number, limit?: number): Promise<LevelListResponse>`

### Questionnaires

- `get(slug: string): Promise<Questionnaire>`
- `getActive(): Promise<Questionnaire>`

### Aha Score

- `declare(userId: string, value: number): Promise<AhaDeclarationResult>`
  - Declare a user's Aha Moment score (value must be between 1-5)
- `getUserScore(userId: string): Promise<AhaScoreResult>`
  - Retrieve a user's current Aha Score and history

## Error Handling

The SDK throws errors for non-2xx responses.

```typescript
try {
  await client.users.get('non_existent_user');
} catch (error) {
  console.error(error.message); // "Rooguys API Error: User not found"
}
```

### Validation Errors

```typescript
try {
  // Invalid Aha Score value (must be 1-5)
  await client.aha.declare('user_123', 10);
} catch (error) {
  console.error(error.message); // "Aha score value must be between 1 and 5"
}
```

## Testing

The SDK includes comprehensive test coverage with both unit tests and property-based tests.

### Running Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

The SDK maintains >90% test coverage across all modules, including:
- Unit tests for all API methods
- Property-based tests using fast-check
- Error handling and edge case validation
- Concurrent request handling

### Property-Based Testing

The SDK uses [fast-check](https://github.com/dubzzz/fast-check) for property-based testing to verify correctness across a wide range of inputs:

```typescript
// Example: Verifying HTTP request construction
fc.assert(
  fc.property(
    arbitraries.eventName(),
    arbitraries.userId(),
    async (eventName, userId) => {
      // Test that any valid event name and user ID constructs a valid request
      await client.events.track(eventName, userId);
      // Assertions verify correct HTTP method, URL, headers, and body
    }
  ),
  { numRuns: 100 }
);
```
