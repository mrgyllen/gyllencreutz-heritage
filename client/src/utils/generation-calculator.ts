import { type FamilyMember } from "@/types/family";

export function calculateGeneration(externalId: string): number {
  // Parse the lineage ID to determine generation depth
  // "0" = Generation 1 (root)
  // "0.1" = Generation 2 (child of root)
  // "1.2.3" = Generation 4, etc.
  
  if (externalId === "0") return 1;
  
  const parts = externalId.split('.');
  return parts.length;
}

export function addGenerationData(members: FamilyMember[]): FamilyMember[] {
  return members.map(member => ({
    ...member,
    generation: calculateGeneration(member.externalId)
  }));
}

export interface GenerationStats {
  generation: number;
  count: number;
  timeSpan: {
    earliest: number | null;
    latest: number | null;
  };
  avgLifespan: number | null;
  successionSons: number;
}

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
    // Younger line: only members explicitly marked as Younger line + root ancestor
    // Do NOT include succession sons as they may belong to Elder line
    return members.filter(m => 
      m.nobleBranch === 'Younger line' ||
      m.externalId === '0'  // Only include the root ancestor
    );
  }
  
  return members;
}

export function calculateGenerationStats(members: FamilyMember[], branchFilter: 'all' | 'main' | 'elder' | 'younger' = 'all'): GenerationStats[] {
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