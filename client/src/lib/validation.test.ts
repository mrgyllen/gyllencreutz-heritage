/**
 * Unit tests for input validation schemas and utilities
 * 
 * Tests comprehensive input validation for family member data,
 * search queries, and administrative operations.
 */

import { describe, it, expect } from 'vitest';
import {
  externalIdSchema,
  nameSchema,
  yearSchema,
  biologicalSexSchema,
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  searchQuerySchema,
  validateInput,
  safeValidateInput,
  createValidator,
} from './validation';
import { ValidationError } from '@/lib/errors';

describe('externalIdSchema', () => {
  it('should accept valid dot notation IDs', () => {
    expect(() => externalIdSchema.parse('0')).not.toThrow();
    expect(() => externalIdSchema.parse('0.1')).not.toThrow();
    expect(() => externalIdSchema.parse('1.2.3')).not.toThrow();
    expect(() => externalIdSchema.parse('12.34.56')).not.toThrow();
  });

  it('should reject invalid external IDs', () => {
    expect(() => externalIdSchema.parse('')).toThrow();
    expect(() => externalIdSchema.parse('abc')).toThrow();
    expect(() => externalIdSchema.parse('1.2.a')).toThrow();
    expect(() => externalIdSchema.parse('1..2')).toThrow();
    expect(() => externalIdSchema.parse('.1')).toThrow();
    expect(() => externalIdSchema.parse('1.')).toThrow();
  });

  it('should reject IDs that are too long', () => {
    const longId = '1'.repeat(60);
    expect(() => externalIdSchema.parse(longId)).toThrow();
  });
});

describe('nameSchema', () => {
  it('should accept valid Swedish names', () => {
    expect(() => nameSchema.parse('Lars Tygesson')).not.toThrow();
    expect(() => nameSchema.parse('Erik Larsson Gyllencreutz')).not.toThrow();
    expect(() => nameSchema.parse('Anna-Maria Ström')).not.toThrow();
    expect(() => nameSchema.parse("O'Connell")).not.toThrow();
    expect(() => nameSchema.parse('St. Erik')).not.toThrow();
  });

  it('should accept Swedish characters', () => {
    expect(() => nameSchema.parse('Åke Öberg')).not.toThrow();
    expect(() => nameSchema.parse('Göran Ärlebäck')).not.toThrow();
  });

  it('should reject invalid names', () => {
    expect(() => nameSchema.parse('')).toThrow();
    expect(() => nameSchema.parse('A')).toThrow(); // Too short
    expect(() => nameSchema.parse('Name123')).toThrow(); // Numbers
    expect(() => nameSchema.parse('Name@Email')).toThrow(); // Special chars
  });

  it('should reject names that are too long', () => {
    const longName = 'A'.repeat(101);
    expect(() => nameSchema.parse(longName)).toThrow();
  });
});

describe('yearSchema', () => {
  const currentYear = new Date().getFullYear();

  it('should accept valid historical years', () => {
    expect(() => yearSchema.parse(1515)).not.toThrow();
    expect(() => yearSchema.parse(1900)).not.toThrow();
    expect(() => yearSchema.parse(currentYear)).not.toThrow();
    expect(() => yearSchema.parse(null)).not.toThrow();
  });

  it('should reject invalid years', () => {
    expect(() => yearSchema.parse(999)).toThrow(); // Too early
    expect(() => yearSchema.parse(currentYear + 1)).toThrow(); // Future
    expect(() => yearSchema.parse(1515.5)).toThrow(); // Not integer
  });
});

describe('biologicalSexSchema', () => {
  it('should accept valid biological sex values', () => {
    expect(() => biologicalSexSchema.parse('Male')).not.toThrow();
    expect(() => biologicalSexSchema.parse('Female')).not.toThrow();
    expect(() => biologicalSexSchema.parse('Unknown')).not.toThrow();
  });

  it('should reject invalid biological sex values', () => {
    expect(() => biologicalSexSchema.parse('male')).toThrow(); // Wrong case
    expect(() => biologicalSexSchema.parse('Other')).toThrow();
    expect(() => biologicalSexSchema.parse('')).toThrow();
    expect(() => biologicalSexSchema.parse(null)).toThrow();
  });
});

