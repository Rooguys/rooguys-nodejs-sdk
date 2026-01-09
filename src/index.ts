/**
 * Rooguys Node.js SDK
 * Official TypeScript SDK for the Rooguys Gamification Platform
 */

import {
  HttpClient,
  RateLimitInfo,
  ApiResponse,
  extractRateLimitInfo,
  extractRequestId,
  parseResponseBody,
} from './http-client';
import {
  RooguysError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  mapStatusToError,
} from './errors';
import {
  RooguysOptions,
  UserProfile,
  UserBadge,
  UserRank,
  LeaderboardResult,
  LeaderboardFilterOptions,
  AroundUserResponse,
  TrackEventResponse,
  TrackOptions,
  BatchEvent,
  BatchTrackResponse,
  BatchOptions,
  CreateUserData,
  UpdateUserData,
  BatchCreateResponse,
  GetUserOptions,
  SearchOptions,
  PaginatedResponse,
  AnswerSubmission,
  AhaDeclarationResult,
  AhaScoreResult,
  BadgeListResult,
  LevelListResult,
  Questionnaire,
  LeaderboardListResult,
  HealthCheckResponse,
  Timeframe,
  ActivitySummary,
  StreakInfo,
  InventorySummary,
} from './types';


/**
 * Main Rooguys SDK class
 */
export class Rooguys {
  private _httpClient: HttpClient;
  public readonly apiKey: string;
  public readonly baseUrl: string;
  public readonly timeout: number;

