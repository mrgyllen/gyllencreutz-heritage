/**
 * Data migration utilities for converting monarch relationships
 * from name-based storage to ID-based storage
 */

import { type CosmosDbFamilyMember, type Monarch } from '@/types/family';

/**
 * Convert monarch display names to monarch IDs
 * 
 * Matches names like "Gustav Vasa (1523–1560)" to monarch IDs
 */
export function convertMonarchNamesToIds(
  monarchDuringLife: string[],
  monarchs: Monarch[]
): string[] {
  const monarchIds: string[] = [];
  
  for (const monarchName of monarchDuringLife) {
    // Try to find monarch by exact name match first
    let matchedMonarch = monarchs.find(m => m.name === monarchName);
    
    // If no exact match, try to extract name from formatted string like "Gustav Vasa (1523–1560)"
    if (!matchedMonarch) {
      const nameMatch = monarchName.match(/^(.+?)\s*\((\d{4})–(\d{4})\)$/);
      if (nameMatch) {
        const [, extractedName, startYear, endYear] = nameMatch;
        
        // Try to match by name and reign dates
        matchedMonarch = monarchs.find(m => {
          const monarchStartYear = new Date(m.reignFrom).getFullYear();
          const monarchEndYear = new Date(m.reignTo).getFullYear();
          
          return (
            m.name.includes(extractedName.trim()) ||
            extractedName.trim().includes(m.name)
          ) && 
          monarchStartYear === parseInt(startYear) &&
          monarchEndYear === parseInt(endYear);
        });
      }
    }
    
    // If still no match, try partial name matching with common variants
    if (!matchedMonarch) {
      const searchName = monarchName.replace(/\s*\([^)]*\)$/, '').trim();
      
      matchedMonarch = monarchs.find(m => {
        const monarchNameLower = m.name.toLowerCase();
        const searchNameLower = searchName.toLowerCase();
        
        // Direct inclusion match
        if (monarchNameLower.includes(searchNameLower) || searchNameLower.includes(monarchNameLower)) {
          return true;
        }
        
        // Handle common name variants
        // "Gustav Vasa" should match "Gustav I Vasa"
        const searchWords = searchNameLower.split(' ');
        const monarchWords = monarchNameLower.split(' ');
        
        // If all search words are found in monarch name, it's a match
        const searchWordsInMonarch = searchWords.every(word => 
          monarchWords.some(mWord => mWord.includes(word) || word.includes(mWord))
        );
        
        if (searchWordsInMonarch) {
          return true;
        }
        
        // Handle Roman numeral variants: "Gustav Vasa" matches "Gustav I Vasa"
        if (searchWords.length === 2 && monarchWords.length === 3) {
          const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];
          const middleWord = monarchWords[1];
          
          if (romanNumerals.includes(middleWord) && 
              searchWords[0] === monarchWords[0] && 
              searchWords[1] === monarchWords[2]) {
            return true;
          }
        }
        
        return false;
      });
    }
    
    if (matchedMonarch) {
      monarchIds.push(matchedMonarch.id);
    } else {
      console.warn(`Could not find monarch ID for: "${monarchName}"`);
    }
  }
  
  return monarchIds;
}

/**
 * Migrate a single family member from name-based to ID-based monarch relationships
 */
export function migrateFamilyMember(
  member: CosmosDbFamilyMember,
  monarchs: Monarch[]
): CosmosDbFamilyMember {
  // If monarchIds already exists and is populated, no migration needed
  if (member.monarchIds && member.monarchIds.length > 0) {
    return member;
  }
  
  // Convert monarchDuringLife names to monarchIds
  const monarchIds = convertMonarchNamesToIds(member.monarchDuringLife || [], monarchs);
  
  // Generate new monarchDuringLife from the found monarchIds for consistency
  const monarchDuringLife = monarchIds.map(id => {
    const monarch = monarchs.find(m => m.id === id);
    if (monarch) {
      const fromYear = new Date(monarch.reignFrom).getFullYear();
      const toYear = new Date(monarch.reignTo).getFullYear();
      return `${monarch.name} (${fromYear}–${toYear})`;
    }
    return id; // Fallback to ID if monarch not found
  });
  
  return {
    ...member,
    monarchIds,
    // Keep monarchDuringLife for now during migration phase
    monarchDuringLife: member.monarchDuringLife
  };
}

/**
 * Migrate all family members in a batch
 */
export function migrateAllFamilyMembers(
  members: CosmosDbFamilyMember[],
  monarchs: Monarch[]
): CosmosDbFamilyMember[] {
  return members.map(member => migrateFamilyMember(member, monarchs));
}

/**
 * Generate migration report showing what will be changed
 */
export function generateMigrationReport(
  members: CosmosDbFamilyMember[],
  monarchs: Monarch[]
): {
  totalMembers: number;
  membersNeedingMigration: number;
  membersAlreadyMigrated: number;
  migrationDetails: {
    memberName: string;
    externalId: string;
    currentMonarchNames: string[];
    resolvedMonarchIds: string[];
    unresolvedNames: string[];
  }[];
} {
  const migrationDetails = [];
  let membersNeedingMigration = 0;
  let membersAlreadyMigrated = 0;
  
  for (const member of members) {
    const hasMonarchIds = member.monarchIds && member.monarchIds.length > 0;
    const hasMonarchNames = member.monarchDuringLife && member.monarchDuringLife.length > 0;
    
    if (hasMonarchIds) {
      membersAlreadyMigrated++;
    } else if (hasMonarchNames) {
      membersNeedingMigration++;
      
      const resolvedIds = convertMonarchNamesToIds(member.monarchDuringLife || [], monarchs);
      const unresolvedNames = (member.monarchDuringLife || []).filter((name, index) => {
        const resolvedId = convertMonarchNamesToIds([name], monarchs);
        return resolvedId.length === 0;
      });
      
      migrationDetails.push({
        memberName: member.name,
        externalId: member.externalId,
        currentMonarchNames: member.monarchDuringLife || [],
        resolvedMonarchIds: resolvedIds,
        unresolvedNames
      });
    }
  }
  
  return {
    totalMembers: members.length,
    membersNeedingMigration,
    membersAlreadyMigrated,
    migrationDetails
  };
}

/**
 * Validate that monarch IDs reference valid monarchs
 */
export function validateMonarchIds(
  members: CosmosDbFamilyMember[],
  monarchs: Monarch[]
): {
  isValid: boolean;
  invalidReferences: {
    memberName: string;
    externalId: string;
    invalidIds: string[];
  }[];
} {
  const invalidReferences = [];
  const validMonarchIds = new Set(monarchs.map(m => m.id));
  
  for (const member of members) {
    if (member.monarchIds && member.monarchIds.length > 0) {
      const invalidIds = member.monarchIds.filter(id => !validMonarchIds.has(id));
      
      if (invalidIds.length > 0) {
        invalidReferences.push({
          memberName: member.name,
          externalId: member.externalId,
          invalidIds
        });
      }
    }
  }
  
  return {
    isValid: invalidReferences.length === 0,
    invalidReferences
  };
}