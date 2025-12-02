/**
 * Mock API response fixtures for testing
 */
export declare const mockResponses: {
    userProfile: {
        user_id: string;
        points: number;
        persona: string;
        level: {
            id: string;
            name: string;
            level_number: number;
            points_required: number;
        };
        next_level: {
            id: string;
            name: string;
            level_number: number;
            points_required: number;
            points_needed: number;
        };
        metrics: {
            logins: number;
            purchases: number;
        };
        badges: {
            id: string;
            name: string;
            description: string;
            icon_url: string;
            earned_at: string;
        }[];
    };
    trackEventResponse: {
        status: string;
        message: string;
    };
    trackEventWithProfileResponse: {
        status: string;
        message: string;
        profile: {
            user_id: string;
            points: number;
            persona: string;
            level: {
                id: string;
                name: string;
                level_number: number;
                points_required: number;
            };
            next_level: {
                id: string;
                name: string;
                level_number: number;
                points_required: number;
                points_needed: number;
            };
            metrics: {};
            badges: never[];
        };
    };
    leaderboardResponse: {
        timeframe: string;
        page: number;
        limit: number;
        total: number;
        rankings: {
            rank: number;
            user_id: string;
            points: number;
            level: {
                id: string;
                name: string;
                level_number: number;
            };
        }[];
    };
    userRankResponse: {
        user_id: string;
        rank: number;
        points: number;
        total_users: number;
    };
    badgesListResponse: {
        badges: {
            id: string;
            name: string;
            description: string;
            icon_url: string;
            is_active: boolean;
            unlock_criteria: {
                metric: string;
                value: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    levelsListResponse: {
        levels: {
            id: string;
            name: string;
            level_number: number;
            points_required: number;
            description: string;
            icon_url: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    questionnaireResponse: {
        id: string;
        slug: string;
        title: string;
        description: string;
        is_active: boolean;
        questions: {
            id: string;
            text: string;
            order: number;
            answer_options: ({
                id: string;
                text: string;
                persona_weights: {
                    Competitor: number;
                    Explorer?: undefined;
                };
            } | {
                id: string;
                text: string;
                persona_weights: {
                    Explorer: number;
                    Competitor?: undefined;
                };
            })[];
        }[];
    };
    bulkUsersResponse: {
        users: ({
            user_id: string;
            points: number;
            persona: null;
            level: null;
            next_level: null;
            metrics: {};
            badges: never[];
        } | {
            user_id: string;
            points: number;
            persona: string;
            level: {
                id: string;
                name: string;
                level_number: number;
                points_required: number;
            };
            next_level: null;
            metrics: {};
            badges: never[];
        })[];
    };
    ahaScoreResponse: {
        success: boolean;
        data: {
            user_id: string;
            current_score: number;
            declarative_score: number;
            inferred_score: number;
            status: string;
            history: {
                initial: number;
                initial_date: string;
                previous: number;
            };
        };
    };
    ahaDeclarationResponse: {
        success: boolean;
        message: string;
    };
    answerSubmissionResponse: {
        status: string;
        message: string;
    };
    leaderboardsListResponse: {
        leaderboards: {
            id: string;
            name: string;
            description: string;
            type: string;
            timeframe: string;
            is_active: boolean;
            created_at: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
    customLeaderboardResponse: {
        leaderboard: {
            id: string;
            name: string;
            description: string;
            type: string;
            timeframe: string;
            is_active: boolean;
            created_at: string;
        };
        rankings: {
            rank: number;
            user_id: string;
            points: number;
            level: null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
};
export declare const mockErrors: {
    validationError: {
        error: string;
        details: {
            field: string;
            message: string;
        }[];
    };
    notFoundError: {
        error: string;
        message: string;
    };
    serverError: {
        error: string;
    };
    queueFullError: {
        error: string;
        message: string;
    };
    unauthorizedError: {
        error: string;
        message: string;
    };
    invalidTimeframeError: {
        error: string;
        message: string;
    };
    invalidPaginationError: {
        error: string;
        message: string;
    };
    ahaValueError: {
        error: string;
        details: {
            field: string;
            message: string;
        }[];
    };
};
