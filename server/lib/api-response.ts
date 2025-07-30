/**
 * Standardized API response utilities for consistent REST API responses
 * 
 * Provides unified response formats, error handling, and HTTP status code management
 * to ensure consistent API behavior across all endpoints.
 */

import type { Response } from 'express';

/**
 * Standard API response interface for all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  timestamp: string;
  path?: string;
}

/**
 * Validation error structure for detailed field-level errors
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Error severity levels for logging
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * HTTP status codes for consistent API responses
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Creates a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  path?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    path
  };
}

/**
 * Creates an error API response
 */
export function createErrorResponse(
  message: string,
  errors?: ValidationError[],
  path?: string
): ApiResponse {
  return {
    success: false,
    error: message,
    errors,
    timestamp: new Date().toISOString(),
    path
  };
}

/**
 * Sends a successful response with proper status code
 */
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  statusCode: number = HttpStatus.OK,
  message?: string
): void {
  const response = createSuccessResponse(data, message, res.req?.path);
  res.status(statusCode).json(response);
}

/**
 * Sends an error response with proper status code and logging
 */
export function sendErrorResponse(
  res: Response,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  errors?: ValidationError[],
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): void {
  const response = createErrorResponse(message, errors, res.req?.path);
  
  // Log error based on severity
  const logMessage = `[${severity.toUpperCase()}] API Error: ${message}`;
  if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
    console.error(logMessage, { response, statusCode });
  } else {
    console.warn(logMessage);
  }
  
  res.status(statusCode).json(response);
}

/**
 * Handles async route errors with proper error response
 */
export function handleAsyncError(
  error: unknown,
  res: Response,
  defaultMessage: string = 'Internal server error',
  path?: string
): void {
  console.error('Async route error:', error);
  
  if (error instanceof Error) {
    sendErrorResponse(
      res,
      error.message || defaultMessage,
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      ErrorSeverity.HIGH
    );
  } else {
    sendErrorResponse(
      res,
      defaultMessage,
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      ErrorSeverity.HIGH
    );
  }
}

/**
 * Async wrapper for route handlers with automatic error handling
 */
export function asyncHandler(
  handler: (req: any, res: Response, next?: any) => Promise<void>
) {
  return async (req: any, res: Response, next?: any) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleAsyncError(error, res, 'Request failed');
    }
  };
}

/**
 * Validates required fields and returns validation errors
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD_MISSING',
        value: data[field]
      });
    }
  }
  
  return errors;
}

/**
 * Standard response messages
 */
export const ResponseMessages = {
  // Success messages
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',
  
  // Error messages
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  CONFLICT: 'Resource conflict',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
} as const;