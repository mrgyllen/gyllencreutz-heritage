/**
 * Tests for the monarch timeline calculation fixes
 * 
 * Verifies that the timeline calculation bug is resolved and shows correct
 * monarch counts for family members like Tyge Larsson (1545-1625).
 */

import { describe, it, expect } from 'vitest';
import { calculateMonarchsForLifetime } from '@/lib/admin-validation-utils';
import { mockMonarchs } from '@tests/mocks/server/monarchs';

describe('Monarch Timeline Calculation Fixes', () => {
  describe('calculateMonarchsForLifetime', () => {
    it('calculates correct monarchs for Tyge Larsson (1545-1625)', () => {
      const bornYear = 1545;
      const diedYear = 1625;
      
      const result = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);
      
      // Based on the mock data, these monarchs should overlap with 1545-1625:
      // - Gustav I Vasa (1523-1560) - overlaps 1545-1560 ✓
      // - Erik XIV (1560-1568) - full reign during lifetime ✓ 
      // - Johan III (1568-1592) - full reign during lifetime ✓
      // - Sigismund (1592-1599) - full reign during lifetime ✓
      // - Karl IX (1599-1611) - full reign during lifetime ✓
      // - Gustav II Adolf (1611-1632) - overlaps 1611-1625 ✓
      expect(result).toHaveLength(6);
      
      // Verify specific monarchs are included
      expect(result).toContain('gustav-i-vasa');
      expect(result).toContain('erik-xiv');
      expect(result).toContain('johan-iii');
      expect(result).toContain('sigismund');
      expect(result).toContain('karl-ix');
      expect(result).toContain('gustav-ii-adolf');
    });

    it('handles edge case where member dies same year as monarch begins', () => {
      // Member dies in 1560, Gustav Vasa dies and Erik XIV begins in 1560
      const bornYear = 1540;
      const diedYear = 1560;
      
      const result = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);
      
      // Both Gustav Vasa (ends 1560) and Erik XIV (starts 1560) should be included
      expect(result).toContain('gustav-i-vasa');
      expect(result).toContain('erik-xiv');
    });

    it('handles edge case where member is born same year as monarch ends', () => {
      // Member born in 1560, when Gustav Vasa dies and Erik XIV begins
      const bornYear = 1560;
      const diedYear = 1580;
      
      const result = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);
      
      // Both Gustav Vasa (ends 1560) and Erik XIV (starts 1560) should be included
      expect(result).toContain('gustav-i-vasa');
      expect(result).toContain('erik-xiv');
      expect(result).toContain('johan-iii'); // Starts 1568
    });

    it('handles member still alive (no death year)', () => {
      const bornYear = 1600;
      const diedYear = null;
      
      const result = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);
      
      // Should include monarchs from 1600 onwards to present
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('gustav-ii-adolf'); // 1611-1632
    });

    it('returns empty array for invalid birth year', () => {
      const result = calculateMonarchsForLifetime(null, 1625, mockMonarchs);
      expect(result).toEqual([]);
    });

    it('handles very short lifetime', () => {
      // Child who lived only 1 year during Gustav Vasa's reign
      const bornYear = 1550;
      const diedYear = 1551;
      
      const result = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);
      
      expect(result).toHaveLength(1);
      expect(result).toContain('gustav-i-vasa');
    });

    it('handles lifetime spanning many monarchs', () => {
      // Long-lived person spanning multiple reigns
      const bornYear = 1520;
      const diedYear = 1640;
      
      const result = calculateMonarchsForLifetime(bornYear, diedYear, mockMonarchs);
      
      // Should include all monarchs in the test data
      expect(result).toHaveLength(6);
    });
  });

  describe('Timeline Validation Logic', () => {
    it('correctly identifies overlap between date ranges', () => {
      // Test the core date overlap logic used in calculateMonarchsForLifetime
      const memberBorn = new Date('1545-01-01');
      const memberDied = new Date('1625-12-31');
      
      // Gustav Vasa: 1523-1560 (should overlap)
      const gustavStart = new Date('1523-06-06');
      const gustavEnd = new Date('1560-09-29');
      const gustavOverlaps = gustavStart <= memberDied && gustavEnd >= memberBorn;
      expect(gustavOverlaps).toBe(true);
      
      // Erik XIV: 1560-1568 (should overlap)
      const erikStart = new Date('1560-09-29');
      const erikEnd = new Date('1568-09-25');
      const erikOverlaps = erikStart <= memberDied && erikEnd >= memberBorn;
      expect(erikOverlaps).toBe(true);
      
      // A monarch before member's birth (should not overlap)
      const earlyStart = new Date('1400-01-01');
      const earlyEnd = new Date('1500-01-01');
      const earlyOverlaps = earlyStart <= memberDied && earlyEnd >= memberBorn;
      expect(earlyOverlaps).toBe(false);
      
      // A monarch after member's death (should not overlap)
      const lateStart = new Date('1700-01-01');
      const lateEnd = new Date('1800-01-01');
      const lateOverlaps = lateStart <= memberDied && lateEnd >= memberBorn;
      expect(lateOverlaps).toBe(false);
    });
  });
});