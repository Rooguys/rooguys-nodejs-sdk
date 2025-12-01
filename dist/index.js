"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rooguys = void 0;
const axios_1 = __importDefault(require("axios"));
class Rooguys {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.events = {
            track: async (eventName, userId, properties = {}, options = {}) => {
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
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
        };
        this.users = {
            get: async (userId) => {
                try {
                    const response = await this.client.get(`/user/${userId}`);
                    return response.data;
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
            getBulk: async (userIds) => {
                try {
                    const response = await this.client.post('/users/bulk', { user_ids: userIds });
                    return response.data;
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
            getBadges: async (userId) => {
                try {
                    const response = await this.client.get(`/user/${userId}/badges`);
                    return response.data;
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
            getRank: async (userId, timeframe = 'all-time') => {
                try {
                    const response = await this.client.get(`/user/${userId}/rank`, {
                        params: { timeframe },
                    });
                    return response.data;
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
            submitAnswers: async (userId, questionnaireId, answers) => {
                try {
                    const response = await this.client.post(`/user/${userId}/answers`, {
                        questionnaire_id: questionnaireId,
                        answers,
                    });
                    return response.data;
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
        };
        this.leaderboards = {
            getGlobal: async (timeframe = 'all-time', page = 1, limit = 50) => {
                try {
                    const response = await this.client.get('/leaderboard', {
                        params: { timeframe, page, limit },
                    });
                    return response.data;
                }
                catch (error) {
                    throw this.handleError(error);
                }
            },
            // Additional leaderboard methods can be added here following the same pattern
        };
        this.client = axios_1.default.create({
            baseURL: options.baseUrl || 'https://api.rooguys.com/v1',
            timeout: options.timeout || 10000,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }
    handleError(error) {
        var _a, _b;
        if (axios_1.default.isAxiosError(error)) {
            const message = ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || error.message;
            return new Error(`Rooguys API Error: ${message}`);
        }
        return error;
    }
}
exports.Rooguys = Rooguys;
exports.default = Rooguys;
