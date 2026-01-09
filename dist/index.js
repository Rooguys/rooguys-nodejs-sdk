"use strict";
/**
 * Rooguys Node.js SDK
 * Official TypeScript SDK for the Rooguys Gamification Platform
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResponseBody = exports.extractRequestId = exports.extractRateLimitInfo = exports.HttpClient = exports.mapStatusToError = exports.ServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthenticationError = exports.ValidationError = exports.RooguysError = exports.Rooguys = void 0;
const http_client_1 = require("./http-client");
const errors_1 = require("./errors");
/**
 * Main Rooguys SDK class
 */
class Rooguys {
    /**
     * Create a new Rooguys SDK instance
     * @param apiKey - API key for authentication
     * @param options - Configuration options
     */
    constructor(apiKey, options = {}) {
        /**
         * Events module for tracking user events
         */
        this.events = {
            /**
             * Track a single event
             */
            track: async (eventName, userId, properties = {}, options = {}) => {
                const body = {
                    event_name: eventName,
                    user_id: userId,
                    properties,
                };
                // Add custom timestamp if provided
                if (options.timestamp) {
                    const timestamp = options.timestamp instanceof Date ? options.timestamp : new Date(options.timestamp);
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    if (timestamp < sevenDaysAgo) {
                        throw new errors_1.ValidationError('Custom timestamp cannot be more than 7 days in the past', {
                            code: 'TIMESTAMP_TOO_OLD',
                            fieldErrors: [{ field: 'timestamp', message: 'Timestamp must be within the last 7 days' }],
                        });
                    }
                    body.timestamp = timestamp.toISOString();
                }
                const response = await this._httpClient.post('/events', body, {
                    params: { include_profile: options.includeProfile },
                    idempotencyKey: options.idempotencyKey,
                });
                return response.data;
            },
            /**
             * Track multiple events in a single request (batch operation)
             */
            trackBatch: async (events, options = {}) => {
                // Validate array
                if (!Array.isArray(events)) {
                    throw new errors_1.ValidationError('Events must be an array', {
                        code: 'INVALID_EVENTS',
                        fieldErrors: [{ field: 'events', message: 'Events must be an array' }],
                    });
                }
                // Validate array length
                if (events.length === 0) {
                    throw new errors_1.ValidationError('Events array cannot be empty', {
                        code: 'EMPTY_EVENTS',
                        fieldErrors: [{ field: 'events', message: 'At least one event is required' }],
                    });
                }
                if (events.length > 100) {
                    throw new errors_1.ValidationError('Batch size exceeds maximum of 100 events', {
                        code: 'BATCH_TOO_LARGE',
                        fieldErrors: [{ field: 'events', message: 'Maximum batch size is 100 events' }],
                    });
                }
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                // Transform and validate events
                const transformedEvents = events.map((event, index) => {
                    const transformed = {
                        event_name: event.eventName,
                        user_id: event.userId,
                        properties: event.properties || {},
                    };
                    // Validate and add custom timestamp if provided
                    if (event.timestamp) {
                        const timestamp = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
                        if (timestamp < sevenDaysAgo) {
                            throw new errors_1.ValidationError(`Event at index ${index}: Custom timestamp cannot be more than 7 days in the past`, {
                                code: 'TIMESTAMP_TOO_OLD',
                                fieldErrors: [{ field: `events[${index}].timestamp`, message: 'Timestamp must be within the last 7 days' }],
                            });
                        }
                        transformed.timestamp = timestamp.toISOString();
                    }
                    return transformed;
                });
                const response = await this._httpClient.post('/events/batch', {
                    events: transformedEvents,
                }, {
                    idempotencyKey: options.idempotencyKey,
                });
                return response.data;
            },
            /**
             * @deprecated Use track() instead. The /v1/event endpoint is deprecated.
             */
            trackLegacy: async (eventName, userId, properties = {}, options = {}) => {
                console.warn('DEPRECATION WARNING: events.trackLegacy() uses the deprecated /v1/event endpoint. Please use events.track() instead which uses /v1/events.');
                const response = await this._httpClient.post('/event', {
                    event_name: eventName,
                    user_id: userId,
                    properties,
                }, {
                    params: { include_profile: options.includeProfile },
                });
                return response.data;
            },
        };
        /**
         * Users module for user management and queries
         */
        this.users = {
            /**
             * Create a new user
             */
            create: async (userData) => {
                // Validate required fields
                if (!userData || !userData.userId) {
                    throw new errors_1.ValidationError('User ID is required', {
                        code: 'MISSING_USER_ID',
                        fieldErrors: [{ field: 'userId', message: 'User ID is required' }],
                    });
                }
                // Validate email format if provided
                if (userData.email && !this.isValidEmail(userData.email)) {
                    throw new errors_1.ValidationError('Invalid email format', {
                        code: 'INVALID_EMAIL',
                        fieldErrors: [{ field: 'email', message: 'Email must be a valid email address' }],
                    });
                }
                const body = this.buildUserRequestBody(userData);
                const response = await this._httpClient.post('/users', body);
                return this.parseUserProfile(response.data);
            },
            /**
             * Update an existing user
             */
            update: async (userId, userData) => {
                // Validate user ID
                if (!userId) {
                    throw new errors_1.ValidationError('User ID is required', {
                        code: 'MISSING_USER_ID',
                        fieldErrors: [{ field: 'userId', message: 'User ID is required' }],
                    });
                }
                // Validate email format if provided
                if (userData.email && !this.isValidEmail(userData.email)) {
                    throw new errors_1.ValidationError('Invalid email format', {
                        code: 'INVALID_EMAIL',
                        fieldErrors: [{ field: 'email', message: 'Email must be a valid email address' }],
                    });
                }
                const body = this.buildUserRequestBody(userData);
                const response = await this._httpClient.patch(`/users/${encodeURIComponent(userId)}`, body);
                return this.parseUserProfile(response.data);
            },
            /**
             * Create multiple users in a single request (batch operation)
             */
            createBatch: async (users) => {
                // Validate array
                if (!Array.isArray(users)) {
                    throw new errors_1.ValidationError('Users must be an array', {
                        code: 'INVALID_USERS',
                        fieldErrors: [{ field: 'users', message: 'Users must be an array' }],
                    });
                }
                // Validate array length
                if (users.length === 0) {
                    throw new errors_1.ValidationError('Users array cannot be empty', {
                        code: 'EMPTY_USERS',
                        fieldErrors: [{ field: 'users', message: 'At least one user is required' }],
                    });
                }
                if (users.length > 100) {
                    throw new errors_1.ValidationError('Batch size exceeds maximum of 100 users', {
                        code: 'BATCH_TOO_LARGE',
                        fieldErrors: [{ field: 'users', message: 'Maximum batch size is 100 users' }],
                    });
                }
                // Validate and transform each user
                const transformedUsers = users.map((user, index) => {
                    if (!user.userId) {
                        throw new errors_1.ValidationError(`User at index ${index}: User ID is required`, {
                            code: 'MISSING_USER_ID',
                            fieldErrors: [{ field: `users[${index}].userId`, message: 'User ID is required' }],
                        });
                    }
                    if (user.email && !this.isValidEmail(user.email)) {
                        throw new errors_1.ValidationError(`User at index ${index}: Invalid email format`, {
                            code: 'INVALID_EMAIL',
                            fieldErrors: [{ field: `users[${index}].email`, message: 'Email must be a valid email address' }],
                        });
                    }
                    return this.buildUserRequestBody(user);
                });
                const response = await this._httpClient.post('/users/batch', { users: transformedUsers });
                return response.data;
            },
            /**
             * Get user profile with optional field selection
             */
            get: async (userId, options = {}) => {
                const params = {};
                // Add field selection if provided
                if (options.fields && Array.isArray(options.fields) && options.fields.length > 0) {
                    params.fields = options.fields.join(',');
                }
                const response = await this._httpClient.get(`/users/${encodeURIComponent(userId)}`, params);
                return this.parseUserProfile(response.data);
            },
            /**
             * Search users with pagination
             */
            search: async (query, options = {}) => {
                const params = {
                    q: query,
                    page: options.page || 1,
                    limit: options.limit || 50,
                };
                // Add field selection if provided
                if (options.fields && Array.isArray(options.fields) && options.fields.length > 0) {
                    params.fields = options.fields.join(',');
                }
                const response = await this._httpClient.get('/users/search', params);
                return {
                    ...response.data,
                    users: (response.data.users || []).map(user => this.parseUserProfile(user)),
                };
            },
            /**
             * Get multiple user profiles
             */
            getBulk: async (userIds) => {
                const response = await this._httpClient.post('/users/bulk', { user_ids: userIds });
                return {
                    ...response.data,
                    users: (response.data.users || []).map(user => this.parseUserProfile(user)),
                };
            },
            /**
             * Get user badges
             */
            getBadges: async (userId) => {
                const response = await this._httpClient.get(`/users/${encodeURIComponent(userId)}/badges`);
                return response.data;
            },
            /**
             * Get user rank
             */
            getRank: async (userId, timeframe = 'all-time') => {
                const response = await this._httpClient.get(`/users/${encodeURIComponent(userId)}/rank`, { timeframe });
                return {
                    ...response.data,
                    percentile: response.data.percentile !== undefined ? response.data.percentile : null,
                };
            },
            /**
             * Submit questionnaire answers
             */
            submitAnswers: async (userId, questionnaireId, answers) => {
                const response = await this._httpClient.post(`/users/${encodeURIComponent(userId)}/answers`, {
                    questionnaire_id: questionnaireId,
                    answers,
                });
                return response.data;
            },
        };
        /**
         * Leaderboards module for ranking queries
         */
        this.leaderboards = {
            /**
             * Get global leaderboard with optional filters
             */
            getGlobal: async (timeframeOrOptions = 'all-time', page = 1, limit = 50, options = {}) => {
                let params;
                // Support both legacy signature and new options object
                if (typeof timeframeOrOptions === 'object') {
                    params = this.buildFilterParams({
                        timeframe: 'all-time',
                        page: 1,
                        limit: 50,
                        ...timeframeOrOptions,
                    });
                }
                else {
                    params = this.buildFilterParams({
                        timeframe: timeframeOrOptions,
                        page,
                        limit,
                        ...options,
                    });
                }
                const response = await this._httpClient.get('/leaderboards/global', params);
                return this.parseLeaderboardResponse(response.data);
            },
            /**
             * List all leaderboards
             */
            list: async (pageOrOptions = 1, limit = 50, search = null) => {
                let params;
                if (typeof pageOrOptions === 'object') {
                    params = {
                        page: pageOrOptions.page || 1,
                        limit: pageOrOptions.limit || 50,
                    };
                    if (pageOrOptions.search !== undefined && pageOrOptions.search !== null) {
                        params.search = pageOrOptions.search;
                    }
                }
                else {
                    params = { page: pageOrOptions, limit };
                    if (search !== null)
                        params.search = search;
                }
                const response = await this._httpClient.get('/leaderboards', params);
                return response.data;
            },
            /**
             * Get custom leaderboard with optional filters
             */
            getCustom: async (leaderboardId, pageOrOptions = 1, limit = 50, search = null, options = {}) => {
                let params;
                if (typeof pageOrOptions === 'object') {
                    params = this.buildFilterParams({
                        page: 1,
                        limit: 50,
                        ...pageOrOptions,
                    });
                }
                else {
                    params = this.buildFilterParams({
                        page: pageOrOptions,
                        limit,
                        search: search || undefined,
                        ...options,
                    });
                }
                const response = await this._httpClient.get(`/leaderboards/${encodeURIComponent(leaderboardId)}`, params);
                return this.parseLeaderboardResponse(response.data);
            },
            /**
             * Get user rank in leaderboard
             */
            getUserRank: async (leaderboardId, userId) => {
                const response = await this._httpClient.get(`/leaderboards/${encodeURIComponent(leaderboardId)}/users/${encodeURIComponent(userId)}/rank`);
                return {
                    ...response.data,
                    percentile: response.data.percentile !== undefined ? response.data.percentile : null,
                };
            },
            /**
             * Get leaderboard entries around a specific user ("around me" view)
             */
            getAroundUser: async (leaderboardId, userId, range = 5) => {
                const response = await this._httpClient.get(`/leaderboards/${encodeURIComponent(leaderboardId)}/users/${encodeURIComponent(userId)}/around`, { range });
                return this.parseLeaderboardResponse(response.data);
            },
        };
        /**
         * Badges module for badge queries
         */
        this.badges = {
            /**
             * List all badges
             */
            list: async (page = 1, limit = 50, activeOnly = false) => {
                const response = await this._httpClient.get('/badges', {
                    page,
                    limit,
                    active_only: activeOnly,
                });
                return response.data;
            },
        };
        /**
         * Levels module for level queries
         */
        this.levels = {
            /**
             * List all levels
             */
            list: async (page = 1, limit = 50) => {
                const response = await this._httpClient.get('/levels', { page, limit });
                return response.data;
            },
        };
        /**
         * Questionnaires module for questionnaire queries
         */
        this.questionnaires = {
            /**
             * Get questionnaire by slug
             */
            get: async (slug) => {
                const response = await this._httpClient.get(`/questionnaires/${slug}`);
                return response.data;
            },
            /**
             * Get active questionnaire
             */
            getActive: async () => {
                const response = await this._httpClient.get('/questionnaires/active');
                return response.data;
            },
        };
        /**
         * Aha moment module for engagement tracking
         */
        this.aha = {
            /**
             * Declare aha moment score
             */
            declare: async (userId, value) => {
                // Validate value is between 1 and 5
                if (!Number.isInteger(value) || value < 1 || value > 5) {
                    throw new errors_1.ValidationError('Aha score value must be an integer between 1 and 5', {
                        code: 'INVALID_AHA_VALUE',
                        fieldErrors: [{ field: 'value', message: 'value must be an integer between 1 and 5' }],
                    });
                }
                const response = await this._httpClient.post('/aha/declare', {
                    user_id: userId,
                    value,
                });
                return response.data;
            },
            /**
             * Get user aha score
             */
            getUserScore: async (userId) => {
                const response = await this._httpClient.get(`/users/${encodeURIComponent(userId)}/aha`);
                return response.data;
            },
        };
        /**
         * Health module for API health checks
         */
        this.health = {
            /**
             * Check API health status
             */
            check: async () => {
                const response = await this._httpClient.get('/health');
                return response.data;
            },
            /**
             * Quick availability check
             */
            isReady: async () => {
                try {
                    await this._httpClient.get('/health');
                    return true;
                }
                catch (_a) {
                    return false;
                }
            },
        };
        if (!apiKey) {
            throw new errors_1.ValidationError('API key is required', { code: 'MISSING_API_KEY' });
        }
        this.apiKey = apiKey;
        this.baseUrl = options.baseUrl || 'https://api.rooguys.com/v1';
        this.timeout = options.timeout || 10000;
        // Initialize HTTP client
        this._httpClient = new http_client_1.HttpClient(apiKey, {
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            onRateLimitWarning: options.onRateLimitWarning,
            autoRetry: options.autoRetry,
            maxRetries: options.maxRetries,
        });
    }
    /**
     * Validate email format client-side
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string')
            return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Build request body with only provided fields (partial update support)
     */
    buildUserRequestBody(userData) {
        const body = {};
        if ('userId' in userData && userData.userId !== undefined) {
            body.user_id = userData.userId;
        }
        if (userData.displayName !== undefined) {
            body.display_name = userData.displayName;
        }
        if (userData.email !== undefined) {
            body.email = userData.email;
        }
        if (userData.firstName !== undefined) {
            body.first_name = userData.firstName;
        }
        if (userData.lastName !== undefined) {
            body.last_name = userData.lastName;
        }
        if (userData.metadata !== undefined) {
            body.metadata = userData.metadata;
        }
        return body;
    }
    /**
     * Parse user profile to include activity summary, streak, and inventory
     */
    parseUserProfile(profile) {
        if (!profile)
            return profile;
        const parsed = { ...profile };
        // Parse activity summary if present
        const activitySummary = profile.activity_summary;
        if (activitySummary) {
            parsed.activitySummary = {
                lastEventAt: activitySummary.last_event_at
                    ? new Date(activitySummary.last_event_at)
                    : null,
                eventCount: activitySummary.event_count || 0,
                daysActive: activitySummary.days_active || 0,
            };
        }
        // Parse streak info if present
        const streak = profile.streak;
        if (streak) {
            parsed.streak = {
                currentStreak: streak.current_streak || 0,
                longestStreak: streak.longest_streak || 0,
                lastActivityAt: streak.last_activity_at
                    ? new Date(streak.last_activity_at)
                    : null,
                streakStartedAt: streak.streak_started_at
                    ? new Date(streak.streak_started_at)
                    : null,
            };
        }
        // Parse inventory summary if present
        const inventory = profile.inventory;
        if (inventory) {
            parsed.inventory = {
                itemCount: inventory.item_count || 0,
                activeEffects: inventory.active_effects || [],
            };
        }
        return parsed;
    }
    /**
     * Build filter query parameters from options
     */
    buildFilterParams(options = {}) {
        const params = {};
        // Pagination
        if (options.page !== undefined)
            params.page = options.page;
        if (options.limit !== undefined)
            params.limit = options.limit;
        if (options.search !== undefined && options.search !== null)
            params.search = options.search;
        // Persona filter
        if (options.persona !== undefined && options.persona !== null) {
            params.persona = options.persona;
        }
        // Level range filters
        if (options.minLevel !== undefined && options.minLevel !== null) {
            params.min_level = options.minLevel;
        }
        if (options.maxLevel !== undefined && options.maxLevel !== null) {
            params.max_level = options.maxLevel;
        }
        // Date range filters (convert to ISO 8601)
        if (options.startDate !== undefined && options.startDate !== null) {
            const startDate = options.startDate instanceof Date
                ? options.startDate
                : new Date(options.startDate);
            params.start_date = startDate.toISOString();
        }
        if (options.endDate !== undefined && options.endDate !== null) {
            const endDate = options.endDate instanceof Date
                ? options.endDate
                : new Date(options.endDate);
            params.end_date = endDate.toISOString();
        }
        // Timeframe
        if (options.timeframe !== undefined)
            params.timeframe = options.timeframe;
        return params;
    }
    /**
     * Parse leaderboard response to include cache metadata and percentile ranks
     */
    parseLeaderboardResponse(response) {
        const parsed = { ...response };
        // Parse cache metadata if present
        const cacheData = (response.cache_metadata || response.cacheMetadata);
        if (cacheData) {
            parsed.cacheMetadata = {
                cachedAt: cacheData.cached_at ? new Date(cacheData.cached_at) : null,
                ttl: cacheData.ttl || 0,
            };
            delete parsed.cache_metadata;
        }
        // Parse rankings to include percentile if present
        if (parsed.rankings && Array.isArray(parsed.rankings)) {
            parsed.rankings = parsed.rankings.map(entry => ({
                ...entry,
                percentile: entry.percentile !== undefined ? entry.percentile : null,
            }));
        }
        return parsed;
    }
}
exports.Rooguys = Rooguys;
// Export error classes
var errors_2 = require("./errors");
Object.defineProperty(exports, "RooguysError", { enumerable: true, get: function () { return errors_2.RooguysError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_2.ValidationError; } });
Object.defineProperty(exports, "AuthenticationError", { enumerable: true, get: function () { return errors_2.AuthenticationError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return errors_2.ForbiddenError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errors_2.NotFoundError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return errors_2.ConflictError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errors_2.RateLimitError; } });
Object.defineProperty(exports, "ServerError", { enumerable: true, get: function () { return errors_2.ServerError; } });
Object.defineProperty(exports, "mapStatusToError", { enumerable: true, get: function () { return errors_2.mapStatusToError; } });
// Export HTTP client and utilities
var http_client_2 = require("./http-client");
Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return http_client_2.HttpClient; } });
Object.defineProperty(exports, "extractRateLimitInfo", { enumerable: true, get: function () { return http_client_2.extractRateLimitInfo; } });
Object.defineProperty(exports, "extractRequestId", { enumerable: true, get: function () { return http_client_2.extractRequestId; } });
Object.defineProperty(exports, "parseResponseBody", { enumerable: true, get: function () { return http_client_2.parseResponseBody; } });
// Export types
__exportStar(require("./types"), exports);
// Default export
exports.default = Rooguys;
