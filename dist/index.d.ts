import { RooguysOptions, TrackEventResponse, UserProfile, UserBadge, UserRank, LeaderboardResult, AnswerSubmission, AhaDeclarationResult, AhaScoreResult, BadgeListResult, LevelListResult, Questionnaire, LeaderboardListResult } from './types';
export declare class Rooguys {
    private apiKey;
    private client;
    constructor(apiKey: string, options?: RooguysOptions);
    events: {
        track: (eventName: string, userId: string, properties?: Record<string, any>, options?: {
            includeProfile?: boolean;
        }) => Promise<TrackEventResponse>;
    };
    users: {
        get: (userId: string) => Promise<UserProfile>;
        getBulk: (userIds: string[]) => Promise<{
            users: UserProfile[];
        }>;
        getBadges: (userId: string) => Promise<{
            badges: UserBadge[];
        }>;
        getRank: (userId: string, timeframe?: "all-time" | "weekly" | "monthly") => Promise<UserRank>;
        submitAnswers: (userId: string, questionnaireId: string, answers: AnswerSubmission[]) => Promise<{
            status: string;
            message: string;
        }>;
    };
    leaderboards: {
        getGlobal: (timeframe?: "all-time" | "weekly" | "monthly", page?: number, limit?: number) => Promise<LeaderboardResult>;
        list: (page?: number, limit?: number, search?: string) => Promise<LeaderboardListResult>;
        getCustom: (leaderboardId: string, page?: number, limit?: number, search?: string) => Promise<LeaderboardResult>;
        getUserRank: (leaderboardId: string, userId: string) => Promise<UserRank>;
    };
    badges: {
        list: (page?: number, limit?: number, activeOnly?: boolean) => Promise<BadgeListResult>;
    };
    levels: {
        list: (page?: number, limit?: number) => Promise<LevelListResult>;
    };
    questionnaires: {
        get: (slug: string) => Promise<Questionnaire>;
        getActive: () => Promise<Questionnaire>;
    };
    aha: {
        declare: (userId: string, value: number) => Promise<AhaDeclarationResult>;
        getUserScore: (userId: string) => Promise<AhaScoreResult>;
    };
    private handleError;
}
export default Rooguys;
