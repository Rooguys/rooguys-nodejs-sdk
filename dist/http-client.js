"use strict";
/**
 * Rooguys Node.js SDK HTTP Client
 * Handles standardized response format, rate limit headers, and error mapping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
exports.extractRateLimitInfo = extractRateLimitInfo;
exports.extractRequestId = extractRequestId;
exports.parseResponseBody = parseResponseBody;
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("./errors");
/**
 * Extract rate limit information from response headers
 * @param headers - Response headers (axios format)
 * @returns Rate limit info
 */
function extractRateLimitInfo(headers) {
    const getHeader = (name) => {
        return headers[name] || headers[name.toLowerCase()];
    };
    return {
        limit: parseInt(getHeader('X-RateLimit-Limit') || getHeader('x-ratelimit-limit') || '1000', 10),
        remaining: parseInt(getHeader('X-RateLimit-Remaining') || getHeader('x-ratelimit-remaining') || '1000', 10),
        reset: parseInt(getHeader('X-RateLimit-Reset') || getHeader('x-ratelimit-reset') || '0', 10),
    };
}
/**
 * Extract request ID from response headers or body
 * @param headers - Response headers
 * @param body - Response body
 * @returns Request ID or null
 */
function extractRequestId(headers, body) {
    // Try headers first
    const getHeader = (name) => {
        return headers[name] || headers[name.toLowerCase()];
    };
    const headerRequestId = getHeader('X-Request-Id') || getHeader('x-request-id');
    if (headerRequestId) {
        return headerRequestId;
    }
    // Fall back to body
    if (body && typeof body === 'object') {
        const bodyObj = body;
        return bodyObj.request_id || bodyObj.requestId || null;
    }
    return null;
}
/**
 * Parse standardized API response format
 * Handles both new format { success: true, data: {...} } and legacy format
 * @param body - Response body
 * @returns Parsed response with data and metadata
 */
function parseResponseBody(body) {
    if (!body || typeof body !== 'object') {
        return {
            data: body,
            pagination: null,
            requestId: null,
        };
    }
    const bodyObj = body;
    // New standardized format with { success: true, data: {...} }
    if (typeof bodyObj.success === 'boolean') {
        if (bodyObj.success) {
            // If there's a data field, unwrap it; otherwise return the whole body
            // This handles both { success: true, data: {...} } and { success: true, message: "..." }
            const data = 'data' in bodyObj ? bodyObj.data : body;
            return {
                data: data,
                pagination: bodyObj.pagination || null,
                requestId: bodyObj.request_id || null,
            };
        }
        // Error response in standardized format
        return {
            error: bodyObj.error,
            requestId: bodyObj.request_id || null,
        };
    }
    // Legacy format - return as-is
    return {
        data: body,
        pagination: bodyObj.pagination || null,
        requestId: null,
    };
}
/**
 * HTTP Client class for making API requests
 */
class HttpClient {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;
        this.baseUrl = options.baseUrl || 'https://api.rooguys.com/v1';
        this.timeout = options.timeout || 10000;
        this.onRateLimitWarning = options.onRateLimitWarning || null;
        this.autoRetry = options.autoRetry || false;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Sleep for a specified duration
     * @param ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Build query string from params object
     * @param params - Query parameters
     * @returns Cleaned params object
     */
    buildParams(params) {
        const cleaned = {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }
    /**
     * Make an HTTP request with optional auto-retry for rate limits
     * @param config - Request configuration
     * @param retryCount - Current retry attempt (internal use)
     * @returns API response with data and metadata
     */
    async request(config, retryCount = 0) {
        var _a, _b, _c;
        const { method = 'GET', path, params = {}, body = null, headers = {}, idempotencyKey = undefined, timeout, } = config;
        // Build request config
        const requestConfig = {
            method,
            url: path,
            params: this.buildParams(params),
            headers: { ...headers },
        };
        if (body !== null) {
            requestConfig.data = body;
        }
        if (timeout) {
            requestConfig.timeout = timeout;
        }
        // Add idempotency key if provided
        if (idempotencyKey) {
            requestConfig.headers = {
                ...requestConfig.headers,
                'X-Idempotency-Key': idempotencyKey,
            };
        }
        try {
            const response = await this.client.request(requestConfig);
            // Extract headers info
            const rateLimit = extractRateLimitInfo(response.headers);
            // Check for rate limit warning (80% consumed)
            if (rateLimit.remaining < rateLimit.limit * 0.2 && this.onRateLimitWarning) {
                this.onRateLimitWarning(rateLimit);
            }
            // Extract request ID
            const requestId = extractRequestId(response.headers, response.data);
            // Parse response body
            const parsed = parseResponseBody(response.data);
            // Check for error in standardized format
            if (parsed.error) {
                throw (0, errors_1.mapStatusToError)(400, { error: parsed.error }, requestId, {});
            }
            return {
                data: parsed.data,
                requestId: requestId || parsed.requestId || null,
                rateLimit,
                pagination: parsed.pagination,
            };
        }
        catch (error) {
            // Re-throw RooguysError instances
            if (error instanceof errors_1.RooguysError) {
                throw error;
            }
            // Handle Axios errors
            if (axios_1.default.isAxiosError(error)) {
                const axiosError = error;
                const status = ((_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status) || 0;
                const responseData = ((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.data) || null;
                const responseHeaders = (((_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.headers) || {});
                const requestId = extractRequestId(responseHeaders, responseData);
                const mappedError = (0, errors_1.mapStatusToError)(status, responseData, requestId, {
                    'retry-after': responseHeaders['retry-after'],
                    'Retry-After': responseHeaders['Retry-After'],
                });
                // Auto-retry for rate limit errors if enabled
                if (this.autoRetry && mappedError instanceof errors_1.RateLimitError && retryCount < this.maxRetries) {
                    const retryAfterMs = mappedError.retryAfter * 1000;
                    await this.sleep(retryAfterMs);
                    return this.request(config, retryCount + 1);
                }
                throw mappedError;
            }
            // Handle timeout
            if (error instanceof Error && error.message.includes('timeout')) {
                throw new errors_1.RooguysError('Request timeout', { code: 'TIMEOUT', statusCode: 408 });
            }
            // Handle other errors
            throw new errors_1.RooguysError(error instanceof Error ? error.message : 'Network error', { code: 'NETWORK_ERROR', statusCode: 0 });
        }
    }
    /**
     * Convenience method for GET requests
     */
    get(path, params = {}, options = {}) {
        return this.request({ method: 'GET', path, params, ...options });
    }
    /**
     * Convenience method for POST requests
     */
    post(path, body = null, options = {}) {
        return this.request({ method: 'POST', path, body, ...options });
    }
    /**
     * Convenience method for PUT requests
     */
    put(path, body = null, options = {}) {
        return this.request({ method: 'PUT', path, body, ...options });
    }
    /**
     * Convenience method for PATCH requests
     */
    patch(path, body = null, options = {}) {
        return this.request({ method: 'PATCH', path, body, ...options });
    }
    /**
     * Convenience method for DELETE requests
     */
    delete(path, options = {}) {
        return this.request({ method: 'DELETE', path, ...options });
    }
}
exports.HttpClient = HttpClient;
