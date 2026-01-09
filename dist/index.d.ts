/**
 * Rooguys Node.js SDK
 * Official TypeScript SDK for the Rooguys Gamification Platform
 */
import { RooguysOptions, UserProfile, UserBadge, UserRank, LeaderboardResult, LeaderboardFilterOptions, AroundUserResponse, TrackEventResponse, TrackOptions, BatchEvent, BatchTrackResponse, BatchOptions, CreateUserData, UpdateUserData, BatchCreateResponse, GetUserOptions, SearchOptions, PaginatedResponse, AnswerSubmission, AhaDeclarationResult, AhaScoreResult, BadgeListResult, LevelListResult, Questionnaire, LeaderboardListResult, HealthCheckResponse, Timeframe } from './types';
/**
 * Main Rooguys SDK class
 */
export declare class Rooguys {
    private _httpClient;
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly timeout: number;
    /**
     * Create a new Rooguys SDK instance
     * @param apiKey - API key for authentication
     * @param options - Configuration options
     */
    constructor(apiKey: string, options?: RooguysOptions);
    /**
     * Validate email format client-side
     */
    private isValidEmail;
    /**
     * Build request body with only provided fields (partial update support)
     */
    private buildUserRequestBody;
    /**
     * Parse user profile to include activity summary, streak, and inventory
     */
    private parseUserProfile;
    /**
     * Build filter query parameters from options
     */
    private buildFilterParams;
    /**
     * Parse leaderboard response to include cache metadata and percentile ranks
     */
    private parseLeaderboardResponse;
    /**
     * Events module for tracking user events
     */
    events: {
        /**
         * Track a single event
         */
        track: (eventName: string, userId: string, properties?: Record<string, unknown>, options?: TrackOptions) => Promise<TrackEventResponse>;
        /**
         * Track multiple events in a single request (batch operation)
         */
        trackBatch: (events: BatchEvent[], options?: BatchOptions) => Promise<BatchTrackResponse>;
        /**
         * @deprecated Use track() instead. The /v1/event endpoint is deprecated.
         */
        trackLegacy: (eventName: string, userId: string, properties?: Record<string, unknown>, options?: {
            includeProfile?: boolean;
        }) => Promise<TrackEventResponse>;
    };
    /**
     * Users module for user management and queries
     */
    users: {
        /**
         * Create a new user
         */
        create: (userData: CreateUserData) => Promise<UserProfile>;
        /**
         * Update an existing user
         */
        update: (userId: string, userData: UpdateUserData) => Promise<UserProfile>;
        /**
         * Create multiple users in a single request (batch operation)
         */
        createBatch: (users: CreateUserData[]) => Promise<BatchCreateResponse>;
        /**
         * Get user profile with optional field selection
         */
        get: (userId: string, options?: GetUserOptions) => Promise<UserProfile>;
        /**
         * Search users with pagination
         */
        search: (query: string, options?: SearchOptions) => Promise<PaginatedResponse<UserProfile>>;
        /**
         * Get multiple user profiles
         */
        getBulk: (userIds: string[]) => Promise<{
            users: UserProfile[];
        }>;
        /**
         * Get user badges
         */
        getBadges: (userId: string) => Promise<{
            badges: UserBadge[];
        }>;
        /**
         * Get user rank
         */
        getRank: (userId: string, timeframe?: Timeframe) => Promise<UserRank>;
        /**
         * Submit questionnaire answers
         */
        submitAnswers: (userId: string, questionnaireId: string, answers: AnswerSubmission[]) => Promise<{
            status: string;
            message: string;
        }>;
    };
    /**
     * Leaderboards module for ranking queries
     */
    leaderboards: {
        /**
         * Get global leaderboard with optional filters
         */
        getGlobal: (timeframeOrOptions?: Timeframe | LeaderboardFilterOptions, page?: number, limit?: number, options?: LeaderboardFilterOptions) => Promise<LeaderboardResult>;
        /**
         * List all leaderboards
         */
        list: (pageOrOptions?: number | {
            page?: number;
            limit?: number;
            search?: string;
        }, limit?: number, search?: string | null) => Promise<LeaderboardListResult>;
        /**
         * Get custom leaderboard with optional filters
         */
        getCustom: (leaderboardId: string, pageOrOptions?: number | LeaderboardFilterOptions, limit?: number, search?: string | null, options?: LeaderboardFilterOptions) => Promise<LeaderboardResult>;
        /**
         * Get user rank in leaderboard
         */
        getUserRank: (leaderboardId: string, userId: string) => Promise<UserRank>;
        /**
         * Get leaderboard entries around a specific user ("around me" view)
         */
        getAroundUser: (leaderboardId: string, userId: string, range?: number) => Promise<AroundUserResponse>;
    };
    /**
     * Badges module for badge queries
     */
    badges: {
        /**
         * List all badges
         */
        list: (page?: number, limit?: number, activeOnly?: boolean) => Promise<BadgeListResult>;
    };
    /**
     * Levels module for level queries
     */
    levels: {
        /**
         * List all levels
         */
        list: (page?: number, limit?: number) => Promise<LevelListResult>;
    };
    /**
     * Questionnaires module for questionnaire queries
     */
    questionnaires: {
        /**
         * Get questionnaire by slug
         */
        get: (slug: string) => Promise<Questionnaire>;
        /**
         * Get active questionnaire
         */
        getActive: () => Promise<Questionnaire>;
    };
    /**
     * Aha moment module for engagement tracking
     */
    aha: {
        /**
         * Declare aha moment score
         */
        declare: (userId: string, value: number) => Promise<AhaDeclarationResult>;
        /**
         * Get user aha score
         */
        getUserScore: (userId: string) => Promise<AhaScoreResult>;
    };
    /**
     * Health module for API health checks
     */
    health: {
        /**
         * Check API health status
         */
        check: () => Promise<HealthCheckResponse>;
        /**
         * Quick availability check
         */
        isReady: () => Promise<boolean>;
    };
}
export { RooguysError, ValidationError, AuthenticationError, ForbiddenError, NotFoundError, ConflictError, RateLimitError, ServerError, mapStatusToError, } from './errors';
export { HttpClient, extractRateLimitInfo, extractRequestId, parseResponseBody, } from './http-client';
export * from './types';
export default Rooguys;
