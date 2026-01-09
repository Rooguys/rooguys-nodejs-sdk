/**
 * Rooguys Node.js SDK Error Classes
 * Typed error classes for different API error scenarios
 */
/**
 * Field-level error detail
 */
export interface FieldError {
    field: string;
    message: string;
}
/**
 * Base error options
 */
export interface RooguysErrorOptions {
    code?: string;
    requestId?: string | null;
    statusCode?: number;
}
/**
 * Base error class for all Rooguys SDK errors
 */
export declare class RooguysError extends Error {
    readonly code: string;
    readonly requestId: string | null;
    readonly statusCode: number;
    constructor(message: string, { code, requestId, statusCode }?: RooguysErrorOptions);
    toJSON(): Record<string, unknown>;
}
/**
 * Validation error options
 */
export interface ValidationErrorOptions extends RooguysErrorOptions {
    fieldErrors?: FieldError[] | null;
}
/**
 * Validation error (HTTP 400)
 * Thrown when request validation fails
 */
export declare class ValidationError extends RooguysError {
    readonly fieldErrors: FieldError[] | null;
    constructor(message: string, { code, requestId, fieldErrors }?: ValidationErrorOptions);
    toJSON(): Record<string, unknown>;
}
/**
 * Authentication error (HTTP 401)
 * Thrown when API key is invalid or missing
 */
export declare class AuthenticationError extends RooguysError {
    constructor(message: string, { code, requestId }?: RooguysErrorOptions);
}
/**
 * Forbidden error (HTTP 403)
 * Thrown when access is denied
 */
export declare class ForbiddenError extends RooguysError {
    constructor(message: string, { code, requestId }?: RooguysErrorOptions);
}
/**
 * Not found error (HTTP 404)
 * Thrown when requested resource doesn't exist
 */
export declare class NotFoundError extends RooguysError {
    constructor(message: string, { code, requestId }?: RooguysErrorOptions);
}
/**
 * Conflict error (HTTP 409)
 * Thrown when resource already exists or state conflict
 */
export declare class ConflictError extends RooguysError {
    constructor(message: string, { code, requestId }?: RooguysErrorOptions);
}
/**
 * Rate limit error options
 */
export interface RateLimitErrorOptions extends RooguysErrorOptions {
    retryAfter?: number;
}
/**
 * Rate limit error (HTTP 429)
 * Thrown when rate limit is exceeded
 */
export declare class RateLimitError extends RooguysError {
    readonly retryAfter: number;
    constructor(message: string, { code, requestId, retryAfter }?: RateLimitErrorOptions);
    toJSON(): Record<string, unknown>;
}
/**
 * Server error (HTTP 500+)
 * Thrown when server encounters an error
 */
export declare class ServerError extends RooguysError {
    constructor(message: string, { code, requestId, statusCode }?: RooguysErrorOptions);
}
/**
 * Error response body structure
 */
export interface ErrorResponseBody {
    error?: {
        message?: string;
        code?: string;
        details?: FieldError[];
    } | string;
    message?: string;
    code?: string;
    details?: FieldError[];
}
/**
 * Response headers for error mapping
 */
export interface ErrorResponseHeaders {
    'retry-after'?: string;
    'Retry-After'?: string;
}
/**
 * Map HTTP status code to appropriate error class
 * @param status - HTTP status code
 * @param errorBody - Error response body
 * @param requestId - Request ID from response
 * @param headers - Response headers
 * @returns Appropriate error instance
 */
export declare function mapStatusToError(status: number, errorBody: ErrorResponseBody | null, requestId: string | null, headers?: ErrorResponseHeaders): RooguysError;
