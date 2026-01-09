"use strict";
/**
 * Rooguys Node.js SDK Error Classes
 * Typed error classes for different API error scenarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthenticationError = exports.ValidationError = exports.RooguysError = void 0;
exports.mapStatusToError = mapStatusToError;
/**
 * Base error class for all Rooguys SDK errors
 */
class RooguysError extends Error {
    constructor(message, { code = 'UNKNOWN_ERROR', requestId = null, statusCode = 500 } = {}) {
        super(message);
        this.name = 'RooguysError';
        this.code = code;
        this.requestId = requestId;
        this.statusCode = statusCode;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            requestId: this.requestId,
            statusCode: this.statusCode,
        };
    }
}
exports.RooguysError = RooguysError;
/**
 * Validation error (HTTP 400)
 * Thrown when request validation fails
 */
class ValidationError extends RooguysError {
    constructor(message, { code = 'VALIDATION_ERROR', requestId = null, fieldErrors = null } = {}) {
        super(message, { code, requestId, statusCode: 400 });
        this.name = 'ValidationError';
        this.fieldErrors = fieldErrors;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            fieldErrors: this.fieldErrors,
        };
    }
}
exports.ValidationError = ValidationError;
/**
 * Authentication error (HTTP 401)
 * Thrown when API key is invalid or missing
 */
class AuthenticationError extends RooguysError {
    constructor(message, { code = 'AUTHENTICATION_ERROR', requestId = null } = {}) {
        super(message, { code, requestId, statusCode: 401 });
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Forbidden error (HTTP 403)
 * Thrown when access is denied
 */
class ForbiddenError extends RooguysError {
    constructor(message, { code = 'FORBIDDEN', requestId = null } = {}) {
        super(message, { code, requestId, statusCode: 403 });
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * Not found error (HTTP 404)
 * Thrown when requested resource doesn't exist
 */
class NotFoundError extends RooguysError {
    constructor(message, { code = 'NOT_FOUND', requestId = null } = {}) {
        super(message, { code, requestId, statusCode: 404 });
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Conflict error (HTTP 409)
 * Thrown when resource already exists or state conflict
 */
class ConflictError extends RooguysError {
    constructor(message, { code = 'CONFLICT', requestId = null } = {}) {
        super(message, { code, requestId, statusCode: 409 });
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
/**
 * Rate limit error (HTTP 429)
 * Thrown when rate limit is exceeded
 */
class RateLimitError extends RooguysError {
    constructor(message, { code = 'RATE_LIMIT_EXCEEDED', requestId = null, retryAfter = 60 } = {}) {
        super(message, { code, requestId, statusCode: 429 });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
        };
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Server error (HTTP 500+)
 * Thrown when server encounters an error
 */
class ServerError extends RooguysError {
    constructor(message, { code = 'SERVER_ERROR', requestId = null, statusCode = 500 } = {}) {
        super(message, { code, requestId, statusCode });
        this.name = 'ServerError';
    }
}
exports.ServerError = ServerError;
/**
 * Map HTTP status code to appropriate error class
 * @param status - HTTP status code
 * @param errorBody - Error response body
 * @param requestId - Request ID from response
 * @param headers - Response headers
 * @returns Appropriate error instance
 */
function mapStatusToError(status, errorBody, requestId, headers = {}) {
    const errorObj = typeof (errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) === 'object' ? errorBody.error : null;
    const message = (errorObj === null || errorObj === void 0 ? void 0 : errorObj.message) ||
        (typeof (errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) === 'string' ? errorBody.error : null) ||
        (errorBody === null || errorBody === void 0 ? void 0 : errorBody.message) ||
        'An error occurred';
    const code = (errorObj === null || errorObj === void 0 ? void 0 : errorObj.code) || (errorBody === null || errorBody === void 0 ? void 0 : errorBody.code) || 'UNKNOWN_ERROR';
    const fieldErrors = (errorObj === null || errorObj === void 0 ? void 0 : errorObj.details) || (errorBody === null || errorBody === void 0 ? void 0 : errorBody.details) || null;
    switch (status) {
        case 400:
            return new ValidationError(message, { code, requestId, fieldErrors });
        case 401:
            return new AuthenticationError(message, { code, requestId });
        case 403:
            return new ForbiddenError(message, { code, requestId });
        case 404:
            return new NotFoundError(message, { code, requestId });
        case 409:
            return new ConflictError(message, { code, requestId });
        case 429: {
            const retryAfter = parseInt(headers['retry-after'] || headers['Retry-After'] || '60', 10);
            return new RateLimitError(message, { code, requestId, retryAfter });
        }
        default:
            if (status >= 500) {
                return new ServerError(message, { code, requestId, statusCode: status });
            }
            return new RooguysError(message, { code, requestId, statusCode: status });
    }
}
