import { Rooguys, ValidationError } from '../../index';

describe('SDK Configuration', () => {
  describe('initialization', () => {
    it('should initialize with API key', () => {
      const client = new Rooguys('test-api-key');
      expect(client.apiKey).toBe('test-api-key');
    });

    it('should use default base URL when not provided', () => {
      const client = new Rooguys('test-api-key');
      expect(client.baseUrl).toBe('https://api.rooguys.com/v1');
    });

    it('should use custom base URL when provided', () => {
      const client = new Rooguys('test-api-key', {
        baseUrl: 'https://custom.api.com/v1',
      });
      expect(client.baseUrl).toBe('https://custom.api.com/v1');
    });

    it('should use default timeout when not provided', () => {
      const client = new Rooguys('test-api-key');
      expect(client.timeout).toBe(10000);
    });

    it('should use custom timeout when provided', () => {
      const client = new Rooguys('test-api-key', {
        timeout: 30000,
      });
      expect(client.timeout).toBe(30000);
    });

    it('should accept both baseUrl and timeout options', () => {
      const client = new Rooguys('test-api-key', {
        baseUrl: 'https://staging.api.com/v1',
        timeout: 20000,
      });
      expect(client.baseUrl).toBe('https://staging.api.com/v1');
      expect(client.timeout).toBe(20000);
    });

    it('should handle empty options object', () => {
      const client = new Rooguys('test-api-key', {});
      expect(client.baseUrl).toBe('https://api.rooguys.com/v1');
      expect(client.timeout).toBe(10000);
    });

    it('should handle localhost base URL', () => {
      const client = new Rooguys('test-api-key', {
        baseUrl: 'http://localhost:3001/v1',
      });
      expect(client.baseUrl).toBe('http://localhost:3001/v1');
    });

    it('should handle very short timeout', () => {
      const client = new Rooguys('test-api-key', {
        timeout: 1000,
      });
      expect(client.timeout).toBe(1000);
    });

    it('should handle very long timeout', () => {
      const client = new Rooguys('test-api-key', {
        timeout: 60000,
      });
      expect(client.timeout).toBe(60000);
    });

    it('should throw error when API key is missing', () => {
      expect(() => new Rooguys('')).toThrow(ValidationError);
      expect(() => new Rooguys('')).toThrow('API key is required');
    });
  });

  describe('API key handling', () => {
    it('should store API key', () => {
      const client = new Rooguys('my-secret-key');
      expect(client.apiKey).toBe('my-secret-key');
    });

    it('should handle long API keys', () => {
      const longKey = 'sk_live_' + 'a'.repeat(100);
      const client = new Rooguys(longKey);
      expect(client.apiKey).toBe(longKey);
    });

    it('should handle API keys with special characters', () => {
      const keyWithSpecialChars = 'sk_test_abc-123_XYZ.456';
      const client = new Rooguys(keyWithSpecialChars);
      expect(client.apiKey).toBe(keyWithSpecialChars);
    });
  });

  describe('module availability', () => {
    it('should have events module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.events).toBeDefined();
      expect(client.events.track).toBeDefined();
      expect(client.events.trackBatch).toBeDefined();
    });

    it('should have users module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.users).toBeDefined();
      expect(client.users.get).toBeDefined();
      expect(client.users.create).toBeDefined();
      expect(client.users.update).toBeDefined();
      expect(client.users.getBulk).toBeDefined();
      expect(client.users.getBadges).toBeDefined();
      expect(client.users.getRank).toBeDefined();
    });

    it('should have leaderboards module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.leaderboards).toBeDefined();
      expect(client.leaderboards.getGlobal).toBeDefined();
      expect(client.leaderboards.list).toBeDefined();
      expect(client.leaderboards.getCustom).toBeDefined();
    });

    it('should have badges module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.badges).toBeDefined();
      expect(client.badges.list).toBeDefined();
    });

    it('should have levels module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.levels).toBeDefined();
      expect(client.levels.list).toBeDefined();
    });

    it('should have questionnaires module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.questionnaires).toBeDefined();
      expect(client.questionnaires.get).toBeDefined();
      expect(client.questionnaires.getActive).toBeDefined();
    });

    it('should have aha module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.aha).toBeDefined();
      expect(client.aha.declare).toBeDefined();
      expect(client.aha.getUserScore).toBeDefined();
    });

    it('should have health module', () => {
      const client = new Rooguys('test-api-key');
      expect(client.health).toBeDefined();
      expect(client.health.check).toBeDefined();
      expect(client.health.isReady).toBeDefined();
    });
  });
});
