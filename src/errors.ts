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
export class RooguysError extends Error {
  public readonly code: string;
  public readonly requestId: string | null;
  public readonly statusCode: number;

  constructor(
    message: string,
    { code = 'UNKNOWN_ERROR', requestId = null, statusCode = 500 }: RooguysErrorOptions = {}
  ) {
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

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      requestId: this.requestId,
      statusCode: this.statusCode,
    };
  }
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
export class ValidationError extends RooguysError {
  public readonly fieldErrors: FieldError[] | null;

  constructor(
    message: string,
    { code = 'VALIDATION_ERROR', requestId = null, fieldErrors = null }: ValidationErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode: 400 });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

/**
 * Authentication error (HTTP 401)
 * Thrown when API key is invalid or missing
 */
export class AuthenticationError extends RooguysError {
  constructor(
    message: string,
    { code = 'AUTHENTICATION_ERROR', requestId = null }: RooguysErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode: 401 });
    this.name = 'AuthenticationError';
  }
}

/**
 * Forbidden error (HTTP 403)
 * Thrown when access is denied
 */
export class ForbiddenError extends RooguysError {
  constructor(
    message: string,
    { code = 'FORBIDDEN', requestId = null }: RooguysErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode: 403 });
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error (HTTP 404)
 * Thrown when requested resource doesn't exist
 */
export class NotFoundError extends RooguysError {
  constructor(
    message: string,
    { code = 'NOT_FOUND', requestId = null }: RooguysErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode: 404 });
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (HTTP 409)
 * Thrown when resource already exists or state conflict
 */
export class ConflictError extends RooguysError {
  constructor(
    message: string,
    { code = 'CONFLICT', requestId = null }: RooguysErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode: 409 });
    this.name = 'ConflictError';
  }
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
export class RateLimitError extends RooguysError {
  public readonly retryAfter: number;

  constructor(
    message: string,
    { code = 'RATE_LIMIT_EXCEEDED', requestId = null, retryAfter = 60 }: RateLimitErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode: 429 });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Server error (HTTP 500+)
 * Thrown when server encounters an error
 */
export class ServerError extends RooguysError {
  constructor(
    message: string,
    { code = 'SERVER_ERROR', requestId = null, statusCode = 500 }: RooguysErrorOptions = {}
  ) {
    super(message, { code, requestId, statusCode });
    this.name = 'ServerError';
  }
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
export function mapStatusToError(
  status: number,
  errorBody: ErrorResponseBody | null,
  requestId: string | null,
  headers: ErrorResponseHeaders = {}
): RooguysError {
  const errorObj = typeof errorBody?.error === 'object' ? errorBody.error : null;
  const message = errorObj?.message || 
    (typeof errorBody?.error === 'string' ? errorBody.error : null) || 
    errorBody?.message || 
    'An error occurred';
  const code = errorObj?.code || errorBody?.code || 'UNKNOWN_ERROR';
  const fieldErrors = errorObj?.details || errorBody?.details || null;

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
