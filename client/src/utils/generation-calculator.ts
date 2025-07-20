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

export function calculateGenerationStats(members: FamilyMember[]): GenerationStats[] {
  const generationMap = new Map<number, FamilyMember[]>();
  
  // Group members by generation
  members.forEach(member => {
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