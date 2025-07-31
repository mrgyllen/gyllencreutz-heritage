/**
 * Comprehensive tests for API validation system
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  FamilyMemberSchema,
  CreateFamilyMemberSchema,
  UpdateFamilyMemberSchema,
  SearchQuerySchema,
  RestoreSchema,
  PaginationSchema,
  MemberIdSchema,
  BusinessRules,
  validateData
} from '../../../../server/lib/validation';

describe('FamilyMemberSchema', () => {
  const validMember = {
    externalId: '0.1',
    name: 'Lars Tygesson',
    born: 1515,
    died: 1580,
    biologicalSex: 'Male' as const,
    notes: 'Founder of the Gyllencreutz family',
    father: 'Tyge Larsson',
    ageAtDeath: 65,
    diedYoung: false,
    isSuccessionSon: true,
    hasMaleChildren: true,
    nobleBranch: 'Main branch',
    monarchDuringLife: ['Gustav Vasa', 'Erik XIV']
  };

  it('should validate a complete valid family member', () => {
    const result = FamilyMemberSchema.safeParse(validMember);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Lars Tygesson');
      expect(result.data.biologicalSex).toBe('Male');
    }
  });

  it('should set default values for optional fields', () => {
    const minimalMember = {
      externalId: '0',
      name: 'Test Person'
    };
    
    const result = FamilyMemberSchema.safeParse(minimalMember);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.biologicalSex).toBe('Unknown');
      expect(result.data.diedYoung).toBe(false);
      expect(result.data.isSuccessionSon).toBe(false);
      expect(result.data.hasMaleChildren).toBe(false);
      expect(result.data.monarchDuringLife).toEqual([]);
    }
  });

  it('should reject empty or invalid required fields', () => {
    const invalidMember = {
      externalId: '',
      name: ''
    };
    
    const result = FamilyMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toHaveLength(2);
      expect(result.error.errors[0].message).toContain('External ID is required');
      expect(result.error.errors[1].message).toContain('Name is required');
    }
  });

  it('should reject invalid biological sex values', () => {
    const invalidMember = {
      externalId: '0',
      name: 'Test Person',
      biologicalSex: 'Invalid'
    };
    
    const result = FamilyMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
  });

  it('should validate year ranges for birth and death', () => {
    const invalidMember = {
      externalId: '0',
      name: 'Test Person',
      born: 999,
      died: 3001
    };
    
    const result = FamilyMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.errors;
      expect(errors.some(e => e.path.includes('born'))).toBe(true);
      expect(errors.some(e => e.path.includes('died'))).toBe(true);
    }
  });

  it('should reject birth year later than death year', () => {
    const invalidMember = {
      externalId: '0',
      name: 'Test Person',
      born: 1600,
      died: 1550
    };
    
    const result = FamilyMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Birth year cannot be later than death year');
    }
  });

  it('should validate string length limits', () => {
    const invalidMember = {
      externalId: '0',
      name: 'A'.repeat(201), // Too long
      notes: 'B'.repeat(2001), // Too long
      father: 'C'.repeat(201), // Too long
      nobleBranch: 'D'.repeat(101) // Too long
    };
    
    const result = FamilyMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors).toHaveLength(4);
    }
  });

  it('should validate age at death range', () => {
    const invalidMember = {
      externalId: '0',
      name: 'Test Person',
      ageAtDeath: -1
    };
    
    const result = FamilyMemberSchema.safeParse(invalidMember);
    expect(result.success).toBe(false);
    
    const invalidMember2 = {
      externalId: '0',
      name: 'Test Person',
      ageAtDeath: 151
    };
    
    const result2 = FamilyMemberSchema.safeParse(invalidMember2);
    expect(result2.success).toBe(false);
  });
});

describe('CreateFamilyMemberSchema', () => {
  it('should require externalId for creation', () => {
    const memberWithoutId = {
      name: 'Test Person'
    };
    
    const result = CreateFamilyMemberSchema.safeParse(memberWithoutId);
    expect(result.success).toBe(false);
  });

  it('should validate complete member data for creation', () => {
    const validMember = {
      externalId: '1.2.3',
      name: 'Erik Larsson',
      born: 1600,
      died: 1665,
      biologicalSex: 'Male' as const,
      father: 'Lars Eriksson'
    };
    
    const result = CreateFamilyMemberSchema.safeParse(validMember);
    expect(result.success).toBe(true);
  });
});

describe('UpdateFamilyMemberSchema', () => {
  it('should allow partial updates', () => {
    const partialUpdate = {
      name: 'Updated Name',
      notes: 'Updated notes'
    };
    
    const result = UpdateFamilyMemberSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('should still validate field constraints for provided fields', () => {
    const invalidUpdate = {
      name: '', // Empty name not allowed
      born: 999 // Invalid year
    };
    
    const result = UpdateFamilyMemberSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe('SearchQuerySchema', () => {
  it('should validate search queries', () => {
    const validQuery = { query: 'Lars' };
    const result = SearchQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
  });

  it('should reject empty queries', () => {
    const invalidQuery = { query: '' };
    const result = SearchQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('should reject overly long queries', () => {
    const invalidQuery = { query: 'A'.repeat(101) };
    const result = SearchQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });
});

describe('RestoreSchema', () => {
  it('should validate array of family members', () => {
    const validRestore = [
      {
        externalId: '0',
        name: 'Lars Tygesson',
        born: 1515,
        died: 1580,
        biologicalSex: 'Male' as const
      },
      {
        externalId: '0.1',
        name: 'Erik Larsson',
        born: 1540,
        died: 1605,
        biologicalSex: 'Male' as const
      }
    ];
    
    const result = RestoreSchema.safeParse(validRestore);
    expect(result.success).toBe(true);
  });

  it('should reject empty arrays', () => {
    const result = RestoreSchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it('should reject overly large datasets', () => {
    const largeDataset = Array(1001).fill({
      externalId: '0',
      name: 'Test Person',
      biologicalSex: 'Unknown'
    });
    
    const result = RestoreSchema.safeParse(largeDataset);
    expect(result.success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('should validate numeric string parameters', () => {
    const validPagination = { page: '1', limit: '10' };
    const result = PaginationSchema.safeParse(validPagination);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should reject non-numeric parameters', () => {
    const invalidPagination = { page: 'abc', limit: 'xyz' };
    const result = PaginationSchema.safeParse(invalidPagination);
    expect(result.success).toBe(false);
  });

  it('should enforce minimum and maximum values', () => {
    const invalidPagination = { page: '0', limit: '101' };
    const result = PaginationSchema.safeParse(invalidPagination);
    expect(result.success).toBe(false);
  });
});

describe('MemberIdSchema', () => {
  it('should validate member ID parameter', () => {
    const validId = { id: 'member-123' };
    const result = MemberIdSchema.safeParse(validId);
    expect(result.success).toBe(true);
  });

  it('should reject empty IDs', () => {
    const invalidId = { id: '' };
    const result = MemberIdSchema.safeParse(invalidId);
    expect(result.success).toBe(false);
  });
});

describe('BusinessRules', () => {
  const sampleMembers = [
    {
      externalId: '0',
      name: 'Lars Tygesson',
      born: 1515,
      died: 1580,
      biologicalSex: 'Male' as const,
      ageAtDeath: 65,
      diedYoung: false,
      isSuccessionSon: true,
      hasMaleChildren: true,
      nobleBranch: 'Main branch',
      monarchDuringLife: []
    },
    {
      externalId: '0.1',
      name: 'Erik Larsson',
      born: 1540,
      died: 1605,
      biologicalSex: 'Male' as const,
      father: 'Lars Tygesson',
      ageAtDeath: 65,
      diedYoung: false,
      isSuccessionSon: false,
      hasMaleChildren: true,
      nobleBranch: 'Elder line',
      monarchDuringLife: []
    }
  ];

  describe('validateFatherExists', () => {
    it('should pass when father exists in member list', () => {
      const member = {
        externalId: '0.2',
        name: 'Test Person',
        father: 'Lars Tygesson',
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateFatherExists(member, sampleMembers);
      expect(errors).toHaveLength(0);
    });

    it('should fail when father does not exist', () => {
      const member = {
        externalId: '0.2',
        name: 'Test Person',
        father: 'Nonexistent Father',
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateFatherExists(member, sampleMembers);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('father');
      expect(errors[0].code).toBe('FATHER_NOT_FOUND');
    });

    it('should pass when no father is specified', () => {
      const member = {
        externalId: '0',
        name: 'Root Person',
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateFatherExists(member, sampleMembers);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateExternalIdFormat', () => {
    it('should validate correct formats', () => {
      const validIds = ['0', '0.1', '1.2.3', '10.20.30'];
      
      validIds.forEach(id => {
        const errors = BusinessRules.validateExternalIdFormat(id);
        expect(errors).toHaveLength(0);
      });
    });

    it('should reject invalid formats', () => {
      const invalidIds = ['', 'abc', '0.', '.1', '0..1', '0.1.', 'a.b'];
      
      invalidIds.forEach(id => {
        const errors = BusinessRules.validateExternalIdFormat(id);
        expect(errors).toHaveLength(1);
        expect(errors[0].code).toBe('INVALID_EXTERNAL_ID_FORMAT');
      });
    });
  });

  describe('validateAgeAtDeath', () => {
    it('should pass when age matches calculated age', () => {
      const member = {
        externalId: '0',
        name: 'Test Person',
        born: 1515,
        died: 1580,
        ageAtDeath: 65,
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateAgeAtDeath(member);
      expect(errors).toHaveLength(0);
    });

    it('should allow 1 year tolerance', () => {
      const member = {
        externalId: '0',
        name: 'Test Person',
        born: 1515,
        died: 1580,
        ageAtDeath: 64, // Off by 1 year (65 calculated)
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateAgeAtDeath(member);
      expect(errors).toHaveLength(0);
    });

    it('should fail when age differs by more than 1 year', () => {
      const member = {
        externalId: '0',
        name: 'Test Person',
        born: 1515,
        died: 1580,
        ageAtDeath: 70, // Off by 5 years (65 calculated)
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateAgeAtDeath(member);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('AGE_MISMATCH');
    });

    it('should pass when age at death is not specified', () => {
      const member = {
        externalId: '0',
        name: 'Test Person',
        born: 1515,
        died: 1580,
        biologicalSex: 'Male' as const,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        monarchDuringLife: []
      };
      
      const errors = BusinessRules.validateAgeAtDeath(member);
      expect(errors).toHaveLength(0);
    });
  });
});

describe('validateData helper', () => {
  it('should return success for valid data', () => {
    const validMember = {
      externalId: '0',
      name: 'Test Person'
    };
    
    const result = validateData(FamilyMemberSchema, validMember);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid data', () => {
    const invalidMember = {
      externalId: '',
      name: ''
    };
    
    const result = validateData(FamilyMemberSchema, invalidMember);
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});