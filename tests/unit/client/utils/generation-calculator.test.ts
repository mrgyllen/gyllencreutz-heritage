/**
 * Unit tests for generation calculator utilities
 * 
 * Tests the core genealogical calculation functions for accuracy
 * and proper handling of edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGeneration,
  addGenerationData,
  filterMembersByBranch,
  calculateGenerationStats,
  type GenerationStats,
} from '@/utils/generation-calculator';
import type { FamilyMember } from '@shared/schema';

// Mock data for testing
const mockFamilyMembers: FamilyMember[] = [
  {
    id: 1,
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
  },
  {
    id: 2,
    externalId: '0.1',
    name: 'Erik Larsson',
    born: 1545,
    died: 1600,
    biologicalSex: 'Male',
    notes: 'First to use Gyllencreutz surname',
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
    externalId: '0.1.1',
    name: 'Lars Eriksson',
    born: 1580,
    died: 1620,
    biologicalSex: 'Male',
    notes: 'Military officer',
    father: 'Erik Larsson',
    ageAtDeath: 40,
    diedYoung: false,
    isSuccessionSon: false,
    hasMaleChildren: false,
    nobleBranch: 'Elder line',
    monarchDuringLife: ['Sigismund', 'Karl IX'],
  },
  {
    id: 4,
    externalId: '0.1.2',
    name: 'Anna Eriksson',
    born: 1590,
    died: 1650,
    biologicalSex: 'Female',
    notes: 'Married into nobility',
    father: 'Erik Larsson',
    ageAtDeath: 60,
    diedYoung: false,
    isSuccessionSon: false,
    hasMaleChildren: false,
    nobleBranch: 'Younger line',
    monarchDuringLife: ['Karl IX', 'Gustav II Adolf'],
  },
  {
    id: 5,
    externalId: '0.1.1.1',
    name: 'Johan Larsson',
    born: 1615,
    died: 1625,
    biologicalSex: 'Male',
    notes: 'Died in childhood',
    father: 'Lars Eriksson',
    ageAtDeath: 10,
    diedYoung: true,
    isSuccessionSon: false,
    hasMaleChildren: false,
    nobleBranch: 'Elder line',
    monarchDuringLife: ['Gustav II Adolf'],
  },
];

describe('calculateGeneration', () => {
  it('should return 1 for root external ID "0"', () => {
    expect(calculateGeneration('0')).toBe(1);
  });

  it('should calculate generation based on dot notation depth', () => {
    expect(calculateGeneration('0.1')).toBe(2);
    expect(calculateGeneration('0.1.1')).toBe(3);
    expect(calculateGeneration('0.1.1.1')).toBe(4);
    expect(calculateGeneration('1.2.3.4.5')).toBe(5);
  });

  it('should handle single digit external IDs', () => {
    expect(calculateGeneration('1')).toBe(1);
    expect(calculateGeneration('5')).toBe(1);
  });

  it('should handle complex hierarchical IDs', () => {
    expect(calculateGeneration('12.34.56')).toBe(3);
    expect(calculateGeneration('100.200.300.400')).toBe(4);
  });
});

describe('addGenerationData', () => {
  it('should add generation data to all family members', () => {
    const membersWithGeneration = addGenerationData(mockFamilyMembers);
    
    expect(membersWithGeneration).toHaveLength(5);
    expect(membersWithGeneration[0].generation).toBe(1); // "0"
    expect(membersWithGeneration[1].generation).toBe(2); // "0.1"
    expect(membersWithGeneration[2].generation).toBe(3); // "0.1.1"
    expect(membersWithGeneration[3].generation).toBe(3); // "0.1.2"
    expect(membersWithGeneration[4].generation).toBe(4); // "0.1.1.1"
  });

  it('should preserve original member data', () => {
    const membersWithGeneration = addGenerationData(mockFamilyMembers);
    
    expect(membersWithGeneration[0].name).toBe('Lars Tygesson');
    expect(membersWithGeneration[0].born).toBe(1515);
    expect(membersWithGeneration[0].isSuccessionSon).toBe(true);
  });

  it('should handle empty array', () => {
    const result = addGenerationData([]);
    expect(result).toEqual([]);
  });
});

describe('filterMembersByBranch', () => {
  const membersWithGeneration = addGenerationData(mockFamilyMembers);

  it('should return all members for "all" filter', () => {
    const filtered = filterMembersByBranch(membersWithGeneration, 'all');
    expect(filtered).toHaveLength(5);
  });

  it('should return only succession sons and root for "main" filter', () => {
    const filtered = filterMembersByBranch(membersWithGeneration, 'main');
    expect(filtered).toHaveLength(2); // Lars and Erik (both are succession sons)
    expect(filtered.every(m => m.isSuccessionSon || m.externalId === '0')).toBe(true);
  });

  it('should return elder line members for "elder" filter', () => {
    const filtered = filterMembersByBranch(membersWithGeneration, 'elder');
    const elderMembers = filtered.filter(m => m.nobleBranch === 'Elder line');
    expect(elderMembers.length).toBeGreaterThan(0);
  });

  it('should return younger line members for "younger" filter', () => {
    const filtered = filterMembersByBranch(membersWithGeneration, 'younger');
    const youngerMembers = filtered.filter(m => m.nobleBranch === 'Younger line');
    expect(youngerMembers.length).toBeGreaterThan(0);
  });

  it('should always include root ancestor in filtered results', () => {
    const elderFiltered = filterMembersByBranch(membersWithGeneration, 'elder');
    const youngerFiltered = filterMembersByBranch(membersWithGeneration, 'younger');
    
    expect(elderFiltered.some(m => m.externalId === '0')).toBe(true);
    expect(youngerFiltered.some(m => m.externalId === '0')).toBe(true);
  });
});

describe('calculateGenerationStats', () => {
  const membersWithGeneration = addGenerationData(mockFamilyMembers);

  it('should calculate stats for all generations', () => {
    const stats = calculateGenerationStats(membersWithGeneration);
    
    expect(stats).toHaveLength(4); // Generations 1, 2, 3, 4
    expect(stats[0].generation).toBe(1);
    expect(stats[1].generation).toBe(2);
    expect(stats[2].generation).toBe(3);
    expect(stats[3].generation).toBe(4);
  });

  it('should calculate correct member counts per generation', () => {
    const stats = calculateGenerationStats(membersWithGeneration);
    
    expect(stats[0].count).toBe(1); // Generation 1: Lars
    expect(stats[1].count).toBe(1); // Generation 2: Erik
    expect(stats[2].count).toBe(2); // Generation 3: Lars Eriksson, Anna
    expect(stats[3].count).toBe(1); // Generation 4: Johan
  });

  it('should calculate time spans correctly', () => {
    const stats = calculateGenerationStats(membersWithGeneration);
    
    expect(stats[0].timeSpan.earliest).toBe(1515); // Lars birth
    expect(stats[0].timeSpan.latest).toBe(1560);   // Lars death
    
    expect(stats[2].timeSpan.earliest).toBe(1580); // Earliest birth in gen 3
    expect(stats[2].timeSpan.latest).toBe(1650);   // Latest death in gen 3
  });

  it('should calculate average lifespans', () => {
    const stats = calculateGenerationStats(membersWithGeneration);
    
    expect(stats[0].avgLifespan).toBe(45); // Lars: 45 years
    expect(stats[1].avgLifespan).toBe(55); // Erik: 55 years
    expect(stats[2].avgLifespan).toBe(50); // Average of 40 and 60
    expect(stats[3].avgLifespan).toBe(10); // Johan: 10 years
  });

  it('should count succession sons correctly', () => {
    const stats = calculateGenerationStats(membersWithGeneration);
    
    expect(stats[0].successionSons).toBe(1); // Lars
    expect(stats[1].successionSons).toBe(1); // Erik
    expect(stats[2].successionSons).toBe(0); // None in generation 3
    expect(stats[3].successionSons).toBe(0); // None in generation 4
  });

  it('should handle empty member array', () => {
    const stats = calculateGenerationStats([]);
    expect(stats).toEqual([]);
  });

  it('should sort generations in ascending order', () => {
    const stats = calculateGenerationStats(membersWithGeneration);
    
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i].generation).toBeGreaterThan(stats[i - 1].generation);
    }
  });

  it('should handle members with null birth/death dates', () => {
    const membersWithNulls: FamilyMember[] = [
      {
        ...mockFamilyMembers[0],
        born: null,
        died: null,
        ageAtDeath: null,
      },
    ];
    
    const stats = calculateGenerationStats(addGenerationData(membersWithNulls));
    
    expect(stats[0].timeSpan.earliest).toBeNull();
    expect(stats[0].timeSpan.latest).toBeNull();
    expect(stats[0].avgLifespan).toBeNull();
  });

  it('should filter by branch when specified', () => {
    const mainStats = calculateGenerationStats(membersWithGeneration, 'main');
    const elderStats = calculateGenerationStats(membersWithGeneration, 'elder');
    
    // Main line should have fewer members than all branches
    const totalMainMembers = mainStats.reduce((sum, gen) => sum + gen.count, 0);
    const totalElderMembers = elderStats.reduce((sum, gen) => sum + gen.count, 0);
    
    expect(totalMainMembers).toBeLessThan(5);
    expect(totalElderMembers).toBeGreaterThan(0);
  });
});