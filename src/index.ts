import axios, { AxiosInstance, AxiosError } from 'axios';
import { RooguysOptions, TrackEventResponse, UserProfile, UserBadge, UserRank, LeaderboardResult, AnswerSubmission, AhaDeclarationResult, AhaScoreResult, BadgeListResult, LevelListResult, Questionnaire, LeaderboardListResult } from './types';

export class Rooguys {
  private client: AxiosInstance;

  constructor(private apiKey: string, options: RooguysOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseUrl || 'https://api.rooguys.com/v1',
      timeout: options.timeout || 10000,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  public events = {
    track: async (
      eventName: string,
      userId: string,
      properties: Record<string, any> = {},
      options: { includeProfile?: boolean } = {}
    ): Promise<TrackEventResponse> => {
      try {
        const response = await this.client.post('/event', {
          event_name: eventName,
          user_id: userId,
          properties,
        }, {
          params: {
            include_profile: options.includeProfile,
          },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  public users = {
    get: async (userId: string): Promise<UserProfile> => {
      try {
        const response = await this.client.get(`/user/${encodeURIComponent(userId)}`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getBulk: async (userIds: string[]): Promise<{ users: UserProfile[] }> => {
      try {
        const response = await this.client.post('/users/bulk', { user_ids: userIds });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getBadges: async (userId: string): Promise<{ badges: UserBadge[] }> => {
      try {
        const response = await this.client.get(`/user/${encodeURIComponent(userId)}/badges`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getRank: async (userId: string, timeframe: 'all-time' | 'weekly' | 'monthly' = 'all-time'): Promise<UserRank> => {
      try {
        const response = await this.client.get(`/user/${encodeURIComponent(userId)}/rank`, {
          params: { timeframe },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    submitAnswers: async (userId: string, questionnaireId: string, answers: AnswerSubmission[]): Promise<{ status: string; message: string }> => {
      try {
        const response = await this.client.post(`/user/${encodeURIComponent(userId)}/answers`, {
          questionnaire_id: questionnaireId,
          answers,
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  public leaderboards = {
    getGlobal: async (
      timeframe: 'all-time' | 'weekly' | 'monthly' = 'all-time',
      page: number = 1,
      limit: number = 50
    ): Promise<LeaderboardResult> => {
      try {
        const response = await this.client.get('/leaderboard', {
          params: { timeframe, page, limit },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    list: async (page: number = 1, limit: number = 50, search?: string): Promise<LeaderboardListResult> => {
      try {
        const params: any = { page, limit };
        if (search) {
          params.search = search;
        }
        const response = await this.client.get('/leaderboards', { params });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getCustom: async (
      leaderboardId: string,
      page: number = 1,
      limit: number = 50,
      search?: string
    ): Promise<LeaderboardResult> => {
      try {
        const params: any = { page, limit };
        if (search) {
          params.search = search;
        }
        const response = await this.client.get(`/leaderboard/${encodeURIComponent(leaderboardId)}`, { params });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getUserRank: async (leaderboardId: string, userId: string): Promise<UserRank> => {
      try {
        const response = await this.client.get(
          `/leaderboard/${encodeURIComponent(leaderboardId)}/user/${encodeURIComponent(userId)}/rank`
        );
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  public badges = {
    list: async (page: number = 1, limit: number = 50, activeOnly: boolean = false): Promise<BadgeListResult> => {
      try {
        const response = await this.client.get('/badges', {
          params: { page, limit, active_only: activeOnly },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  public levels = {
    list: async (page: number = 1, limit: number = 50): Promise<LevelListResult> => {
      try {
        const response = await this.client.get('/levels', {
          params: { page, limit },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  public questionnaires = {
    get: async (slug: string): Promise<Questionnaire> => {
      try {
        const response = await this.client.get(`/questionnaire/${slug}`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getActive: async (): Promise<Questionnaire> => {
      try {
        const response = await this.client.get('/questionnaire/active');
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  public aha = {
    declare: async (userId: string, value: number): Promise<AhaDeclarationResult> => {
      // Validate value is between 1 and 5
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error('Aha score value must be an integer between 1 and 5');
      }

      try {
        const response = await this.client.post('/aha/declare', {
          user_id: userId,
          value,
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getUserScore: async (userId: string): Promise<AhaScoreResult> => {
      try {
        const response = await this.client.get(`/users/${encodeURIComponent(userId)}/aha`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },
  };

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new Error(message);
    }
    return error;
  }
}

export default Rooguys;
