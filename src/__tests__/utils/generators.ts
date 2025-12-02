import fc from 'fast-check';

/**
 * Property-based testing generators for SDK inputs
 */

export const arbitraries = {
  // User ID: 1-255 characters, alphanumeric with some special chars
  userId: () => fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
  
  // Event name: 1-100 characters
  eventName: () => fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  
  // Properties: any JSON-serializable object
  properties: () => fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.oneof(
      fc.string(),
      fc.integer(),
      fc.double().filter(n => Number.isFinite(n)), // Exclude Infinity and NaN
      fc.boolean(),
      fc.constant(null)
    )
  ),
  
  // Timeframe: one of the valid values
  timeframe: () => fc.constantFrom('all-time', 'weekly', 'monthly'),
  
  // Pagination parameters
  pagination: () => fc.record({
    page: fc.integer({ min: 1, max: 1000 }),
    limit: fc.integer({ min: 1, max: 100 }),
  }),
  
  // Aha score value: 1-5
  ahaValue: () => fc.integer({ min: 1, max: 5 }),
  
  // Invalid Aha score value: outside 1-5 range
  invalidAhaValue: () => fc.oneof(
    fc.integer({ max: 0 }),
    fc.integer({ min: 6 })
  ),
  
  // UUID for leaderboard IDs
  uuid: () => fc.uuid(),
  
  // Slug for questionnaires
  slug: () => fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => /^[a-z0-9-]+$/.test(s)),
  
  // Array of user IDs for bulk operations
  userIds: () => fc.array(
    fc.string({ minLength: 1, maxLength: 255 }),
    { minLength: 1, maxLength: 100 }
  ),
  
  // Boolean for active_only filter
  activeOnly: () => fc.boolean(),
  
  // Search query
  searchQuery: () => fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  
  // Base URL
  baseUrl: () => fc.webUrl(),
  
  // Timeout in milliseconds
  timeout: () => fc.integer({ min: 1000, max: 60000 }),
  
  // API key
  apiKey: () => fc.string({ minLength: 10, maxLength: 100 }),
  
  // Questionnaire answers
  questionnaireAnswers: () => fc.array(
    fc.record({
      question_id: fc.uuid(),
      answer_option_id: fc.uuid(),
    }),
    { minLength: 1, maxLength: 20 }
  ),
};
