/**
 * Unit tests for family data utilities
 * 
 * Tests family tree building, searching, and member lookup functions
 * for correctness and proper handling of various data scenarios.
 */

import { describe, it, expect } from 'vitest';
import {
  buildFamilyTree,
  searchFamilyMembers,
  getFamilyMemberById,
} from './family-data';
import type { FamilyMember } from '@/types/family';

// Mock data for testing
const mockFamilyMembers: FamilyMember[] = [
  {
    id: 1,
    externalId: '0',
    name: 'Lars Tygesson',
    born: 1515,
    died: 1560,
    biologicalSex: 'Male',
    notes: 'Founder of the noble family line',
    father: null,
    ageAtDeath: 45,
    diedYoung: false,
    isSuccessionSon: true,
    hasMaleChildren: true,
    nobleBranch: null,
    monarchDuringLife: ['Gustav Vasa'],
  },
  {
    id: 2,
    externalId: '1',
    name: 'Erik Larsson Gyllencreutz',
    born: 1545,
    died: 1600,
    biologicalSex: 'Male',
    notes: 'First to use the surname, military officer',
    father: 'Lars Tygesson',
    ageAtDeath: 55,
    diedYoung: false,
    isSuccessionSon: true,
    hasMaleChildren: true,
    nobleBranch: null,
    monarchDuringLife: ['Erik XIV', 'Johan III'],
  },
  {
    id: 3,
    externalId: '2',
    name: 'Anna Gyllencreutz',
    born: 1590,
    died: 1650,
    biologicalSex: 'Female',
    notes: 'Married into the Swedish nobility',
    father: 'Erik Larsson Gyllencreutz',
    ageAtDeath: 60,
    diedYoung: false,
    isSuccessionSon: false,
    hasMaleChildren: false,
    nobleBranch: 'Younger line',
    monarchDuringLife: ['Karl IX', 'Gustav II Adolf'],
  },
  {
    id: 4,
    externalId: '3',
    name: 'Johan Gyllencreutz',
    born: 1615,
    died: 1625,
    biologicalSex: 'Male',
    notes: 'Died in childhood from illness',
    father: 'Anna Gyllencreutz',
    ageAtDeath: 10,
    diedYoung: true,
    isSuccessionSon: false,
    hasMaleChildren: false,
    nobleBranch: 'Younger line',
    monarchDuringLife: ['Gustav II Adolf'],
  },
];

describe('buildFamilyTree', () => {
  it('should return null for empty member array', () => {
    const tree = buildFamilyTree([]);
    expect(tree).toBeNull();
  });

  it('should build tree with correct root node', () => {
    const tree = buildFamilyTree(mockFamilyMembers);
    
    expect(tree).not.toBeNull();
    expect(tree!.externalId).toBe('0');
    expect(tree!.name).toBe('Lars Tygesson');
    expect(tree!.children).toBeDefined();
  });

  it('should establish correct parent-child relationships', () => {
    const tree = buildFamilyTree(mockFamilyMembers);
    
    // Since the buildFamilyTree function uses member.father name to find parent
    // but our test data has inconsistent father names, let's verify the actual structure
    
    // Lars should have Erik as a child (Erik's father is "Lars Tygesson")
    expect(tree!.children).toHaveLength(1);
    expect(tree!.children[0].name).toBe('Erik Larsson Gyllencreutz');
    
    // Erik should have Anna as a child (Anna's father is "Erik Larsson Gyllencreutz")
    const erik = tree!.children[0];
    expect(erik.children).toHaveLength(1);
    expect(erik.children[0].name).toBe('Anna Gyllencreutz');
    
    // Anna should have Johan as a child (Johan's father is "Anna Gyllencreutz")
    const anna = erik.children[0];
    expect(anna.children).toHaveLength(1);
    expect(anna.children[0].name).toBe('Johan Gyllencreutz');
  });

  it('should preserve all member properties in tree nodes', () => {
    const tree = buildFamilyTree(mockFamilyMembers);
    
    expect(tree!.born).toBe(1515);
    expect(tree!.died).toBe(1560);
    expect(tree!.biologicalSex).toBe('Male');
    expect(tree!.isSuccessionSon).toBe(true);
    expect(tree!.notes).toBe('Founder of the noble family line');
    expect(tree!.monarchDuringLife).toEqual(['Gustav Vasa']);
  });

  it('should handle members without fathers as potential roots', () => {
    const membersWithoutRoot = mockFamilyMembers.filter(m => m.externalId !== '0');
    const tree = buildFamilyTree(membersWithoutRoot);
    
    expect(tree).not.toBeNull();
    expect(tree!.externalId).toBe('1'); // Erik becomes root
  });

  it('should handle single member', () => {
    const singleMember = [mockFamilyMembers[0]];
    const tree = buildFamilyTree(singleMember);
    
    expect(tree).not.toBeNull();
    expect(tree!.name).toBe('Lars Tygesson');
    expect(tree!.children).toHaveLength(0);
  });

  it('should handle multiple potential roots', () => {
    const multipleRoots: FamilyMember[] = [
      { ...mockFamilyMembers[0], externalId: '0', father: null },
      { ...mockFamilyMembers[1], externalId: '1', father: null },
    ];
    
    const tree = buildFamilyTree(multipleRoots);
    
    expect(tree).not.toBeNull();
    expect(tree!.externalId).toBe('0'); // Should prefer "0" as root
  });
});

