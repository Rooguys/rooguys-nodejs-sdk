import axios from 'axios';
import { Rooguys } from '../../index';
import { createMockAxiosInstance, mockSuccessResponse, mockErrorResponse } from '../utils/mockClient';
import { mockResponses, mockErrors } from '../fixtures/responses';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Questionnaires Resource', () => {
  let client: Rooguys;
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    mockAxiosInstance = createMockAxiosInstance();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new Rooguys(apiKey);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get questionnaire by slug', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.questionnaireResponse)
      );

      const result = await client.questionnaires.get('user-persona');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/questionnaire/user-persona');
      expect(result).toEqual(mockResponses.questionnaireResponse);
      expect(result.slug).toBe('user-persona');
    });

    it('should handle questionnaire with multiple questions', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.questionnaireResponse)
      );

      const result = await client.questionnaires.get('user-persona');

      expect(result.questions).toBeDefined();
      expect(result.questions.length).toBeGreaterThan(0);
    });

    it('should handle questionnaire with answer options', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.questionnaireResponse)
      );

      const result = await client.questionnaires.get('user-persona');

      const question = result.questions[0];
      expect(question.answer_options).toBeDefined();
      expect(question.answer_options.length).toBeGreaterThan(0);
    });

    it('should throw 404 error when questionnaire not found', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(404, 'Questionnaire not found')
      );

      await expect(
        client.questionnaires.get('nonexistent-slug')
      ).rejects.toThrow('Questionnaire not found');
    });

    it('should handle slug with special characters', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.questionnaireResponse)
      );

      await client.questionnaires.get('user-persona-v2');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/questionnaire/user-persona-v2');
    });

    it('should handle inactive questionnaire', async () => {
      const inactiveQuestionnaire = {
        ...mockResponses.questionnaireResponse,
        is_active: false,
      };
      mockAxiosInstance.get.mockResolvedValue(mockSuccessResponse(inactiveQuestionnaire));

      const result = await client.questionnaires.get('old-questionnaire');

      expect(result.is_active).toBe(false);
    });
  });

  describe('getActive', () => {
    it('should get active questionnaire', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.questionnaireResponse)
      );

      const result = await client.questionnaires.getActive();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/questionnaire/active');
      expect(result).toEqual(mockResponses.questionnaireResponse);
      expect(result.is_active).toBe(true);
    });

    it('should throw 404 error when no active questionnaire', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(404, 'No active questionnaire found for this project')
      );

      await expect(client.questionnaires.getActive()).rejects.toThrow(
        'No active questionnaire found'
      );
    });

    it('should handle active questionnaire with all fields', async () => {
      mockAxiosInstance.get.mockResolvedValue(
        mockSuccessResponse(mockResponses.questionnaireResponse)
      );

      const result = await client.questionnaires.getActive();

      expect(result.id).toBeDefined();
      expect(result.slug).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.is_active).toBe(true);
      expect(result.questions).toBeDefined();
    });

    it('should handle server error', async () => {
      mockAxiosInstance.get.mockRejectedValue(
        mockErrorResponse(500, 'Internal server error')
      );

      await expect(client.questionnaires.getActive()).rejects.toThrow(
        'Internal server error'
      );
    });
  });
});
