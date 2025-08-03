/**
 * API Request/Response validation schemas using Zod
 * 
 * Provides comprehensive validation for all API endpoints to ensure data integrity,
 * security, and consistent error handling across the application.
 */

import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { sendErrorResponse, HttpStatus, ErrorSeverity, type ValidationError } from './api-response';

/**
 * XSS prevention utility function
 * Allows historical data patterns while blocking actual security threats
 */
function preventXSS(input: string): boolean {
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\x00/,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /data:.*base64/i
  ];
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Base object schema for family member data validation - simplified and security-focused
 */
const BaseFamilyMemberSchema = z.object({
  externalId: z.string().min(1, 'External ID is required').max(50, 'External ID must be less than 50 characters').regex(/^[0-9]+(\.[0-9]+)*$/, 'External ID must follow hierarchical format'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters').refine(preventXSS, 'Name contains invalid content'),
  born: z.number().int().min(1000).max(3000).optional().nullable(),
  died: z.number().int().min(1000).max(3000).optional().nullable(),
  biologicalSex: z.enum(['Male', 'Female', 'Unknown']).default('Unknown'),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').refine(preventXSS, 'Notes contain invalid content').optional().nullable(),
  father: z.string().max(200, 'Father field must be less than 200 characters').refine(preventXSS, 'Father field contains invalid content').optional().nullable(),
  ageAtDeath: z.number().int().min(0).max(150).optional().nullable(),
  diedYoung: z.boolean().default(false),
  isSuccessionSon: z.boolean().default(false),
  hasMaleChildren: z.boolean().default(false),
  nobleBranch: z.string().max(100, 'Noble branch must be less than 100 characters').optional().nullable(),
  monarchDuringLife: z.array(z.string().min(1).max(150).refine(preventXSS, 'Monarch name contains invalid content')).default([]),
});

/**
 * Full schema with business rule validation
 */
export const FamilyMemberSchema = BaseFamilyMemberSchema.refine((data) => {
  // Validate birth/death date logic
  if (data.born && data.died && data.born > data.died) {
    return false;
  }
  return true;
}, {
  message: 'Birth year cannot be later than death year',
  path: ['died']
});

/**
 * Schema for creating new family members
 */
export const CreateFamilyMemberSchema = BaseFamilyMemberSchema.refine((data) => {
  // Validate birth/death date logic
  if (data.born && data.died && data.born > data.died) {
    return false;
  }
  return true;
}, {
  message: 'Birth year cannot be later than death year',
  path: ['died']
});

/**
 * Schema for updating existing family members (all fields optional)
 */
export const UpdateFamilyMemberSchema = BaseFamilyMemberSchema.partial().refine((data) => {
  // Validate birth/death date logic if both are provided
  if (data.born && data.died && data.born > data.died) {
    return false;
  }
  return true;
}, {
  message: 'Birth year cannot be later than death year',
  path: ['died']
});

/**
 * Schema for search queries
 */
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters')
});

/**
 * Schema for bulk operations
 */
export const BulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete']),
  members: z.array(FamilyMemberSchema).min(1, 'At least one member is required').max(100, 'Maximum 100 members per bulk operation')
});

/**
 * Schema for JSON backup restore
 */
export const RestoreSchema = z.array(FamilyMemberSchema).min(1, 'Backup must contain at least one family member').max(1000, 'Backup cannot exceed 1000 members');

/**
 * Schema for pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).optional()
}).refine((data) => {
  // Validate transformed numbers
  if (data.page !== undefined && data.page < 1) return false;
  if (data.limit !== undefined && (data.limit < 1 || data.limit > 100)) return false;
  return true;
}, {
  message: 'Page must be >= 1 and limit must be between 1 and 100'
});

/**
 * Schema for member ID parameters
 */
export const MemberIdSchema = z.object({
  id: z.string().min(1, 'Member ID is required')
});

/**
 * Converts Zod validation errors to API ValidationError format
 */
function zodErrorsToValidationErrors(zodError: z.ZodError): ValidationError[] {
  return zodError.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code.toUpperCase(),
    value: error.path.length > 0 ? error : undefined
  }));
}

