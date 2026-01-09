/**
 * Rooguys Node.js SDK Type Definitions
 */
export { RooguysError, ValidationError, AuthenticationError, ForbiddenError, NotFoundError, ConflictError, RateLimitError, ServerError, FieldError, RooguysErrorOptions, ValidationErrorOptions, RateLimitErrorOptions, mapStatusToError, } from './errors';
export { RateLimitInfo, CacheMetadata, Pagination, ApiResponse, RequestConfig, HttpClientOptions, HttpClient, extractRateLimitInfo, extractRequestId, parseResponseBody, } from './http-client';
/**
 * SDK initialization options
 */
export interface RooguysOptions {
    /** Base URL for API (default: https://api.rooguys.com/v1) */
    baseUrl?: string;
    /** Request timeout in ms (default: 10000) */
    timeout?: number;
    /** Callback when rate limit is 80% consumed */
    onRateLimitWarning?: ((rateLimit: import('./http-client').RateLimitInfo) => void) | null;
    /** Enable auto-retry for rate-limited requests (default: false) */
    autoRetry?: boolean;
    /** Maximum retry attempts for rate limits (default: 3) */
    maxRetries?: number;
}
/**
 * Level information
 */
export interface Level {
    id: string;
    name: string;
    level_number: number;
    points_required: number;
    description?: string | null;
    icon_url?: string | null;
    created_at?: string;
}
/**
 * Next level information with points needed
 */
export interface NextLevel extends Level {
    points_needed: number;
}
/**
 * User badge information
 */
export interface UserBadge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    earned_at: string;
}
/**
 * Activity summary for user profile
 */
export interface ActivitySummary {
    lastEventAt: Date | null;
    eventCount: number;
    daysActive: number;
}
/**
 * Streak information for user profile
 */
export interface StreakInfo {
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: Date | null;
    streakStartedAt: Date | null;
}
/**
 * Inventory summary for user profile
 */
export interface InventorySummary {
    itemCount: number;
    activeEffects: string[];
}
/**
 * User profile data
 */
export interface UserProfile {
    user_id: string;
    display_name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    points: number;
    persona: string | null;
    persona_assigned_at?: string | null;
    level: Level | null;
    next_level: NextLevel | null;
    metrics: Record<string, number>;
    badges: UserBadge[];
    metadata?: Record<string, unknown>;
    /** Activity summary (parsed from activity_summary) */
    activitySummary?: ActivitySummary;
    /** Streak information (parsed from streak) */
    streak?: StreakInfo;
    /** Inventory summary (parsed from inventory) */
    inventory?: InventorySummary;
    created_at?: string;
    updated_at?: string;
}
/**
 * User rank information
 */
export interface UserRank {
    user_id: string;
    rank: number;
    points: number;
    total_users: number;
    percentile?: number | null;
}
/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    points: number;
    level_name?: string;
    level_number?: number;
    level?: {
        id: string;
        name: string;
        level_number: number;
    } | null;
    percentile?: number | null;
}
/**
 * Leaderboard statistics
 */
export interface LeaderboardStats {
    total_participants: number;
    average_score: number;
    highest_score: number;
    lowest_score: number;
}
/**
 * Leaderboard metadata
 */
export interface LeaderboardMetadata {
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    timeframe?: string;
    is_active?: boolean;
    created_at?: string;
}
/**
 * Cache metadata from leaderboard responses
 */
export interface LeaderboardCacheMetadata {
    cachedAt: Date | null;
    ttl: number;
}
/**
 * Leaderboard result
 */
export interface LeaderboardResult {
    timeframe?: string;
    page: number;
    limit: number;
    total: number;
    rankings: LeaderboardEntry[];
    stats?: LeaderboardStats;
    metadata?: LeaderboardMetadata;
    cacheMetadata?: LeaderboardCacheMetadata;
}
/**
 * Leaderboard filter options
 */
export interface LeaderboardFilterOptions {
    /** Page number */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Search query */
    search?: string;
    /** Timeframe (all-time, weekly, monthly) */
    timeframe?: 'all-time' | 'weekly' | 'monthly';
    /** Filter by persona */
    persona?: string;
    /** Minimum level filter */
    minLevel?: number;
    /** Maximum level filter */
    maxLevel?: number;
    /** Start date filter (ISO 8601) */
    startDate?: Date | string;
    /** End date filter (ISO 8601) */
    endDate?: Date | string;
}
/**
 * Around user response
 */
export interface AroundUserResponse extends LeaderboardResult {
    user_rank?: UserRank;
}
/**
 * Track event response
 */