describe('createFamilyMemberSchema', () => {
  const validMember = {
    externalId: '0',
    name: 'Lars Tygesson',
    born: 1515,
    died: 1560,
    biologicalSex: 'Male',
    notes: 'Founder of the family',
    father: null,
    ageAtDeath: 45,
    diedYoung: false,
    isSuccessionSon: true,
    hasMaleChildren: true,
    nobleBranch: null,
    monarchDuringLife: ['Gustav Vasa'],
  };

  it('should accept valid family member data', () => {
    expect(() => createFamilyMemberSchema.parse(validMember)).not.toThrow();
  });

  it('should apply default values for optional fields', () => {
    const minimalMember = {
      externalId: '0',
      name: 'Test Person',
      born: 1500,
      died: 1550,
      biologicalSex: 'Male',
    };

    const parsed = createFamilyMemberSchema.parse(minimalMember);
    expect(parsed.diedYoung).toBe(false);
    expect(parsed.isSuccessionSon).toBe(false);
    expect(parsed.hasMaleChildren).toBe(false);
    expect(parsed.monarchDuringLife).toEqual([]);
  });

  it('should validate death year is after birth year', () => {
    const invalidMember = {
      ...validMember,
      born: 1560,
      died: 1515, // Before birth
    };

    expect(() => createFamilyMemberSchema.parse(invalidMember)).toThrow();
  });

  it('should validate age at death calculation', () => {
    const invalidAgeMember = {
      ...validMember,
      born: 1515,
      died: 1560,
      ageAtDeath: 100, // Should be ~45
    };

    expect(() => createFamilyMemberSchema.parse(invalidAgeMember)).toThrow();
  });

  it('should validate diedYoung flag consistency', () => {
    const invalidDiedYoungMember = {
      ...validMember,
      ageAtDeath: 50,
      diedYoung: true, // Inconsistent with age
    };

    expect(() => createFamilyMemberSchema.parse(invalidDiedYoungMember)).toThrow();
  });

  it('should allow null values for optional fields', () => {
    const memberWithNulls = {
      ...validMember,
      born: null,
      died: null,
      notes: null,
      father: null,
      ageAtDeath: null,
    };

    expect(() => createFamilyMemberSchema.parse(memberWithNulls)).not.toThrow();
  });
});

describe('updateFamilyMemberSchema', () => {
  it('should accept partial updates', () => {
    const partialUpdate = {
      name: 'Updated Name',
      notes: 'Updated notes',
    };

    expect(() => updateFamilyMemberSchema.parse(partialUpdate)).not.toThrow();
  });

  it('should accept empty updates', () => {
    expect(() => updateFamilyMemberSchema.parse({})).not.toThrow();
  });

  it('should still validate provided fields', () => {
    const invalidUpdate = {
      born: 'not a number',
    };

    expect(() => updateFamilyMemberSchema.parse(invalidUpdate)).toThrow();
  });
});

describe('searchQuerySchema', () => {
  it('should accept valid search queries', () => {
    const validQuery = {
      query: 'Lars Tygesson',
      limit: 10,
      offset: 0,
    };

    expect(() => searchQuerySchema.parse(validQuery)).not.toThrow();
  });

  it('should apply default values', () => {
    const parsed = searchQuerySchema.parse({ query: 'test' });
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(0);
  });

  it('should reject invalid search queries', () => {
    expect(() => searchQuerySchema.parse({ query: '' })).toThrow();
    expect(() => searchQuerySchema.parse({ query: 'test@email.com' })).toThrow();
    expect(() => searchQuerySchema.parse({ query: 'a'.repeat(101) })).toThrow();
  });

  it('should validate limit and offset ranges', () => {
    expect(() => searchQuerySchema.parse({ query: 'test', limit: 0 })).toThrow();
    expect(() => searchQuerySchema.parse({ query: 'test', limit: 101 })).toThrow();
    expect(() => searchQuerySchema.parse({ query: 'test', offset: -1 })).toThrow();
  });
});

describe('validateInput', () => {
  it('should return parsed data for valid input', () => {
    const result = validateInput(nameSchema, 'Lars Tygesson');
    expect(result).toBe('Lars Tygesson');
  });

  it('should throw ValidationError for invalid input', () => {
    expect(() => validateInput(nameSchema, '')).toThrow(ValidationError);
  });

  it('should include context in error message', () => {
    try {
      validateInput(nameSchema, '', 'test context');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('test context');
    }
  });

  it('should include field path in error', () => {
    try {
      validateInput(createFamilyMemberSchema, {
        externalId: 'invalid',
        name: '',
        biologicalSex: 'Male',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBeDefined();
    }
  });
});

describe('safeValidateInput', () => {
  it('should return success result for valid input', () => {
    const result = safeValidateInput(nameSchema, 'Lars Tygesson');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('Lars Tygesson');
    }
  });

  it('should return error result for invalid input', () => {
    const result = safeValidateInput(nameSchema, '');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });

  it('should handle non-Zod errors gracefully', () => {
    const throwingSchema = {
      parse: () => {
        throw new Error('Custom error');
      },
    } as any;

    const result = safeValidateInput(throwingSchema, 'test');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });
});

describe('createValidator', () => {
  it('should create a validator function', () => {
    const validateName = createValidator(nameSchema, 'name');
    
    expect(typeof validateName).toBe('function');
    expect(validateName('Lars Tygesson')).toBe('Lars Tygesson');
    expect(() => validateName('')).toThrow(ValidationError);
  });

  it('should include context in created validator', () => {
    const validateName = createValidator(nameSchema, 'person name');
    
    try {
      validateName('');
    } catch (error) {
      expect((error as ValidationError).message).toContain('person name');
    }
  });
});