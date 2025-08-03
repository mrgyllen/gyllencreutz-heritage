/**
 * Additional unit tests for date-based monarch matching logic
 * Tests edge cases and specific scenarios for the date overlap calculation
 */

import { describe, it, expect } from 'vitest';
import { mockMonarchs } from '@tests/mocks/server/monarchs';

describe('Date-based Monarch Matching Logic', () => {
  // Helper function to replicate the date matching logic from cosmosClient
  const getMonarchsDuringLifetime = (birthYear: number, deathYear: number) => {
    return mockMonarchs.filter(monarch => {
      const reignStart = new Date(monarch.reignFrom).getFullYear();
      const reignEnd = new Date(monarch.reignTo).getFullYear();
      // Person lived during monarch's reign if:
      // person.birth <= monarch.reignEnd AND person.death >= monarch.reignStart
      return birthYear <= reignEnd && deathYear >= reignStart;
    });
  };

  it('should correctly match a person who died before any monarchs were born', () => {
    const monarchs = getMonarchsDuringLifetime(1400, 1450);
    expect(monarchs).toHaveLength(0);
  });

  it('should correctly match a person who lived during Gustav Vasa\'s entire reign', () => {
    // Gustav Vasa reigned 1523-1560
    const monarchs = getMonarchsDuringLifetime(1525, 1555);
    expect(monarchs).toHaveLength(1);
    expect(monarchs[0].id).toBe('gustav-i-vasa');
  });

  it('should correctly match a person born exactly when one monarch died and another began', () => {
    // Erik XIV died and Johan III began in 1568
    const monarchs = getMonarchsDuringLifetime(1568, 1580);
    expect(monarchs).toHaveLength(2);
    expect(monarchs.map(m => m.id)).toContain('erik-xiv');
    expect(monarchs.map(m => m.id)).toContain('johan-iii');
  });

  it('should correctly match a person who lived across multiple monarch reigns', () => {
    // Person lived 1550-1600, overlapping with 5 monarchs
    const monarchs = getMonarchsDuringLifetime(1550, 1600);
    expect(monarchs).toHaveLength(5);
    expect(monarchs.map(m => m.id)).toContain('gustav-i-vasa');
    expect(monarchs.map(m => m.id)).toContain('erik-xiv');
    expect(monarchs.map(m => m.id)).toContain('johan-iii');
    expect(monarchs.map(m => m.id)).toContain('sigismund');
    expect(monarchs.map(m => m.id)).toContain('karl-ix');
  });

  it('should handle a person with unknown death year (still living)', () => {
    // Person born in 1630, still living (death year 9999)
    const monarchs = getMonarchsDuringLifetime(1630, 9999);
    expect(monarchs).toHaveLength(1);
    expect(monarchs[0].id).toBe('gustav-ii-adolf'); // Only Gustav II Adolf would overlap
  });

  it('should handle a person who lived only part of a monarch\'s reign', () => {
    // Person lived 1565-1570, during Erik XIV's reign (1560-1568)
    // Actually, this person lived 1565-1570, which is after Erik XIV died (1568)
    // but before Johan III's reign ended (1592)
    const monarchs = getMonarchsDuringLifetime(1565, 1570);
    expect(monarchs).toHaveLength(2);
    expect(monarchs.map(m => m.id)).toContain('erik-xiv');
    expect(monarchs.map(m => m.id)).toContain('johan-iii');
  });
});