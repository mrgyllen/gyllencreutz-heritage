/**
 * Standardized API client with consistent error handling and request patterns
 * 
 * Provides a centralized way to make HTTP requests with proper error handling,
 * request/response logging, and retry logic for the Gyllencreutz Heritage application.
 */

import { 
  NetworkError, 
  ValidationError, 
  ExternalServiceError, 
  validateApiResponse,
  withApiErrorHandling,
  ErrorSeverity,
  type ErrorContext 
} from '@/lib/errors';
import type { CosmosDbFamilyMember, CreateCosmosDbFamilyMember, ImportStatus, Monarch } from '@/types/family';

/**
 * Configuration options for API requests
 */
export interface ApiRequestOptions extends RequestInit {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 2) */
  retries?: number;
  /** Whether to include credentials (default: 'same-origin') */
  credentials?: RequestCredentials;
  /** Custom error context for error reporting */
  errorContext?: ErrorContext;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

/**
 * API client class with standardized error handling and request patterns
 */
export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(baseUrl: string = '', timeout: number = 10000, retries: number = 2) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
    this.defaultRetries = retries;
  }

  /**
   * Makes a GET request to the specified endpoint
   * 
   * @param endpoint - API endpoint path
   * @param options - Request configuration options
   * @returns Promise resolving to the response data
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Makes a POST request to the specified endpoint
   * 
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Request configuration options
   * @returns Promise resolving to the response data
   */
  async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  }

  /**
   * Makes a PUT request to the specified endpoint
   * 
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @param options - Request configuration options
   * @returns Promise resolving to the response data
   */
  async put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  }

  /**
   * Makes a DELETE request to the specified endpoint
   * 
   * @param endpoint - API endpoint path
   * @param options - Request configuration options
   * @returns Promise resolving to the response data
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Core request method with error handling, retries, and logging
   * 
   * @private
   * @param endpoint - API endpoint path
   * @param options - Request configuration options
   * @returns Promise resolving to the response data
   */
  private async request<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options?.timeout ?? this.defaultTimeout;
    const maxRetries = options?.retries ?? this.defaultRetries;
    
    const requestOptions: RequestInit = {
      credentials: 'same-origin',
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options?.headers,
      },
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        // Use performance-optimized timeout handling
        const timeoutId = setTimeout(() => {
          // Use requestAnimationFrame to defer abort for better performance
          requestAnimationFrame(() => controller.abort());
        }, timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Validate response status
        validateApiResponse(response);

        // Parse response
        const contentType = response.headers.get('content-type');
        let responseData: T;

        if (contentType?.includes('application/json')) {
          const jsonData = await response.json();
          
          // Handle wrapped API responses
          if (this.isWrappedResponse(jsonData)) {
            if (!jsonData.success && jsonData.error) {
              throw new ValidationError(jsonData.error);
            }
            responseData = (jsonData.data ?? jsonData) as T;
          } else {
            responseData = jsonData as T;
          }
        } else {
          // Handle non-JSON responses
          responseData = (await response.text()) as unknown as T;
        }

        // Log successful request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`API ${requestOptions.method || 'GET'} ${url}:`, {
            status: response.status,
            attempt: attempt + 1,
            data: responseData,
          });
        }

        return responseData;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry for certain error types
        if (error instanceof ValidationError || 
            (error instanceof NetworkError && error.status && error.status < 500)) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (optimized exponential backoff)
        // Use shorter delays to prevent performance violations
        const delay = Math.min(500 * Math.pow(1.5, attempt), 2000);
        
        // Use requestAnimationFrame for better performance on shorter delays
        if (delay < 100) {
          await new Promise(resolve => requestAnimationFrame(resolve));
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Throw the last error if all retries failed
    if (lastError) {
      throw new NetworkError(
        `Request failed after ${maxRetries + 1} attempts: ${lastError.message}`,
        undefined,
        { url, method: requestOptions.method }
      );
    }

    throw new NetworkError('Request failed with unknown error');
  }

  /**
   * Checks if the response follows the wrapped API response pattern
   * 
   * @private
   * @param data - Response data to check
   * @returns True if data follows wrapped response pattern
   */
  private isWrappedResponse(data: unknown): data is ApiResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      ('success' in data || 'error' in data || 'message' in data)
    );
  }
}

// Default API client instance
export const apiClient = new ApiClient();

/**
 * Family-specific API methods with error handling
 */
