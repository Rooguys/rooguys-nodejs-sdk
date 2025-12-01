import axios from 'axios';
import { Rooguys } from './index';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Rooguys SDK', () => {
  let client: Rooguys;
  const apiKey = 'test-api-key';
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('Events', () => {
    it('should track an event', async () => {
      const mockResponse = { data: { status: 'queued', message: 'ok' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.events.track('test_event', 'user_1');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/event',
        {
          event_name: 'test_event',
          user_id: 'user_1',
          properties: {},
        },
        { params: { include_profile: undefined } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Users', () => {
    it('should get a user profile', async () => {
      const mockResponse = { data: { user_id: 'user_1', points: 100 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.users.get('user_1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/user_1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Leaderboards', () => {
    it('should get global leaderboard', async () => {
      const mockResponse = { data: { rankings: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.leaderboards.getGlobal();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/leaderboard',
        { params: { timeframe: 'all-time', page: 1, limit: 50 } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
