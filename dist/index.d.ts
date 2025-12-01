import { RooguysOptions, TrackEventResponse, UserProfile, UserBadge, UserRank, LeaderboardResult, AnswerSubmission } from './types';
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
    };
    private handleError;
}
export default Rooguys;