export const familyApi = {
  /**
   * Retrieves all family members from Cosmos DB
   */
  async getMembers(): Promise<CosmosDbFamilyMember[]> {
    return withApiErrorHandling(
      () => apiClient.get<CosmosDbFamilyMember[]>('/api/cosmos/members'),
      { component: 'FamilyApi', action: 'getMembers' },
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Retrieves a specific family member by ID
   */
  async getMember(id: string): Promise<CosmosDbFamilyMember> {
    return withApiErrorHandling(
      () => apiClient.get<CosmosDbFamilyMember>(`/api/cosmos/members/${id}`),
      { component: 'FamilyApi', action: 'getMember', additionalData: { id } },
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Creates a new family member
   */
  async createMember(memberData: CreateCosmosDbFamilyMember): Promise<CosmosDbFamilyMember> {
    return withApiErrorHandling(
      () => apiClient.post<CosmosDbFamilyMember>('/api/cosmos/members', memberData),
      { component: 'FamilyApi', action: 'createMember' },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Updates an existing family member
   */
  async updateMember(id: string, memberData: Partial<CosmosDbFamilyMember>): Promise<CosmosDbFamilyMember> {
    return withApiErrorHandling(
      () => apiClient.put<CosmosDbFamilyMember>(`/api/cosmos/members/${id}`, memberData),
      { component: 'FamilyApi', action: 'updateMember', additionalData: { id } },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Deletes a family member
   */
  async deleteMember(id: string): Promise<{ success: boolean; message: string }> {
    return withApiErrorHandling(
      () => apiClient.delete<{ success: boolean; message: string }>(`/api/cosmos/members/${id}`),
      { component: 'FamilyApi', action: 'deleteMember', additionalData: { id } },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Gets import status information
   */
  async getImportStatus(): Promise<ImportStatus> {
    return withApiErrorHandling(
      () => apiClient.get<ImportStatus>('/api/cosmos/import/status'),
      { component: 'FamilyApi', action: 'getImportStatus' },
      ErrorSeverity.LOW
    );
  },

  /**
   * Bulk updates family members with monarch IDs (execute mode)
   */
  async bulkUpdateMonarchs(): Promise<any> {
    return withApiErrorHandling(
      () => apiClient.post('/api/cosmos/members/bulk-update-monarchs'),
      { component: 'FamilyApi', action: 'bulkUpdateMonarchs' },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Performs dry run of bulk update family members with monarch IDs
   */
  async bulkUpdateMonarchsDryRun(): Promise<any> {
    return withApiErrorHandling(
      () => apiClient.post('/api/cosmos/members/bulk-update-monarchs?dryRun=true'),
      { component: 'FamilyApi', action: 'bulkUpdateMonarchsDryRun' },
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Gets monarchs that reigned during a family member's lifetime
   */
  async getMonarchsDuringLifetime(memberId: string): Promise<any> {
    return withApiErrorHandling(
      () => apiClient.get(`/api/cosmos/members/${memberId}/monarchs`),
      { component: 'FamilyApi', action: 'getMonarchsDuringLifetime', additionalData: { memberId } },
      ErrorSeverity.MEDIUM
    );
  },
};

/**
 * Monarchs API methods with error handling
 */
export const monarchsApi = {
  /**
   * Retrieves all monarchs from Cosmos DB
   */
  async getAll(): Promise<Monarch[]> {
    return withApiErrorHandling(
      () => apiClient.get<Monarch[]>('/api/cosmos/monarchs'),
      { component: 'MonarchsApi', action: 'getAll' },
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Retrieves a specific monarch by ID
   */
  async getMonarch(id: string): Promise<Monarch> {
    return withApiErrorHandling(
      () => apiClient.get<Monarch>(`/api/cosmos/monarchs/${id}`),
      { component: 'MonarchsApi', action: 'getMonarch', additionalData: { id } },
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Creates a new monarch
   */
  async createMonarch(monarchData: Monarch): Promise<Monarch> {
    return withApiErrorHandling(
      () => apiClient.post<Monarch>('/api/cosmos/monarchs', monarchData),
      { component: 'MonarchsApi', action: 'createMonarch' },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Updates an existing monarch
   */
  async updateMonarch(id: string, monarchData: Partial<Monarch>): Promise<Monarch> {
    return withApiErrorHandling(
      () => apiClient.put<Monarch>(`/api/cosmos/monarchs/${id}`, monarchData),
      { component: 'MonarchsApi', action: 'updateMonarch', additionalData: { id } },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Deletes a monarch
   */
  async deleteMonarch(id: string): Promise<{ success: boolean; message: string }> {
    return withApiErrorHandling(
      () => apiClient.delete<{ success: boolean; message: string }>(`/api/cosmos/monarchs/${id}`),
      { component: 'MonarchsApi', action: 'deleteMonarch', additionalData: { id } },
      ErrorSeverity.HIGH
    );
  },

  /**
   * Imports monarchs from JSON data
   */
  async importMonarchs(monarchsData: Monarch[]): Promise<any> {
    return withApiErrorHandling(
      () => apiClient.post('/api/cosmos/monarchs/import', monarchsData),
      { component: 'MonarchsApi', action: 'importMonarchs' },
      ErrorSeverity.HIGH
    );
  },
};

/**
 * GitHub sync API methods with error handling
 */
export const githubApi = {
  /**
   * Gets GitHub sync status
   */
  async getStatus() {
    return withApiErrorHandling(
      () => apiClient.get('/api/github/status'),
      { component: 'GitHubApi', action: 'getStatus' },
      ErrorSeverity.LOW
    );
  },

  /**
   * Tests GitHub connection
   */
  async testConnection() {
    return withApiErrorHandling(
      () => apiClient.post('/api/github/test'),
      { component: 'GitHubApi', action: 'testConnection' },
      ErrorSeverity.MEDIUM
    );
  },

  /**
   * Retries failed GitHub sync operations
   */
  async retrySync() {
    return withApiErrorHandling(
      () => apiClient.post('/api/github/retry'),
      { component: 'GitHubApi', action: 'retrySync' },
      ErrorSeverity.MEDIUM
    );
  },
};