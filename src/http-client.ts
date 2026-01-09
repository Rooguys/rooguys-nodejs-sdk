/**
 * Rooguys Node.js SDK HTTP Client
 * Handles standardized response format, rate limit headers, and error mapping
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import {
  RooguysError,
  RateLimitError,
  mapStatusToError,
  ErrorResponseBody,
} from './errors';

/**
 * Rate limit information extracted from response headers
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp when the limit resets */
  reset: number;
}

/**
 * Cache metadata from API responses
 */
export interface CacheMetadata {
  /** When the data was cached */
  cachedAt: Date | null;
  /** Time-to-live in seconds */
  ttl: number;
}

/**
 * Pagination information
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API response wrapper with metadata
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Request ID for debugging */
  requestId: string | null;
  /** Rate limit information */
  rateLimit: RateLimitInfo;
  /** Pagination info if present */
  pagination?: Pagination | null;
  /** Cache metadata if present */
  cacheMetadata?: CacheMetadata | null;
}

/**
 * Request configuration options
 */
export interface RequestConfig {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** API endpoint path */
  path: string;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Request body */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Idempotency key for POST requests */
  idempotencyKey?: string;
  /** Request timeout in ms */
  timeout?: number;
}

/**
 * HTTP Client options
 */
export interface HttpClientOptions {
  /** Base URL for API */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Callback when rate limit is 80% consumed */
  onRateLimitWarning?: ((rateLimit: RateLimitInfo) => void) | null;
  /** Enable auto-retry for rate-limited requests */
  autoRetry?: boolean;
  /** Maximum retry attempts for rate limits */
  maxRetries?: number;
  /** Base delay for retries in ms */
  retryDelay?: number;
}

/**
 * Standardized API response format
 */
interface StandardizedResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field: string; message: string }>;
  };
  request_id?: string;
  pagination?: Pagination;
}

/**
 * Parsed response body result
 */
interface ParsedResponseBody<T> {
  data?: T;
  error?: ErrorResponseBody['error'];
  pagination?: Pagination | null;
  requestId?: string | null;
}

/**
 * Extract rate limit information from response headers
 * @param headers - Response headers (axios format)
 * @returns Rate limit info
 */