export interface TrackEventResponse {
    status: string;
    message: string;
    profile?: UserProfile;
}
/**
 * Track options
 */
export interface TrackOptions {
    /** Include user profile in response */
    includeProfile?: boolean;
    /** Custom timestamp for historical events (max 7 days old) */
    timestamp?: Date | string;
    /** Idempotency key to prevent duplicate processing */
    idempotencyKey?: string;
}
/**
 * Batch event item
 */
export interface BatchEvent {
    /** Event name */
    eventName: string;
    /** User ID */
    userId: string;
    /** Event properties */
    properties?: Record<string, unknown>;
    /** Custom timestamp for historical events */
    timestamp?: Date | string;
}
/**
 * Batch event result
 */
export interface BatchEventResult {
    index: number;
    status: 'queued' | 'error';
    error?: string;
}
/**
 * Batch track response
 */
export interface BatchTrackResponse {
    results: BatchEventResult[];
    requestId?: string;
}
/**
 * Batch options
 */
export interface BatchOptions {
    /** Idempotency key for the batch */
    idempotencyKey?: string;
}
/**
 * Create user data
 */
export interface CreateUserData {
    /** Unique user ID */
    userId: string;
    /** Display name */
    displayName?: string;
    /** Email address */
    email?: string;
    /** First name */
    firstName?: string;
    /** Last name */
    lastName?: string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Update user data (partial update supported)
 */
export interface UpdateUserData {
    /** Display name */
    displayName?: string;
    /** Email address */
    email?: string;
    /** First name */
    firstName?: string;
    /** Last name */
    lastName?: string;
    /** Custom metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Batch create user result
 */
export interface BatchCreateUserResult {
    index: number;
    status: 'created' | 'error';
    user_id?: string;
    error?: string;
}
/**
 * Batch create response
 */
export interface BatchCreateResponse {
    results: BatchCreateUserResult[];
}
/**
 * Get user options
 */
export interface GetUserOptions {
    /** Fields to include in response */
    fields?: string[];
}
/**
 * Search options
 */
export interface SearchOptions {
    /** Page number */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Fields to include in response */
    fields?: string[];
}
/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    users?: T[];
    items?: T[];
}
/**
 * Answer submission
 */
export interface AnswerSubmission {
    question_id: string;
    answer_option_id: string;
}
/**
 * Aha declaration result
 */
export interface AhaDeclarationResult {
    success: boolean;
    message: string;
}
/**
 * Aha score history
 */
export interface AhaScoreHistory {
    initial: number | null;
    initial_date: string | null;
    previous: number | null;
}
/**
 * Aha score data
 */
export interface AhaScoreData {
    user_id: string;
    current_score: number;
    declarative_score: number | null;
    inferred_score: number | null;
    status: 'not_started' | 'progressing' | 'activated';
    history: AhaScoreHistory;
}
/**
 * Aha score result
 */
export interface AhaScoreResult {
    success: boolean;
    data: AhaScoreData;
}
/**
 * Badge definition
 */
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    points_required?: number;
    is_active: boolean;
    unlock_criteria?: string | Record<string, unknown>;
    created_at: string;
}
/**
 * Badge list result
 */
export interface BadgeListResult {
    badges: Badge[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
    };
}
/**
 * Level list result
 */
export interface LevelListResult {
    levels: Level[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
    };
}
/**
 * Question option
 */
export interface QuestionOption {
    id: string;
    text: string;
    persona_weight?: Record<string, number>;
    persona_weights?: Record<string, number>;
}
/**
 * Question
 */
export interface Question {
    id: string;
    text: string;
    order: number;
    answer_options: QuestionOption[];
}
/**
 * Questionnaire
 */
export interface Questionnaire {
    id: string;
    slug: string;
    title: string;
    description: string;
    is_active: boolean;
    questions: Question[];
    created_at: string;
}
/**
 * Leaderboard definition
 */
export interface LeaderboardDefinition {
    id: string;
    name: string;
    description: string;
    type?: string;
    timeframe?: string;
    is_active?: boolean;
    created_at: string;
}
/**
 * Leaderboard list result
 */
export interface LeaderboardListResult {
    page: number;
    limit: number;
    total: number;
    leaderboards: LeaderboardDefinition[];
}
/**
 * Health check response
 */
export interface HealthCheckResponse {
    status: string;
    version?: string;
    timestamp?: string;
    services?: Record<string, {
        status: string;
        latency?: number;
    }>;
    queue_depth?: number;
    processing_lag?: number;
}
/**
 * Timeframe type
 */
export type Timeframe = 'all-time' | 'weekly' | 'monthly';
