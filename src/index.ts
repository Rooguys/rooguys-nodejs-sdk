import axios, { AxiosInstance, AxiosError } from 'axios';
import { RooguysOptions, TrackEventResponse, UserProfile, UserBadge, UserRank, LeaderboardResult, AnswerSubmission } from './types';

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
        const response = await this.client.get(`/user/${userId}`);
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
        const response = await this.client.get(`/user/${userId}/badges`);
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    getRank: async (userId: string, timeframe: 'all-time' | 'weekly' | 'monthly' = 'all-time'): Promise<UserRank> => {
      try {
        const response = await this.client.get(`/user/${userId}/rank`, {
          params: { timeframe },
        });
        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    },

    submitAnswers: async (userId: string, questionnaireId: string, answers: AnswerSubmission[]): Promise<{ status: string; message: string }> => {
      try {
        const response = await this.client.post(`/user/${userId}/answers`, {
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
    
    // Additional leaderboard methods can be added here following the same pattern
  };

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      return new Error(`Rooguys API Error: ${message}`);
    }
    return error;
  }
}

export default Rooguys;
