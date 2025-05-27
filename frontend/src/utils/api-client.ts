import { BaseError, NetworkError, AuthenticationError } from './error-handling/error-types';
import { errorHandler } from './error-handling/error-handler';
import { monitoring } from './monitoring';
import { security } from './security';
import { logger } from './logger';

interface RequestConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  skipErrorHandling?: boolean;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly baseUrl: string;
  private readonly defaultRetries = 3;
  private readonly defaultRetryDelay = 1000;
  private readonly defaultTimeout = 30000;

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private get defaultHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      'X-Client-Version': process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;
    
    if (error instanceof BaseError) {
      // Retry on network errors or specific status codes
      return (
        error instanceof NetworkError ||
        error.statusCode === 408 || // Request Timeout
        error.statusCode === 429 || // Too Many Requests
        error.statusCode >= 500    // Server Errors
      );
    }

    return true; // Retry on unknown errors
  }

  private async fetchWithTimeout(
    input: RequestInfo,
    init?: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const { timeout = this.defaultTimeout } = init || {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      let errorData;

      if (isJson) {
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Ignore JSON parsing errors in error responses
        }
      }

      // Map response status to specific error types
      switch (response.status) {
        case 401:
          throw new AuthenticationError(errorMessage);
        case 403:
          throw new AuthorizationError(errorMessage);
        case 404:
          throw new NotFoundError(errorMessage);
        case 409:
          throw new ConflictError(errorMessage);
        case 429:
          throw new RateLimitError(errorMessage);
        default:
          throw new ServerError(errorMessage);
      }
    }

    // Handle successful response
    if (isJson) {
      return response.json();
    }
    return response.text();
  }

  private async executeRequest<T>(
    url: string,
    config: RequestConfig,
  ): Promise<T> {
    const maxRetries = config.retries ?? this.defaultRetries;
    const retryDelay = config.retryDelay ?? this.defaultRetryDelay;
    let attempt = 0;

    while (true) {
      const startTime = performance.now();
      
      try {
        // Validate URL
        if (!security.validateUrl(url)) {
          throw new Error('Invalid URL');
        }

        // Add correlation ID and other security headers
        const headers = {
          ...this.defaultHeaders,
          ...config.headers,
          'X-Correlation-ID': crypto.randomUUID(),
        };

        const response = await this.fetchWithTimeout(url, {
          ...config,
          headers,
        });

        const duration = performance.now() - startTime;
        monitoring.logNetworkRequest('api', url, response.status, duration);

        return await this.handleResponse(response);
      } catch (error) {
        attempt++;
        const duration = performance.now() - startTime;

        // Log the error
        logger.error('API request failed', {
          url,
          attempt,
          duration,
          error,
        });

        // Monitor the error
        monitoring.captureError('API request failed', error);

        if (this.shouldRetry(error, attempt, maxRetries)) {
          await this.delay(retryDelay * attempt); // Exponential backoff
          continue;
        }

        // If we're not handling errors for this request, rethrow
        if (config.skipErrorHandling) {
          throw error;
        }

        // Handle the error using our error handler
        await errorHandler.handle(error, {
          context: {
            url,
            attempt,
            duration,
          },
        });

        throw error;
      }
    }
  }

  async get<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const url = this.baseUrl + path;
    return this.executeRequest<T>(url, {
      ...config,
      method: 'GET',
    });
  }

  async post<T>(path: string, data: unknown, config: RequestConfig = {}): Promise<T> {
    const url = this.baseUrl + path;
    return this.executeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(path: string, data: unknown, config: RequestConfig = {}): Promise<T> {
    const url = this.baseUrl + path;
    return this.executeRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const url = this.baseUrl + path;
    return this.executeRequest<T>(url, {
      ...config,
      method: 'DELETE',
    });
  }
}

// Export a singleton instance
export const apiClient = ApiClient.getInstance(); 