/**
 * Generic validation middleware factory
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const validationErrors = zodErrorsToValidationErrors(result.error);
        return sendErrorResponse(
          res,
          'Validation failed',
          HttpStatus.BAD_REQUEST,
          validationErrors,
          ErrorSeverity.LOW
        );
      }
      
      // Replace the request data with validated and transformed data
      req[source] = result.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      return sendErrorResponse(
        res,
        'Internal validation error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        undefined,
        ErrorSeverity.HIGH
      );
    }
  };
}

/**
 * Specific validation middleware for common use cases
 */
export const validateFamilyMember = validateSchema(FamilyMemberSchema, 'body');
export const validateCreateFamilyMember = validateSchema(CreateFamilyMemberSchema, 'body');
export const validateUpdateFamilyMember = validateSchema(UpdateFamilyMemberSchema, 'body');
export const validateMemberId = validateSchema(MemberIdSchema, 'params');
export const validateSearchQuery = validateSchema(SearchQuerySchema, 'params');
export const validateBulkOperation = validateSchema(BulkOperationSchema, 'body');
export const validateRestore = validateSchema(RestoreSchema, 'body');

// Custom pagination validator to handle string->number transformation
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = PaginationSchema.safeParse(req.query);
    
    if (!result.success) {
      const validationErrors = zodErrorsToValidationErrors(result.error);
      return sendErrorResponse(
        res,
        'Validation failed',
        HttpStatus.BAD_REQUEST,
        validationErrors,
        ErrorSeverity.LOW
      );
    }
    
    req.query = result.data as any;
    next();
  } catch (error) {
    console.error('Pagination validation error:', error);
    return sendErrorResponse(
      res,
      'Internal validation error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      undefined,
      ErrorSeverity.HIGH
    );
  }
};

/**
 * Validation helper for manual validation within route handlers
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }
  
  return {
    success: false,
    errors: zodErrorsToValidationErrors(result.error)
  };
}

/**
 * Custom validation rules for business logic
 */
export const BusinessRules = {
  /**
   * Validates that a family member's father exists in the provided member list
   */
  validateFatherExists: (member: z.infer<typeof FamilyMemberSchema>, existingMembers: z.infer<typeof FamilyMemberSchema>[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (member.father) {
      // Check if father exists by externalId or name (support both formats)
      const fatherExists = existingMembers.some(m => 
        m.externalId === member.father || m.name === member.father
      );
      if (!fatherExists) {
        errors.push({
          field: 'father',
          message: `Father '${member.father}' does not exist in the family tree`,
          code: 'FATHER_NOT_FOUND',
          value: member.father
        });
      }
    }
    
    return errors;
  },

  /**
   * Validates that external ID follows the correct hierarchical format
   */
  validateExternalIdFormat: (externalId: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // External ID should be either "0" (root) or follow pattern like "0.1", "1.2.3", etc.
    const pattern = /^[0-9]+(\.[0-9]+)*$/;
    if (!pattern.test(externalId)) {
      errors.push({
        field: 'externalId',
        message: `External ID '${externalId}' is not in the correct format. Must follow hierarchical format like "0", "0.1", or "1.2.3"`,
        code: 'INVALID_EXTERNAL_ID_FORMAT',
        value: externalId
      });
    }
    
    return errors;
  },

  /**
   * Validates that the age at death matches birth/death years
   */
  validateAgeAtDeath: (member: z.infer<typeof FamilyMemberSchema>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (member.born && member.died && member.ageAtDeath) {
      const calculatedAge = member.died - member.born;
      // Allow 1 year tolerance for birthday timing
      if (Math.abs(calculatedAge - member.ageAtDeath) > 1) {
        errors.push({
          field: 'ageAtDeath',
          message: `Age at death (${member.ageAtDeath}) does not match calculated age from birth/death years (${calculatedAge})`,
          code: 'AGE_MISMATCH',
          value: member.ageAtDeath
        });
      }
    }
    
    return errors;
  }
};

/**
 * Response schemas for API documentation and validation
 */
export const ApiResponseSchemas = {
  FamilyMember: z.object({
    success: z.boolean(),
    data: FamilyMemberSchema,
    message: z.string().optional(),
    timestamp: z.string()
  }),

  FamilyMemberList: z.object({
    success: z.boolean(),
    data: z.array(FamilyMemberSchema),
    message: z.string().optional(),
    timestamp: z.string()
  }),

  Error: z.object({
    success: z.literal(false),
    error: z.string(),
    errors: z.array(z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
      value: z.unknown().optional()
    })).optional(),
    timestamp: z.string()
  })
};