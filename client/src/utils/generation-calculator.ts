import { type FamilyMember } from "@/types/family";

/**
 * Calculates the generation number for a family member based on their external ID
 * 
 * The external ID follows a hierarchical dot notation where:
 * - "0" represents the root ancestor (Generation 1)
 * - "0.1" represents a child of the root (Generation 2)
 * - "1.2.3" represents a great-grandchild (Generation 4)
 * 
 * @param externalId - The external ID of the family member in dot notation
 * @returns The generation number (1-based indexing)
 * 
 * @example
 * calculateGeneration("0") // returns 1
 * calculateGeneration("0.1") // returns 2
 * calculateGeneration("1.2.3") // returns 4
 */
export function calculateGeneration(externalId: string): number {
  if (externalId === "0") return 1;
  
  const parts = externalId.split('.');
  return parts.length;
}

/**
 * Enhances family member data by adding generation information
 * 
 * Takes an array of family members and calculates their generation
 * based on their external ID, adding this information to each member.
 * 
 * @param members - Array of family members to enhance
 * @returns Array of family members with generation data added
 * 
 * @example
 * const members = [{ externalId: "0", name: "Lars" }, { externalId: "0.1", name: "Erik" }];
 * const enhanced = addGenerationData(members);
 * // enhanced[0].generation === 1, enhanced[1].generation === 2
 */
export function addGenerationData(members: FamilyMember[]): FamilyMember[] {
  return members.map(member => ({
    ...member,
    generation: calculateGeneration(member.externalId)
  }));
}

/**
 * Statistical information about a specific generation
 */
export interface GenerationStats {
  /** The generation number (1-based) */
  generation: number;
  /** Total number of family members in this generation */
  count: number;
  /** Time span covered by this generation */
  timeSpan: {
    /** Earliest birth year in this generation */
    earliest: number | null;
    /** Latest death year in this generation */
    latest: number | null;
  };
  /** Average lifespan for members with known birth/death dates */
  avgLifespan: number | null;
  /** Number of succession sons in this generation */
  successionSons: number;
}

/**
 * Filters family members by noble branch lineage
 * 
 * The Gyllencreutz family split into multiple noble branches over time.
 * This function allows filtering to show only specific lineages for
 * genealogical analysis and visualization.
 * 
 * @param members - Array of all family members to filter
 * @param branchFilter - Which branch lineage to include
 *   - 'all': Include all family members regardless of branch
 *   - 'main': Only succession sons and root ancestor (primary inheritance line)
 *   - 'elder': Elder line branch plus early pre-split members and succession sons
 *   - 'younger': Younger line branch plus root ancestor and early succession sons
 * 
 * @returns Filtered array of family members matching the branch criteria
 * 
 * @example
 * const allMembers = getFamilyMembers();
 * const mainLine = filterMembersByBranch(allMembers, 'main');
 * const elderBranch = filterMembersByBranch(allMembers, 'elder');
 */
export function filterMembersByBranch(members: FamilyMember[], branchFilter: 'all' | 'main' | 'elder' | 'younger'): FamilyMember[] {
  if (branchFilter === 'all') return members;
  
  if (branchFilter === 'main') {
    // Main line: only succession sons and their direct ancestors/descendants
    return members.filter(m => m.isSuccessionSon || m.externalId === '0');
  }
  
  if (branchFilter === 'elder') {
    // Elder line: members explicitly marked as Elder line + early family members (before branch split) + succession sons
    return members.filter(m => 
      m.nobleBranch === 'Elder line' ||
      (m.nobleBranch === null || m.nobleBranch === '') ||
      m.isSuccessionSon ||
      m.externalId === '0'
    );
  }
  
  if (branchFilter === 'younger') {
    // Younger line: explicit Younger line members + main succession line (before branch split)
    return members.filter(m => 
      m.nobleBranch === 'Younger line' ||
      m.externalId === '0' ||  // Root ancestor
      (m.isSuccessionSon && (m.nobleBranch === null || m.nobleBranch === ''))  // Early succession sons before branch split
    );
  }
  
  return members;
}

/**
 * Calculates comprehensive statistical data for each generation within a family branch
 * 
 * Analyzes family member data to provide insights into generational patterns,
 * including population counts, lifespans, time periods, and succession information.
 * This is particularly useful for genealogical research and historical analysis.
 * 
 * @param members - Array of all family members to analyze
 * @param branchFilter - Which noble branch to analyze (defaults to 'all')
 * @returns Array of generation statistics, sorted by generation number
 * 
 * @example
 * const allMembers = getFamilyMembers();
 * const stats = calculateGenerationStats(allMembers, 'main');
 * // stats[0] = { generation: 1, count: 1, timeSpan: {...}, avgLifespan: 45, successionSons: 1 }
 * 
 * @throws {Error} If members array is empty or contains invalid data
 */
export function calculateGenerationStats(members: FamilyMember[], branchFilter: 'all' | 'main' | 'elder' | 'younger' = 'all'): GenerationStats[] {
  if (!Array.isArray(members) || members.length === 0) {
    return [];
  }

  const filteredMembers = filterMembersByBranch(members, branchFilter);
  const generationMap = new Map<number, FamilyMember[]>();
  
  // Group filtered members by generation
  filteredMembers.forEach(member => {
    const gen = member.generation || calculateGeneration(member.externalId);
    if (!generationMap.has(gen)) {
      generationMap.set(gen, []);
    }
    generationMap.get(gen)!.push(member);
  });
  
  // Calculate stats for each generation
  const stats: GenerationStats[] = [];
  
  Array.from(generationMap.entries()).forEach(([generation, genMembers]) => {
    const births = genMembers.map((m: FamilyMember) => m.born).filter((b: number | null) => b !== null) as number[];
    const deaths = genMembers.map((m: FamilyMember) => m.died).filter((d: number | null) => d !== null) as number[];
    const lifespans = genMembers
      .filter((m: FamilyMember) => m.ageAtDeath !== null)
      .map((m: FamilyMember) => m.ageAtDeath!) as number[];
    
    stats.push({
      generation,
      count: genMembers.length,
      timeSpan: {
        earliest: births.length > 0 ? Math.min(...births) : null,
        latest: deaths.length > 0 ? Math.max(...deaths) : null
      },
      avgLifespan: lifespans.length > 0 
        ? Math.round(lifespans.reduce((sum, age) => sum + age, 0) / lifespans.length) 
        : null,
      successionSons: genMembers.filter((m: FamilyMember) => m.isSuccessionSon).length
    });
  });
  
  return stats.sort((a, b) => a.generation - b.generation);
}