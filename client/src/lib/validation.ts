/**
 * Comprehensive input validation schemas using Zod
 * 
 * Provides consistent validation for family member data, search queries,
 * and administrative operations with detailed error messages.
 */

import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

// Re-export ValidationError for convenience
export { ValidationError };

/**
 * Schema for validating family member external IDs
 * Supports hierarchical dot notation (e.g., "0", "0.1", "1.2.3")
 */
export const externalIdSchema = z
  .string()
  .min(1, 'External ID is required')
  .max(50, 'External ID must be 50 characters or less')
  .regex(
    /^[0-9]+(\.[0-9]+)*$/,
    'External ID must follow dot notation format (e.g., "0", "0.1", "1.2.3")'
  );

/**
 * Schema for validating person names
 * Supports Swedish noble naming conventions
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name must be 100 characters or less')
  .regex(
    /^[a-zA-ZåäöÅÄÖ\s\-'\.]+$/,
    'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
  );

/**
 * Schema for validating birth/death years
 * Supports reasonable historical range for Swedish nobility
 */
export const yearSchema = z
  .number()
  .int('Year must be a whole number')
  .min(1000, 'Year must be 1000 or later')
  .max(new Date().getFullYear(), `Year cannot be in the future`)
  .nullable();

/**
 * Schema for validating biological sex
 */
export const biologicalSexSchema = z.enum(['Male', 'Female', 'Unknown'], {
  errorMap: () => ({ message: 'Biological sex must be Male, Female, or Unknown' }),
});

/**
 * Schema for validating noble branch designations
 */
export const nobleBranchSchema = z
  .enum(['Elder line', 'Younger line'])
  .nullable()
  .optional();

/**
 * Schema for validating biographical notes
 */
export const notesSchema = z
  .string()
  .max(2000, 'Notes must be 2000 characters or less')
  .nullable()
  .optional();

/**
 * Schema for validating monarch names during lifetime
 */
export const monarchSchema = z
  .string()
  .min(2, 'Monarch name must be at least 2 characters')
  .max(50, 'Monarch name must be 50 characters or less')
  .regex(
    /^[a-zA-ZåäöÅÄÖ\s\-'\.0-9]+$/,
    'Monarch name contains invalid characters'
  );

export const monarchArraySchema = z.array(monarchSchema).optional();

/**
 * Base schema for family member data without refinements
 */
const baseFamilyMemberSchema = z.object({
  externalId: externalIdSchema,
  name: nameSchema,
  born: yearSchema,
  died: yearSchema,
  biologicalSex: biologicalSexSchema,
  notes: notesSchema,
  father: nameSchema.nullable().optional(),
  ageAtDeath: z.number().int().min(0).max(150).nullable().optional(),
  diedYoung: z.boolean().optional().default(false),
  isSuccessionSon: z.boolean().optional().default(false),
  hasMaleChildren: z.boolean().optional().default(false),
  nobleBranch: nobleBranchSchema,
  monarchDuringLife: monarchArraySchema.default([]),
});

/**
 * Complete schema for creating a new family member with validation refinements
 */
export const createFamilyMemberSchema = baseFamilyMemberSchema
.refine((data) => {
  // Validate that died year is after born year
  if (data.born && data.died && data.died <= data.born) {
    return false;
  }
  return true;
}, {
  message: 'Death year must be after birth year',
  path: ['died'],
})
.refine((data) => {
  // Validate age at death calculation
  if (data.born && data.died && data.ageAtDeath) {
    const calculatedAge = data.died - data.born;
    if (Math.abs(calculatedAge - data.ageAtDeath) > 1) {
      return false;
    }
  }
  return true;
}, {
  message: 'Age at death does not match birth and death years',
  path: ['ageAtDeath'],
})
.refine((data) => {
  // Validate diedYoung flag
  if (data.diedYoung && data.ageAtDeath && data.ageAtDeath > 18) {
    return false;
  }
  return true;
}, {
  message: 'Members who died young should be 18 years old or younger',
  path: ['diedYoung'],
});

/**
 * Schema for updating an existing family member
 * All fields are optional for partial updates
 */
export const updateFamilyMemberSchema = baseFamilyMemberSchema.partial();

/**
 * Schema for Cosmos DB family member (includes database-specific fields)
 */
export const cosmosFamilyMemberSchema = baseFamilyMemberSchema.extend({
  id: z.string().min(1, 'Cosmos DB ID is required'),
  importedAt: z.string().datetime().optional(),
  importSource: z.string().optional(),
  _rid: z.string().optional(),
  _self: z.string().optional(),
  _etag: z.string().optional(),
  _attachments: z.string().optional(),
  _ts: z.number().optional(),
});

/**
 * Schema for search queries
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query must be at least 1 character')
    .max(100, 'Search query must be 100 characters or less')
    .regex(
      /^[a-zA-ZåäöÅÄÖ0-9\s\-'\.]+$/,
      'Search query contains invalid characters'
    ),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

/**
 * Schema for bulk operations
 */
export const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete'], {
    errorMap: () => ({ message: 'Operation must be create, update, or delete' }),
  }),
  members: z.array(createFamilyMemberSchema).min(1, 'At least one member is required'),
});

