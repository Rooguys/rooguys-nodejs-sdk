/**
 * Rooguys Node.js SDK HTTP Client
 * Handles standardized response format, rate limit headers, and error mapping
 */
import { ErrorResponseBody } from './errors';
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
export declare function extractRateLimitInfo(headers: Record<string, string | undefined>): RateLimitInfo;
/**
 * Extract request ID from response headers or body
 * @param headers - Response headers
 * @param body - Response body
 * @returns Request ID or null
 */
export declare function extractRequestId(headers: Record<string, string | undefined>, body: unknown): string | null;
/**
 * Parse standardized API response format
 * Handles both new format { success: true, data: {...} } and legacy format
 * @param body - Response body
 * @returns Parsed response with data and metadata
 */
export declare function parseResponseBody<T>(body: unknown): ParsedResponseBody<T>;
/**
 * HTTP Client class for making API requests
 */
export declare class HttpClient {
    private client;
    private apiKey;
    private baseUrl;
    private timeout;
    private onRateLimitWarning;
    private autoRetry;
    private maxRetries;
    private retryDelay;
    constructor(apiKey: string, options?: HttpClientOptions);
    /**
     * Sleep for a specified duration
     * @param ms - Milliseconds to sleep
     */
    private sleep;
    /**
     * Build query string from params object
     * @param params - Query parameters
     * @returns Cleaned params object
     */
    private buildParams;
    /**
     * Make an HTTP request with optional auto-retry for rate limits
     * @param config - Request configuration
     * @param retryCount - Current retry attempt (internal use)
     * @returns API response with data and metadata
     */
    request<T>(config: RequestConfig, retryCount?: number): Promise<ApiResponse<T>>;
    /**
     * Convenience method for GET requests
     */
    get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>, options?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
    /**
     * Convenience method for POST requests
     */
    post<T>(path: string, body?: unknown, options?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
    /**
     * Convenience method for PUT requests
     */
    put<T>(path: string, body?: unknown, options?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
    /**
     * Convenience method for PATCH requests
     */
    patch<T>(path: string, body?: unknown, options?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
    /**
     * Convenience method for DELETE requests
     */
    delete<T>(path: string, options?: Partial<RequestConfig>): Promise<ApiResponse<T>>;
}
export {};
