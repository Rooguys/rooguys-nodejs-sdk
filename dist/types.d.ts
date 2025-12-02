export interface RooguysOptions {
    baseUrl?: string;
    timeout?: number;
}
export interface UserProfile {
    user_id: string;
    points: number;
    persona: string | null;
    level: {
        id: string;
        name: string;
        level_number: number;
        points_required: number;
    } | null;
    next_level: {
        id: string;
        name: string;
        level_number: number;
        points_required: number;
        points_needed: number;
    } | null;
    metrics: Record<string, any>;
    badges: UserBadge[];
}
export interface UserBadge {
    id: string;
    name: string;
    description: string;
    icon_url: string;
    earned_at: string;
}
export interface UserRank {
    user_id: string;
    rank: number;
    points: number;
    total_users: number;
}
export interface LeaderboardEntry {
    rank: number;
    user_id: string;
    points: number;
    level: {
        id: string;
        name: string;
        level_number: number;
    } | null;
}
export interface LeaderboardResult {
    timeframe: string;
    page: number;
    limit: number;
    total: number;
    rankings: LeaderboardEntry[];
}
export interface TrackEventResponse {
    status: string;
    message: string;
    profile?: UserProfile;
}
export interface AnswerSubmission {
    question_id: string;
    answer_option_id: string;
}
export interface AhaDeclarationResult {
    success: boolean;
    message: string;
}
export interface AhaScoreResult {
    success: boolean;
    data: {
        user_id: string;
        current_score: number;
        declarative_score: number | null;
        inferred_score: number | null;
        status: 'not_started' | 'progressing' | 'activated';
        history: {
            initial: number | null;
            initial_date: string | null;
            previous: number | null;
        };
    };
}
