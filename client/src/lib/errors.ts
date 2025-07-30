/**
 * Standardized error handling utilities for the Gyllencreutz Heritage application
 * 
 * Provides consistent error types, handling patterns, and user-friendly error messages
 * following OWASP security guidelines and comprehensive error handling practices.
 */

import { toast } from '@/hooks/use-toast';

/**
 * Base error class for application-specific errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly userMessage: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a sanitized error object safe for client-side logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

/**
 * Validation error for invalid user input
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly userMessage = 'Please check your input and try again.';

  constructor(message: string, public readonly field?: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Network/API related errors
 */
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly userMessage = 'Connection failed. Please check your internet connection and try again.';

  constructor(message: string, public readonly status?: number, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Data processing errors
 */
export class DataError extends AppError {
  readonly code = 'DATA_ERROR';
  readonly userMessage = 'There was a problem processing the data. Please try again.';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Authentication/authorization errors
 */
export class AuthError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly userMessage = 'Authentication failed. Please log in again.';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * External service integration errors (GitHub, Cosmos DB, etc.)
 */
export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly userMessage = 'External service is temporarily unavailable. Please try again later.';

  constructor(message: string, public readonly service: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * File operation errors
 */
export class FileError extends AppError {
  readonly code = 'FILE_ERROR';
  readonly userMessage = 'File operation failed. Please check the file and try again.';

  constructor(message: string, public readonly operation: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Error severity levels for logging and alerting
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context interface for consistent error reporting
 */
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Handles and reports errors in a standardized way
 * 
 * @param error - The error to handle
 * @param context - Additional context information
 * @param severity - Error severity level
 * @param showToUser - Whether to show error message to user
 */
export function handleError(
  error: unknown,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  showToUser: boolean = true
): void {
  const processedError = processError(error);
  
  // Log error (in production, this would go to external logging service)
  console.error('Application Error:', {
    ...processedError.toJSON(),
    severity,
    context,
  });

  // Show user-friendly message if requested
  if (showToUser) {
    toast({
      title: 'Error',
      description: processedError.userMessage,
      variant: 'destructive',
    });
  }

  // In production, report to error monitoring service
  if (process.env.NODE_ENV === 'production') {
    reportErrorToService(processedError, context, severity);
  }
}

/**
 * Converts unknown error types to standardized AppError instances
 */
export function processError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message);
    }
    
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return new ValidationError(error.message);
    }

    // Default to generic data error
    return new DataError(error.message);
  }

  if (typeof error === 'string') {
    return new DataError(error);
  }

  // Fallback for unknown error types
  return new DataError('An unexpected error occurred');
}

/**
 * Creates error context from the current application state
 */
export function createErrorContext(component?: string, action?: string): ErrorContext {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    component,
    action,
    sessionId: getSessionId(),
  };
}

/**
 * Validates API responses and throws appropriate errors
 */
export function validateApiResponse(response: Response): void {
  if (!response.ok) {
    const context = {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    };

    if (response.status >= 400 && response.status < 500) {
      if (response.status === 401 || response.status === 403) {
        throw new AuthError(`Authentication failed: ${response.statusText}`, context);
      }
      throw new ValidationError(`Request failed: ${response.statusText}`, undefined, context);
    }

    if (response.status >= 500) {
      throw new ExternalServiceError(`Server error: ${response.statusText}`, 'api', context);
    }

    throw new NetworkError(`Network error: ${response.statusText}`, response.status, context);
  }
}

/**
 * Async error boundary wrapper for promise-based operations
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context, severity);
    return null;
  }
}

/**
 * Async error boundary wrapper for API operations that should throw errors
 */
export async function withApiErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Process and re-throw the error instead of returning null
    const processedError = processError(error);
    handleError(processedError, context, severity);
    throw processedError;
  }
}

/**
 * Synchronous error boundary wrapper
 */
export function withSyncErrorHandling<T>(
  operation: () => T,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): T | null {
  try {
    return operation();
  } catch (error) {
    handleError(error, context, severity);
    return null;
  }
}

// Private helper functions

function getSessionId(): string | undefined {
  // In a real application, this would retrieve the session ID
  // from localStorage, sessionStorage, or cookies
  return typeof window !== 'undefined' 
    ? window.sessionStorage?.getItem('sessionId') || undefined
    : undefined;
}

function reportErrorToService(
  error: AppError,
  context?: ErrorContext,
  severity?: ErrorSeverity
): void {
  // In production, this would send error reports to services like:
  // - Sentry
  // - LogRocket
  // - Bugsnag
  // - Custom logging endpoint
  
  console.log('Would report to error service:', {
    error: error.toJSON(),
    context,
    severity,
  });
}