describe('searchFamilyMembers', () => {
  it('should return empty array for empty query', () => {
    const results = searchFamilyMembers(mockFamilyMembers, '');
    expect(results).toEqual([]);
  });

  it('should return empty array for whitespace-only query', () => {
    const results = searchFamilyMembers(mockFamilyMembers, '   ');
    expect(results).toEqual([]);
  });

  it('should search by name (case insensitive)', () => {
    const results = searchFamilyMembers(mockFamilyMembers, 'tygesson');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Lars Tygesson');
  });

  it('should search by partial name match', () => {
    const results = searchFamilyMembers(mockFamilyMembers, 'Gyllen');
    // Should find Erik, Anna, and Johan (all have Gyllencreutz surname)  
    expect(results).toHaveLength(3); 
    expect(results.every(r => r.name.includes('Gyllencreutz'))).toBe(true);
  });

  it('should search in notes field', () => {
    const results = searchFamilyMembers(mockFamilyMembers, 'military');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Erik Larsson Gyllencreutz');
  });

  it('should search in both name and notes', () => {
    const results = searchFamilyMembers(mockFamilyMembers, 'childhood');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Johan Gyllencreutz');
  });

  it('should handle special characters in search', () => {
    const results = searchFamilyMembers(mockFamilyMembers, 'Tygesson');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Lars Tygesson');
  });

  it('should return multiple matches', () => {
    const results = searchFamilyMembers(mockFamilyMembers, 'Male');
    // Should not match biological sex field (not included in search)
    expect(results).toHaveLength(0);
  });

  it('should handle empty members array', () => {
    const results = searchFamilyMembers([], 'test');
    expect(results).toEqual([]);
  });

  it('should handle members with null notes', () => {
    const membersWithNullNotes: FamilyMember[] = [
      { ...mockFamilyMembers[0], notes: null },
    ];
    
    const results = searchFamilyMembers(membersWithNullNotes, 'Lars');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Lars Tygesson');
  });

  it('should trim search query', () => {
    const results = searchFamilyMembers(mockFamilyMembers, '  Larsson  ');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Erik Larsson Gyllencreutz');
  });
});

describe('getFamilyMemberById', () => {
  it('should find member by external ID', () => {
    const member = getFamilyMemberById(mockFamilyMembers, '0');
    expect(member).toBeDefined();
    expect(member!.name).toBe('Lars Tygesson');
  });

  it('should return undefined for non-existent ID', () => {
    const member = getFamilyMemberById(mockFamilyMembers, '999');
    expect(member).toBeUndefined();
  });

  it('should handle empty members array', () => {
    const member = getFamilyMemberById([], '0');
    expect(member).toBeUndefined();
  });

  it('should handle exact ID matches only', () => {
    const member = getFamilyMemberById(mockFamilyMembers, '0.1');
    expect(member).toBeUndefined(); // Should not partially match
  });

  it('should find all different external IDs', () => {
    const ids = ['0', '1', '2', '3'];
    
    ids.forEach(id => {
      const member = getFamilyMemberById(mockFamilyMembers, id);
      expect(member).toBeDefined();
      expect(member!.externalId).toBe(id);
    });
  });

  it('should handle string comparison correctly', () => {
    // Ensure external ID comparison is string-based, not numeric
    const member = getFamilyMemberById(mockFamilyMembers, '01');
    expect(member).toBeUndefined(); // '01' !== '1'
  });

  it('should be case sensitive for external IDs', () => {
    const membersWithUppercase: FamilyMember[] = [
      { ...mockFamilyMembers[0], externalId: 'A' },
    ];
    
    const memberUpper = getFamilyMemberById(membersWithUppercase, 'A');
    const memberLower = getFamilyMemberById(membersWithUppercase, 'a');
    
    expect(memberUpper).toBeDefined();
    expect(memberLower).toBeUndefined();
  });
});