  /**
   * Create a new Rooguys SDK instance
   * @param apiKey - API key for authentication
   * @param options - Configuration options
   */
  constructor(apiKey: string, options: RooguysOptions = {}) {
    if (!apiKey) {
      throw new ValidationError('API key is required', { code: 'MISSING_API_KEY' });
    }

    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.rooguys.com/v1';
    this.timeout = options.timeout || 10000;

    // Initialize HTTP client
    this._httpClient = new HttpClient(apiKey, {
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
  private isValidEmail(email: string | undefined): boolean {
    if (!email || typeof email !== 'string') return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Build request body with only provided fields (partial update support)
   */
  private buildUserRequestBody(userData: CreateUserData | UpdateUserData): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    
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
  private parseUserProfile(profile: Record<string, unknown>): UserProfile {
    if (!profile) return profile as unknown as UserProfile;

    const parsed = { ...profile } as UserProfile & Record<string, unknown>;

    // Parse activity summary if present
    const activitySummary = profile.activity_summary as Record<string, unknown> | undefined;
    if (activitySummary) {
      parsed.activitySummary = {
        lastEventAt: activitySummary.last_event_at 
          ? new Date(activitySummary.last_event_at as string) 
          : null,
        eventCount: (activitySummary.event_count as number) || 0,
        daysActive: (activitySummary.days_active as number) || 0,
      };
    }

    // Parse streak info if present
    const streak = profile.streak as Record<string, unknown> | undefined;
    if (streak) {
      parsed.streak = {
        currentStreak: (streak.current_streak as number) || 0,
        longestStreak: (streak.longest_streak as number) || 0,
        lastActivityAt: streak.last_activity_at 
          ? new Date(streak.last_activity_at as string) 
          : null,
        streakStartedAt: streak.streak_started_at 
          ? new Date(streak.streak_started_at as string) 
          : null,
      };
    }

    // Parse inventory summary if present
    const inventory = profile.inventory as Record<string, unknown> | undefined;
    if (inventory) {
      parsed.inventory = {
        itemCount: (inventory.item_count as number) || 0,
        activeEffects: (inventory.active_effects as string[]) || [],
      };
    }

    return parsed as UserProfile;
  }

  /**
   * Build filter query parameters from options
   */
  private buildFilterParams(options: LeaderboardFilterOptions = {}): Record<string, string | number | boolean | undefined> {
    const params: Record<string, string | number | boolean | undefined> = {};

    // Pagination
    if (options.page !== undefined) params.page = options.page;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.search !== undefined && options.search !== null) params.search = options.search;

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
    if (options.timeframe !== undefined) params.timeframe = options.timeframe;

    return params;
  }


  /**
   * Parse leaderboard response to include cache metadata and percentile ranks
   */
  private parseLeaderboardResponse(response: Record<string, unknown>): LeaderboardResult {
    const parsed = { ...response } as LeaderboardResult & Record<string, unknown>;

    // Parse cache metadata if present
    const cacheData = (response.cache_metadata || response.cacheMetadata) as Record<string, unknown> | undefined;
    if (cacheData) {
      parsed.cacheMetadata = {
        cachedAt: cacheData.cached_at ? new Date(cacheData.cached_at as string) : null,
        ttl: (cacheData.ttl as number) || 0,
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

    return parsed as LeaderboardResult;
  }

  /**
   * Events module for tracking user events
   */
  public events = {
    /**
     * Track a single event
     */
    track: async (
      eventName: string,
      userId: string,
      properties: Record<string, unknown> = {},
      options: TrackOptions = {}
    ): Promise<TrackEventResponse> => {
      const body: Record<string, unknown> = {
        event_name: eventName,
        user_id: userId,
        properties,
      };

      // Add custom timestamp if provided
      if (options.timestamp) {
        const timestamp = options.timestamp instanceof Date ? options.timestamp : new Date(options.timestamp);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        if (timestamp < sevenDaysAgo) {
          throw new ValidationError('Custom timestamp cannot be more than 7 days in the past', {
            code: 'TIMESTAMP_TOO_OLD',
            fieldErrors: [{ field: 'timestamp', message: 'Timestamp must be within the last 7 days' }],
          });
        }
        
        body.timestamp = timestamp.toISOString();
      }

      const response = await this._httpClient.post<TrackEventResponse>('/events', body, {
        params: { include_profile: options.includeProfile },
        idempotencyKey: options.idempotencyKey,
      });
      return response.data;
    },


    /**
     * Track multiple events in a single request (batch operation)
     */
    trackBatch: async (events: BatchEvent[], options: BatchOptions = {}): Promise<BatchTrackResponse> => {
      // Validate array
      if (!Array.isArray(events)) {
        throw new ValidationError('Events must be an array', {
          code: 'INVALID_EVENTS',
          fieldErrors: [{ field: 'events', message: 'Events must be an array' }],
        });
      }

      // Validate array length
      if (events.length === 0) {
        throw new ValidationError('Events array cannot be empty', {
          code: 'EMPTY_EVENTS',
          fieldErrors: [{ field: 'events', message: 'At least one event is required' }],
        });
      }

      if (events.length > 100) {
        throw new ValidationError('Batch size exceeds maximum of 100 events', {
          code: 'BATCH_TOO_LARGE',
          fieldErrors: [{ field: 'events', message: 'Maximum batch size is 100 events' }],
        });
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Transform and validate events
      const transformedEvents = events.map((event, index) => {
        const transformed: Record<string, unknown> = {
          event_name: event.eventName,
          user_id: event.userId,
          properties: event.properties || {},
        };

        // Validate and add custom timestamp if provided
        if (event.timestamp) {
          const timestamp = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
          
          if (timestamp < sevenDaysAgo) {
            throw new ValidationError(`Event at index ${index}: Custom timestamp cannot be more than 7 days in the past`, {
              code: 'TIMESTAMP_TOO_OLD',
              fieldErrors: [{ field: `events[${index}].timestamp`, message: 'Timestamp must be within the last 7 days' }],
            });
          }
          
          transformed.timestamp = timestamp.toISOString();
        }

        return transformed;
      });

      const response = await this._httpClient.post<BatchTrackResponse>('/events/batch', {
        events: transformedEvents,
      }, {
        idempotencyKey: options.idempotencyKey,
      });
      return response.data;
    },

    /**
     * @deprecated Use track() instead. The /v1/event endpoint is deprecated.
     */
    trackLegacy: async (
      eventName: string,
      userId: string,
      properties: Record<string, unknown> = {},
      options: { includeProfile?: boolean } = {}
    ): Promise<TrackEventResponse> => {
      console.warn('DEPRECATION WARNING: events.trackLegacy() uses the deprecated /v1/event endpoint. Please use events.track() instead which uses /v1/events.');
      
      const response = await this._httpClient.post<TrackEventResponse>('/event', {
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
  public users = {
    /**
     * Create a new user
     */
    create: async (userData: CreateUserData): Promise<UserProfile> => {
      // Validate required fields
      if (!userData || !userData.userId) {
        throw new ValidationError('User ID is required', {
          code: 'MISSING_USER_ID',
          fieldErrors: [{ field: 'userId', message: 'User ID is required' }],
        });
      }

      // Validate email format if provided
      if (userData.email && !this.isValidEmail(userData.email)) {
        throw new ValidationError('Invalid email format', {
          code: 'INVALID_EMAIL',
          fieldErrors: [{ field: 'email', message: 'Email must be a valid email address' }],
        });
      }

      const body = this.buildUserRequestBody(userData);
      const response = await this._httpClient.post<UserProfile>('/users', body);
      return this.parseUserProfile(response.data as unknown as Record<string, unknown>);
    },

    /**
     * Update an existing user
     */
    update: async (userId: string, userData: UpdateUserData): Promise<UserProfile> => {
      // Validate user ID
      if (!userId) {
        throw new ValidationError('User ID is required', {
          code: 'MISSING_USER_ID',
          fieldErrors: [{ field: 'userId', message: 'User ID is required' }],
        });
      }

      // Validate email format if provided
      if (userData.email && !this.isValidEmail(userData.email)) {
        throw new ValidationError('Invalid email format', {
          code: 'INVALID_EMAIL',
          fieldErrors: [{ field: 'email', message: 'Email must be a valid email address' }],
        });
      }

      const body = this.buildUserRequestBody(userData);
      const response = await this._httpClient.patch<UserProfile>(`/users/${encodeURIComponent(userId)}`, body);
      return this.parseUserProfile(response.data as unknown as Record<string, unknown>);
    },

    /**
     * Create multiple users in a single request (batch operation)
     */
    createBatch: async (users: CreateUserData[]): Promise<BatchCreateResponse> => {
      // Validate array
      if (!Array.isArray(users)) {
        throw new ValidationError('Users must be an array', {
          code: 'INVALID_USERS',
          fieldErrors: [{ field: 'users', message: 'Users must be an array' }],
        });
      }

      // Validate array length
      if (users.length === 0) {
        throw new ValidationError('Users array cannot be empty', {
          code: 'EMPTY_USERS',
          fieldErrors: [{ field: 'users', message: 'At least one user is required' }],
        });
      }

      if (users.length > 100) {
        throw new ValidationError('Batch size exceeds maximum of 100 users', {
          code: 'BATCH_TOO_LARGE',
          fieldErrors: [{ field: 'users', message: 'Maximum batch size is 100 users' }],
        });
      }

      // Validate and transform each user
      const transformedUsers = users.map((user, index) => {
        if (!user.userId) {
          throw new ValidationError(`User at index ${index}: User ID is required`, {
            code: 'MISSING_USER_ID',
            fieldErrors: [{ field: `users[${index}].userId`, message: 'User ID is required' }],
          });
        }

        if (user.email && !this.isValidEmail(user.email)) {
          throw new ValidationError(`User at index ${index}: Invalid email format`, {
            code: 'INVALID_EMAIL',
            fieldErrors: [{ field: `users[${index}].email`, message: 'Email must be a valid email address' }],
          });
        }

        return this.buildUserRequestBody(user);
      });

      const response = await this._httpClient.post<BatchCreateResponse>('/users/batch', { users: transformedUsers });
      return response.data;
    },


    /**
     * Get user profile with optional field selection
     */
    get: async (userId: string, options: GetUserOptions = {}): Promise<UserProfile> => {
      const params: Record<string, string | number | boolean | undefined> = {};
      
      // Add field selection if provided
      if (options.fields && Array.isArray(options.fields) && options.fields.length > 0) {
        params.fields = options.fields.join(',');
      }

      const response = await this._httpClient.get<UserProfile>(`/users/${encodeURIComponent(userId)}`, params);
      return this.parseUserProfile(response.data as unknown as Record<string, unknown>);
    },

    /**
     * Search users with pagination
     */
    search: async (query: string, options: SearchOptions = {}): Promise<PaginatedResponse<UserProfile>> => {
      const params: Record<string, string | number | boolean | undefined> = {
        q: query,
        page: options.page || 1,
        limit: options.limit || 50,
      };

      // Add field selection if provided
      if (options.fields && Array.isArray(options.fields) && options.fields.length > 0) {
        params.fields = options.fields.join(',');
      }

      const response = await this._httpClient.get<PaginatedResponse<UserProfile>>('/users/search', params);
      return {
        ...response.data,
        users: (response.data.users || []).map(user => this.parseUserProfile(user as unknown as Record<string, unknown>)),
      };
    },

    /**
     * Get multiple user profiles
     */
    getBulk: async (userIds: string[]): Promise<{ users: UserProfile[] }> => {
      const response = await this._httpClient.post<{ users: UserProfile[] }>('/users/bulk', { user_ids: userIds });
      return {
        ...response.data,
        users: (response.data.users || []).map(user => this.parseUserProfile(user as unknown as Record<string, unknown>)),
      };
    },

    /**
     * Get user badges
     */
    getBadges: async (userId: string): Promise<{ badges: UserBadge[] }> => {
      const response = await this._httpClient.get<{ badges: UserBadge[] }>(`/users/${encodeURIComponent(userId)}/badges`);
      return response.data;
    },

    /**
     * Get user rank
     */
    getRank: async (userId: string, timeframe: Timeframe = 'all-time'): Promise<UserRank> => {
      const response = await this._httpClient.get<UserRank>(
        `/users/${encodeURIComponent(userId)}/rank`,
        { timeframe }
      );
      return {
        ...response.data,
        percentile: response.data.percentile !== undefined ? response.data.percentile : null,
      };
    },

    /**
     * Submit questionnaire answers
     */
    submitAnswers: async (
      userId: string,
      questionnaireId: string,
      answers: AnswerSubmission[]
    ): Promise<{ status: string; message: string }> => {
      const response = await this._httpClient.post<{ status: string; message: string }>(
        `/users/${encodeURIComponent(userId)}/answers`,
        {
          questionnaire_id: questionnaireId,
          answers,
        }
      );
      return response.data;
    },
  };


  /**
   * Leaderboards module for ranking queries
   */
  public leaderboards = {
    /**
     * Get global leaderboard with optional filters
     */
    getGlobal: async (
      timeframeOrOptions: Timeframe | LeaderboardFilterOptions = 'all-time',
      page = 1,
      limit = 50,
      options: LeaderboardFilterOptions = {}
    ): Promise<LeaderboardResult> => {
      let params: Record<string, string | number | boolean | undefined>;

      // Support both legacy signature and new options object
      if (typeof timeframeOrOptions === 'object') {
        params = this.buildFilterParams({
          timeframe: 'all-time',
          page: 1,
          limit: 50,
          ...timeframeOrOptions,
        });
      } else {
        params = this.buildFilterParams({
          timeframe: timeframeOrOptions,
          page,
          limit,
          ...options,
        });
      }

      const response = await this._httpClient.get<LeaderboardResult>('/leaderboards/global', params);
      return this.parseLeaderboardResponse(response.data as unknown as Record<string, unknown>);
    },

    /**
     * List all leaderboards
     */
    list: async (
      pageOrOptions: number | { page?: number; limit?: number; search?: string } = 1,
      limit = 50,
      search: string | null = null
    ): Promise<LeaderboardListResult> => {
      let params: Record<string, string | number | boolean | undefined>;

      if (typeof pageOrOptions === 'object') {
        params = {
          page: pageOrOptions.page || 1,
          limit: pageOrOptions.limit || 50,
        };
        if (pageOrOptions.search !== undefined && pageOrOptions.search !== null) {
          params.search = pageOrOptions.search;
        }
      } else {
        params = { page: pageOrOptions, limit };
        if (search !== null) params.search = search;
      }

      const response = await this._httpClient.get<LeaderboardListResult>('/leaderboards', params);
      return response.data;
    },

    /**
     * Get custom leaderboard with optional filters
     */
    getCustom: async (
      leaderboardId: string,
      pageOrOptions: number | LeaderboardFilterOptions = 1,
      limit = 50,
      search: string | null = null,
      options: LeaderboardFilterOptions = {}
    ): Promise<LeaderboardResult> => {
      let params: Record<string, string | number | boolean | undefined>;

      if (typeof pageOrOptions === 'object') {
        params = this.buildFilterParams({
          page: 1,
          limit: 50,
          ...pageOrOptions,
        });
      } else {
        params = this.buildFilterParams({
          page: pageOrOptions,
          limit,
          search: search || undefined,
          ...options,
        });
      }

      const response = await this._httpClient.get<LeaderboardResult>(
        `/leaderboards/${encodeURIComponent(leaderboardId)}`,
        params
      );
      return this.parseLeaderboardResponse(response.data as unknown as Record<string, unknown>);
    },

    /**
     * Get user rank in leaderboard
     */
    getUserRank: async (leaderboardId: string, userId: string): Promise<UserRank> => {
      const response = await this._httpClient.get<UserRank>(
        `/leaderboards/${encodeURIComponent(leaderboardId)}/users/${encodeURIComponent(userId)}/rank`
      );
      return {
        ...response.data,
        percentile: response.data.percentile !== undefined ? response.data.percentile : null,
      };
    },

    /**
     * Get leaderboard entries around a specific user ("around me" view)
     */
    getAroundUser: async (leaderboardId: string, userId: string, range = 5): Promise<AroundUserResponse> => {
      const response = await this._httpClient.get<AroundUserResponse>(
        `/leaderboards/${encodeURIComponent(leaderboardId)}/users/${encodeURIComponent(userId)}/around`,
        { range }
      );
      return this.parseLeaderboardResponse(response.data as unknown as Record<string, unknown>) as AroundUserResponse;
    },
  };


  /**
   * Badges module for badge queries
   */
  public badges = {
    /**
     * List all badges
     */
    list: async (page = 1, limit = 50, activeOnly = false): Promise<BadgeListResult> => {
      const response = await this._httpClient.get<BadgeListResult>('/badges', {
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
  public levels = {
    /**
     * List all levels
     */
    list: async (page = 1, limit = 50): Promise<LevelListResult> => {
      const response = await this._httpClient.get<LevelListResult>('/levels', { page, limit });
      return response.data;
    },
  };

  /**
   * Questionnaires module for questionnaire queries
   */
  public questionnaires = {
    /**
     * Get questionnaire by slug
     */
    get: async (slug: string): Promise<Questionnaire> => {
      const response = await this._httpClient.get<Questionnaire>(`/questionnaires/${slug}`);
      return response.data;
    },

    /**
     * Get active questionnaire
     */
    getActive: async (): Promise<Questionnaire> => {
      const response = await this._httpClient.get<Questionnaire>('/questionnaires/active');
      return response.data;
    },
  };

  /**
   * Aha moment module for engagement tracking
   */
  public aha = {
    /**
     * Declare aha moment score
     */
    declare: async (userId: string, value: number): Promise<AhaDeclarationResult> => {
      // Validate value is between 1 and 5
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new ValidationError('Aha score value must be an integer between 1 and 5', {
          code: 'INVALID_AHA_VALUE',
          fieldErrors: [{ field: 'value', message: 'value must be an integer between 1 and 5' }],
        });
      }
      const response = await this._httpClient.post<AhaDeclarationResult>('/aha/declare', {
        user_id: userId,
        value,
      });
      return response.data;
    },

    /**
     * Get user aha score
     */
    getUserScore: async (userId: string): Promise<AhaScoreResult> => {
      const response = await this._httpClient.get<AhaScoreResult>(`/users/${encodeURIComponent(userId)}/aha`);
      return response.data;
    },
  };

  /**
   * Health module for API health checks
   */
  public health = {
    /**
     * Check API health status
     */
    check: async (): Promise<HealthCheckResponse> => {
      const response = await this._httpClient.get<HealthCheckResponse>('/health');
      return response.data;
    },

    /**
     * Quick availability check
     */
    isReady: async (): Promise<boolean> => {
      try {
        await this._httpClient.get('/health');
        return true;
      } catch {
        return false;
      }
    },
  };
}


// Export error classes
export {
  RooguysError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  mapStatusToError,
} from './errors';

// Export HTTP client and utilities
export {
  HttpClient,
  extractRateLimitInfo,
  extractRequestId,
  parseResponseBody,
} from './http-client';

// Export types
export * from './types';

// Default export
export default Rooguys;
