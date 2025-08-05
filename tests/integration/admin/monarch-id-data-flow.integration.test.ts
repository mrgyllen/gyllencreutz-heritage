/**
 * Integration test for monarch ID-based data flow
 * 
 * Tests the complete workflow:
 * 1. Data processing with monarch IDs as primary storage
 * 2. Auto-calculate functionality with proper UX
 * 3. Data migration utilities
 * 4. Validation with enhanced error reporting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  processFamilyMemberFormData,
  validateMonarchRelationships,
  calculateMonarchsForLifetime
} from '@/lib/admin-validation-utils';
import { 
  convertMonarchNamesToIds,
  migrateFamilyMember,
  generateMigrationReport,
  validateMonarchIds
} from '@/lib/data-migration-utils';
import { type Monarch, type CosmosDbFamilyMember } from '@/types/family';

// Mock monarch data similar to the Swedish monarchs
const mockMonarchs: Monarch[] = [
  {
    id: 'gustav-i-vasa',
    name: 'Gustav I Vasa',
    born: '1496-05-12',
    died: '1560-09-29',
    reignFrom: '1523-06-06',
    reignTo: '1560-09-29',
    about: 'First king of Sweden'
  },
  {
    id: 'erik-xiv',
    name: 'Erik XIV',
    born: '1533-12-13',
    died: '1577-02-26',
    reignFrom: '1560-09-29',
    reignTo: '1568-09-25',
    about: 'Son of Gustav Vasa'
  },
  {
    id: 'johan-iii',
    name: 'Johan III',
    born: '1537-12-20',
    died: '1592-11-17',
    reignFrom: '1568-09-25',
    reignTo: '1592-11-17',
    about: 'Duke of Finland'
  },
  {
    id: 'sigismund',
    name: 'Sigismund',
    born: '1566-06-20',
    died: '1632-04-30',
    reignFrom: '1592-11-17',
    reignTo: '1599-07-24',
    about: 'King of Poland and Sweden'
  },
  {
    id: 'karl-ix',
    name: 'Karl IX',
    born: '1550-10-04',
    died: '1611-10-30',
    reignFrom: '1599-07-24',
    reignTo: '1611-10-30',
    about: 'Duke Charles'
  },
  {
    id: 'gustav-ii-adolf',
    name: 'Gustav II Adolf',
    born: '1594-11-09',
    died: '1632-11-06',
    reignFrom: '1611-10-30',
    reignTo: '1632-11-06',
    about: 'The Lion of the North'
  }
];

// Mock family member data (like Tyge Larsson)
const mockFamilyMemberWithNames: CosmosDbFamilyMember = {
  id: '2',
  externalId: '0.1',
  name: 'Tyge Larsson (Gyllencreutz)',
  born: 1545,
  died: 1625,
  biologicalSex: 'Male',
  notes: 'Ennobled in Sweden',
  father: '0',
  ageAtDeath: 80,
  diedYoung: false,
  isSuccessionSon: true,
  hasMaleChildren: true,
  nobleBranch: null,
  monarchDuringLife: [
    'Gustav Vasa (1523–1560)',
    'Erik XIV (1560–1568)',
    'Johan III (1568–1592)',
    'Sigismund (1592–1599)',
    'Karl IX (1604–1611)',
    'Gustav II Adolf (1611–1632)'
  ],
  // No monarchIds yet - needs migration
  monarchIds: []
};

describe('Monarch ID-Based Data Flow Integration', () => {
  describe('Data Processing with Monarch IDs', () => {
    it('processes form data with monarch IDs as primary storage', () => {
      const formData = new FormData();
      formData.append('externalId', '0.1');
      formData.append('name', 'Test Member');
      formData.append('born', '1545');
      formData.append('died', '1625');
      formData.append('biologicalSex', 'Male');

      const mockMonarchIds = ['gustav-i-vasa', 'erik-xiv', 'johan-iii'];

      const result = processFamilyMemberFormData(
        formData,
        true, // isNew
        null, // editingMember
        mockMonarchIds,
        mockMonarchs
      );

      // Verify monarch IDs are primary
      expect(result.monarchIds).toEqual(mockMonarchIds);
      
      // Verify display names are generated from IDs
      expect(result.monarchDuringLife).toEqual([
        'Gustav I Vasa (1523–1560)',
        'Erik XIV (1560–1568)',
        'Johan III (1568–1592)'
      ]);
      
      // Verify basic member data
      expect(result.name).toBe('Test Member');
      expect(result.born).toBe(1545);
      expect(result.died).toBe(1625);
    });

    it('handles editing existing member with monarch IDs', () => {
      const formData = new FormData();
      formData.append('externalId', '0.1');
      formData.append('name', 'Existing Member');
      formData.append('born', '1545');
      formData.append('died', '1625');

      const existingMember = {
        id: '2',
        monarchIds: ['gustav-i-vasa', 'erik-xiv']
      };

      const result = processFamilyMemberFormData(
        formData,
        false, // isNew
        existingMember,
        [], // newMemberMonarchIds (not used for existing)
        mockMonarchs
      );

      expect(result.monarchIds).toEqual(['gustav-i-vasa', 'erik-xiv']);
      expect(result.monarchDuringLife).toEqual([
        'Gustav I Vasa (1523–1560)',
        'Erik XIV (1560–1568)'
      ]);
    });
  });

  describe('Auto-Calculate Functionality', () => {
    it('calculates correct monarchs for Tyge Larsson lifetime', () => {
      const bornYear = 1545;
      const diedYear = 1625;

      const calculatedIds = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);

      // Should find 6 monarchs that reigned during 1545-1625
      expect(calculatedIds).toHaveLength(6);
      expect(calculatedIds).toContain('gustav-i-vasa');
      expect(calculatedIds).toContain('erik-xiv');
      expect(calculatedIds).toContain('johan-iii');
      expect(calculatedIds).toContain('sigismund');
      expect(calculatedIds).toContain('karl-ix');
      expect(calculatedIds).toContain('gustav-ii-adolf');
    });

    it('handles edge cases in lifetime calculation', () => {
      // Member born same year monarch ends reign
      const calculatedIds = calculateMonarchsForLifetime(1560, 1580, mockMonarchs);
      
      expect(calculatedIds).toContain('gustav-i-vasa'); // ends 1560
      expect(calculatedIds).toContain('erik-xiv'); // starts 1560
      expect(calculatedIds).toContain('johan-iii'); // starts 1568
    });

    it('returns empty array for invalid birth year', () => {
      const result = calculateMonarchsForLifetime(null, 1625, mockMonarchs);
      expect(result).toEqual([]);
    });
  });

  describe('Data Migration Utilities', () => {
    it('converts monarch names to IDs correctly', () => {
      const monarchNames = [
        'Gustav Vasa (1523–1560)',
        'Erik XIV (1560–1568)',
        'Johan III (1568–1592)'
      ];

      const convertedIds = convertMonarchNamesToIds(monarchNames, mockMonarchs);

      expect(convertedIds).toEqual(['gustav-i-vasa', 'erik-xiv', 'johan-iii']);
    });

    it('migrates family member from names to IDs', () => {
      const migratedMember = migrateFamilyMember(mockFamilyMemberWithNames, mockMonarchs);

      expect(migratedMember.monarchIds).toHaveLength(6);
      expect(migratedMember.monarchIds).toContain('gustav-i-vasa');
      expect(migratedMember.monarchIds).toContain('gustav-ii-adolf');
      
      // Should preserve original member data
      expect(migratedMember.name).toBe('Tyge Larsson (Gyllencreutz)');
      expect(migratedMember.born).toBe(1545);
      expect(migratedMember.died).toBe(1625);
    });

    it('generates comprehensive migration report', () => {
      const familyMembers = [
        mockFamilyMemberWithNames,
        {
          ...mockFamilyMemberWithNames,
          id: '3',
          name: 'Already Migrated',
          monarchIds: ['gustav-i-vasa'],
          monarchDuringLife: []
        }
      ];

      const report = generateMigrationReport(familyMembers, mockMonarchs);

      expect(report.totalMembers).toBe(2);
      expect(report.membersNeedingMigration).toBe(1);
      expect(report.membersAlreadyMigrated).toBe(1);
      expect(report.migrationDetails[0].memberName).toBe('Tyge Larsson (Gyllencreutz)');
      expect(report.migrationDetails[0].resolvedMonarchIds).toHaveLength(6);
    });

    it('validates monarch ID references', () => {
      const familyMembers = [
        {
          ...mockFamilyMemberWithNames,
          monarchIds: ['gustav-i-vasa', 'invalid-id', 'erik-xiv']
        }
      ];

      const validation = validateMonarchIds(familyMembers, mockMonarchs);

      expect(validation.isValid).toBe(false);
      expect(validation.invalidReferences).toHaveLength(1);
      expect(validation.invalidReferences[0].invalidIds).toContain('invalid-id');
    });
  });

  describe('Enhanced Validation', () => {
    it('validates monarch IDs exist in database', () => {
      const memberData = {
        name: 'Test Member',
        born: 1545,
        died: 1625,
        monarchIds: ['gustav-i-vasa', 'invalid-monarch-id', 'erik-xiv']
      };

      const errors = validateMonarchRelationships(memberData, mockMonarchs);

      expect(errors.monarchIds).toContain('Invalid monarch IDs: invalid-monarch-id');
    });

    it('detects duplicate monarch IDs', () => {
      const memberData = {
        name: 'Test Member',
        monarchIds: ['gustav-i-vasa', 'erik-xiv', 'gustav-i-vasa'] // duplicate
      };

      const errors = validateMonarchRelationships(memberData, mockMonarchs);

      expect(errors.monarchIds).toContain('Duplicate monarch IDs detected');
    });

    it('warns about data migration needs', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const memberData = {
        name: 'Test Member',
        monarchDuringLife: ['Gustav Vasa (1523–1560)'],
        monarchIds: [] // Empty but should have data
      };

      validateMonarchRelationships(memberData, mockMonarchs);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Monarch relationship warnings:',
        expect.arrayContaining([
          expect.stringContaining('may need data migration')
        ])
      );

      consoleSpy.mockRestore();
    });

    it('validates monarch array structure', () => {
      const memberData = {
        name: 'Test Member',
        monarchIds: 'not-an-array' // Invalid structure
      };

      const errors = validateMonarchRelationships(memberData, mockMonarchs);

      expect(errors.monarchIds).toBe('Monarch IDs must be provided as an array');
    });

    it('warns about timeline mismatches', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const memberData = {
        name: 'Test Member',
        born: 1400, // Before any monarch in our test data
        died: 1450,
        monarchIds: ['gustav-i-vasa'] // This monarch reigned 1523-1560
      };

      validateMonarchRelationships(memberData, mockMonarchs);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Monarch relationship warnings:',
        expect.arrayContaining([
          expect.stringContaining('Timeline mismatch')
        ])
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Complete Data Flow Integration', () => {
    it('handles full workflow: calculate → validate → process → save', () => {
      // Step 1: Auto-calculate monarchs for lifetime
      const bornYear = 1545;
      const diedYear = 1625;
      const calculatedIds = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);

      expect(calculatedIds).toHaveLength(6);

      // Step 2: Validate the calculated monarchs
      const memberData = {
        name: 'Tyge Larsson',
        born: bornYear,
        died: diedYear,
        monarchIds: calculatedIds
      };

      const validationErrors = validateMonarchRelationships(memberData, mockMonarchs);
      expect(Object.keys(validationErrors)).toHaveLength(0);

      // Step 3: Process form data with calculated IDs
      const formData = new FormData();
      formData.append('name', 'Tyge Larsson');
      formData.append('born', bornYear.toString());
      formData.append('died', diedYear.toString());

      const processedData = processFamilyMemberFormData(
        formData,
        true,
        null,
        calculatedIds,
        mockMonarchs
      );

      // Step 4: Verify final data structure
      expect(processedData.monarchIds).toEqual(calculatedIds);
      expect(processedData.monarchDuringLife).toHaveLength(6);
      expect(processedData.monarchDuringLife[0]).toBe('Gustav I Vasa (1523–1560)');
      expect(processedData.monarchDuringLife[5]).toBe('Gustav II Adolf (1611–1632)');
      
      // Verify data integrity
      expect(processedData.monarchIds?.length).toBe(processedData.monarchDuringLife?.length);
    });

    it('handles migration workflow: analyze → migrate → validate', () => {
      // Step 1: Generate migration report
      const report = generateMigrationReport([mockFamilyMemberWithNames], mockMonarchs);
      
      expect(report.membersNeedingMigration).toBe(1);
      expect(report.migrationDetails[0].resolvedMonarchIds).toHaveLength(6);

      // Step 2: Perform migration
      const migratedMember = migrateFamilyMember(mockFamilyMemberWithNames, mockMonarchs);
      
      expect(migratedMember.monarchIds).toHaveLength(6);

      // Step 3: Validate migrated data
      const validation = validateMonarchIds([migratedMember], mockMonarchs);
      
      expect(validation.isValid).toBe(true);
      expect(validation.invalidReferences).toHaveLength(0);

      // Step 4: Verify data consistency
      const validationErrors = validateMonarchRelationships(migratedMember, mockMonarchs);
      expect(Object.keys(validationErrors)).toHaveLength(0);
    });
  });
});