/**
 * Schema for file upload validation
 */
export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    type: z.string().refine(
      (type) => type === 'application/json',
      'File must be a JSON file'
    ),
  }),
  data: z.array(z.record(z.unknown())).min(1, 'File must contain at least one record'),
});

/**
 * Schema for GitHub sync configuration
 */
export const githubConfigSchema = z.object({
  token: z.string().min(1, 'GitHub token is required'),
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  branch: z.string().min(1, 'Branch name is required').default('main'),
});

/**
 * Schema for import/export operations
 */
export const importExportSchema = z.object({
  format: z.enum(['json', 'csv'], {
    errorMap: () => ({ message: 'Format must be json or csv' }),
  }),
  includeMetadata: z.boolean().optional().default(false),
  dateRange: z.object({
    startYear: yearSchema,
    endYear: yearSchema,
  }).optional(),
  branchFilter: z.enum(['all', 'main', 'elder', 'younger']).optional().default('all'),
});

// Type exports for use in components
export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
export type CosmosDbFamilyMemberInput = z.infer<typeof cosmosFamilyMemberSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type GitHubConfigInput = z.infer<typeof githubConfigSchema>;
export type ImportExportInput = z.infer<typeof importExportSchema>;

/**
 * Validates input data against a Zod schema and throws ValidationError on failure
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Additional context for error reporting
 * @returns Validated and parsed data
 * @throws ValidationError if validation fails
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('; ');
      
      throw new ValidationError(
        `Validation failed${context ? ` for ${context}` : ''}: ${errorMessage}`,
        error.errors[0]?.path.join('.'),
        { zodErrors: error.errors }
      );
    }
    throw error;
  }
}

/**
 * Safely validates input and returns either success or error result
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and either data or error
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validatedData = validateInput(schema, data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error };
    }
    return { 
      success: false, 
      error: new ValidationError('Unexpected validation error') 
    };
  }
}

/**
 * Creates a validation function for a specific schema
 * 
 * @param schema - Zod schema to create validator for
 * @param context - Context name for error messages
 * @returns Validation function
 */
export function createValidator<T>(
  schema: z.ZodSchema<T>,
  context?: string
) {
  return (data: unknown): T => validateInput(schema, data, context);
}

// Pre-created validators for common use cases
export const validateFamilyMember = createValidator(createFamilyMemberSchema, 'family member');
export const validateFamilyMemberUpdate = createValidator(updateFamilyMemberSchema, 'family member update');
export const validateSearchQuery = createValidator(searchQuerySchema, 'search query');
export const validateBulkOperation = createValidator(bulkOperationSchema, 'bulk operation');
export const validateFileUpload = createValidator(fileUploadSchema, 'file upload');
export const validateGitHubConfig = createValidator(githubConfigSchema, 'GitHub configuration');
export const validateImportExport = createValidator(importExportSchema, 'import/export operation');