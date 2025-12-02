"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arbitraries = void 0;
const fast_check_1 = __importDefault(require("fast-check"));
/**
 * Property-based testing generators for SDK inputs
 */
exports.arbitraries = {
    // User ID: 1-255 characters, alphanumeric with some special chars
    userId: () => fast_check_1.default.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
    // Event name: 1-100 characters
    eventName: () => fast_check_1.default.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    // Properties: any JSON-serializable object
    properties: () => fast_check_1.default.dictionary(fast_check_1.default.string({ minLength: 1, maxLength: 50 }), fast_check_1.default.oneof(fast_check_1.default.string(), fast_check_1.default.integer(), fast_check_1.default.double().filter(n => Number.isFinite(n)), // Exclude Infinity and NaN
    fast_check_1.default.boolean(), fast_check_1.default.constant(null))),
    // Timeframe: one of the valid values
    timeframe: () => fast_check_1.default.constantFrom('all-time', 'weekly', 'monthly'),
    // Pagination parameters
    pagination: () => fast_check_1.default.record({
        page: fast_check_1.default.integer({ min: 1, max: 1000 }),
        limit: fast_check_1.default.integer({ min: 1, max: 100 }),
    }),
    // Aha score value: 1-5
    ahaValue: () => fast_check_1.default.integer({ min: 1, max: 5 }),
    // Invalid Aha score value: outside 1-5 range
    invalidAhaValue: () => fast_check_1.default.oneof(fast_check_1.default.integer({ max: 0 }), fast_check_1.default.integer({ min: 6 })),
    // UUID for leaderboard IDs
    uuid: () => fast_check_1.default.uuid(),
    // Slug for questionnaires
    slug: () => fast_check_1.default.string({ minLength: 1, maxLength: 100 })
        .filter(s => /^[a-z0-9-]+$/.test(s)),
    // Array of user IDs for bulk operations
    userIds: () => fast_check_1.default.array(fast_check_1.default.string({ minLength: 1, maxLength: 255 }), { minLength: 1, maxLength: 100 }),
    // Boolean for active_only filter
    activeOnly: () => fast_check_1.default.boolean(),
    // Search query
    searchQuery: () => fast_check_1.default.option(fast_check_1.default.string({ maxLength: 100 }), { nil: null }),
    // Base URL
    baseUrl: () => fast_check_1.default.webUrl(),
    // Timeout in milliseconds
    timeout: () => fast_check_1.default.integer({ min: 1000, max: 60000 }),
    // API key
    apiKey: () => fast_check_1.default.string({ minLength: 10, maxLength: 100 }),
    // Questionnaire answers
    questionnaireAnswers: () => fast_check_1.default.array(fast_check_1.default.record({
        question_id: fast_check_1.default.uuid(),
        answer_option_id: fast_check_1.default.uuid(),
    }), { minLength: 1, maxLength: 20 }),
};
