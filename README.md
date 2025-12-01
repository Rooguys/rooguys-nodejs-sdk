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

## Error Handling

The SDK throws errors for non-2xx responses.

```typescript
try {
  await client.users.get('non_existent_user');
} catch (error) {
  console.error(error.message); // "Rooguys API Error: User not found"
}
```