export function extractRateLimitInfo(headers: Record<string, string | undefined>): RateLimitInfo {
  const getHeader = (name: string): string | undefined => {
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
export function extractRequestId(
  headers: Record<string, string | undefined>,
  body: unknown
): string | null {
  // Try headers first
  const getHeader = (name: string): string | undefined => {
    return headers[name] || headers[name.toLowerCase()];
  };

  const headerRequestId = getHeader('X-Request-Id') || getHeader('x-request-id');
  if (headerRequestId) {
    return headerRequestId;
  }

  // Fall back to body
  if (body && typeof body === 'object') {
    const bodyObj = body as Record<string, unknown>;
    return (bodyObj.request_id as string) || (bodyObj.requestId as string) || null;
  }

  return null;
}

/**
 * Parse standardized API response format
 * Handles both new format { success: true, data: {...} } and legacy format
 * @param body - Response body
 * @returns Parsed response with data and metadata
 */
export function parseResponseBody<T>(body: unknown): ParsedResponseBody<T> {
  if (!body || typeof body !== 'object') {
    return {
      data: body as T,
      pagination: null,
      requestId: null,
    };
  }

  const bodyObj = body as Record<string, unknown>;

  // New standardized format with { success: true, data: {...} }
  if (typeof bodyObj.success === 'boolean') {
    if (bodyObj.success) {
      // If there's a data field, unwrap it; otherwise return the whole body
      // This handles both { success: true, data: {...} } and { success: true, message: "..." }
      const data = 'data' in bodyObj ? bodyObj.data : body;
      return {
        data: data as T,
        pagination: (bodyObj.pagination as Pagination) || null,
        requestId: (bodyObj.request_id as string) || null,
      };
    }
    // Error response in standardized format
    return {
      error: bodyObj.error as ErrorResponseBody['error'],
      requestId: (bodyObj.request_id as string) || null,
    };
  }

  // Legacy format - return as-is
  return {
    data: body as T,
    pagination: (bodyObj.pagination as Pagination) || null,
    requestId: null,
  };
}

/**
 * HTTP Client class for making API requests
 */
export class HttpClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private onRateLimitWarning: ((rateLimit: RateLimitInfo) => void) | null;
  private autoRetry: boolean;
  private maxRetries: number;
  private retryDelay: number;

  constructor(apiKey: string, options: HttpClientOptions = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || 'https://api.rooguys.com/v1';
    this.timeout = options.timeout || 10000;
    this.onRateLimitWarning = options.onRateLimitWarning || null;
    this.autoRetry = options.autoRetry || false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    this.client = axios.create({
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
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build query string from params object
   * @param params - Query parameters
   * @returns Cleaned params object
   */
  private buildParams(
    params: Record<string, string | number | boolean | undefined | null>
  ): Record<string, string | number | boolean> {
    const cleaned: Record<string, string | number | boolean> = {};
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
  async request<T>(config: RequestConfig, retryCount = 0): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      path,
      params = {},
      body = null,
      headers = {},
      idempotencyKey = undefined,
      timeout,
    } = config;

    // Build request config
    const requestConfig: AxiosRequestConfig = {
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
      const response: AxiosResponse = await this.client.request(requestConfig);

      // Extract headers info
      const rateLimit = extractRateLimitInfo(response.headers as Record<string, string>);

      // Check for rate limit warning (80% consumed)
      if (rateLimit.remaining < rateLimit.limit * 0.2 && this.onRateLimitWarning) {
        this.onRateLimitWarning(rateLimit);
      }

      // Extract request ID
      const requestId = extractRequestId(response.headers as Record<string, string>, response.data);

      // Parse response body
      const parsed = parseResponseBody<T>(response.data);

      // Check for error in standardized format
      if (parsed.error) {
        throw mapStatusToError(400, { error: parsed.error }, requestId, {});
      }

      return {
        data: parsed.data as T,
        requestId: requestId || parsed.requestId || null,
        rateLimit,
        pagination: parsed.pagination,
      };
    } catch (error) {
      // Re-throw RooguysError instances
      if (error instanceof RooguysError) {
        throw error;
      }

      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponseBody>;
        const status = axiosError.response?.status || 0;
        const responseData = axiosError.response?.data || null;
        const responseHeaders = (axiosError.response?.headers || {}) as Record<string, string>;
        const requestId = extractRequestId(responseHeaders, responseData);

        const mappedError = mapStatusToError(status, responseData, requestId, {
          'retry-after': responseHeaders['retry-after'],
          'Retry-After': responseHeaders['Retry-After'],
        });

        // Auto-retry for rate limit errors if enabled
        if (this.autoRetry && mappedError instanceof RateLimitError && retryCount < this.maxRetries) {
          const retryAfterMs = mappedError.retryAfter * 1000;
          await this.sleep(retryAfterMs);
          return this.request<T>(config, retryCount + 1);
        }

        throw mappedError;
      }

      // Handle timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new RooguysError('Request timeout', { code: 'TIMEOUT', statusCode: 408 });
      }

      // Handle other errors
      throw new RooguysError(
        error instanceof Error ? error.message : 'Network error',
        { code: 'NETWORK_ERROR', statusCode: 0 }
      );
    }
  }

  /**
   * Convenience method for GET requests
   */
  get<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined | null> = {},
    options: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', path, params, ...options });
  }

  /**
   * Convenience method for POST requests
   */
  post<T>(
    path: string,
    body: unknown = null,
    options: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', path, body, ...options });
  }

  /**
   * Convenience method for PUT requests
   */
  put<T>(
    path: string,
    body: unknown = null,
    options: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', path, body, ...options });
  }

  /**
   * Convenience method for PATCH requests
   */
  patch<T>(
    path: string,
    body: unknown = null,
    options: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', path, body, ...options });
  }

  /**
   * Convenience method for DELETE requests
   */
  delete<T>(path: string, options: Partial<RequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', path, ...options });
  }
}
