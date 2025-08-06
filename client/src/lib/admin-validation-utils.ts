/**
 * Validation utilities for admin interface
 * 
 * Extracted from admin-db.tsx to centralize validation logic and improve maintainability.
 * Contains monarch relationship validation and form submission validation.
 */

import { type Monarch } from '@/types/family';
import { ValidationError, validateSearchQuery } from '@/lib/validation';
import { convertMonarchNamesToIds } from '@/lib/data-migration-utils';

/**
 * Validate monarch relationships for a family member
 * 
 * Enhanced validation with better error reporting and data integrity checks
 */
export function validateMonarchRelationships(memberData: any, monarchs: Monarch[]) {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];
  
  // Validate monarchIds array exists and has valid structure
  if (memberData.monarchIds && !Array.isArray(memberData.monarchIds)) {
    errors.monarchIds = 'Monarch IDs must be provided as an array';
    return errors;
  }
  
  // Legacy data migration check - if no monarchIds but has old data, warn about migration need
  if ((!memberData.monarchIds || memberData.monarchIds.length === 0)) {
    // Check if this might be a legacy record that needs migration
    if (memberData.monarchDuringLife && memberData.monarchDuringLife.length > 0) {
      warnings.push('Legacy data detected - monarchs will be migrated from names to IDs on save');
    }
  }
  
  // Validate monarch IDs exist in the monarch database
  if (memberData.monarchIds && memberData.monarchIds.length > 0) {
    const validMonarchIds = new Set(monarchs.map(m => m.id));
    const invalidMonarchIds = memberData.monarchIds.filter((id: string) => 
      !validMonarchIds.has(id)
    );
    
    if (invalidMonarchIds.length > 0) {
      errors.monarchIds = `Invalid monarch IDs: ${invalidMonarchIds.join(', ')}. Please check monarch data.`;
    }
    
    // Check for duplicate monarch IDs
    const uniqueIds = new Set(memberData.monarchIds);
    if (uniqueIds.size !== memberData.monarchIds.length) {
      errors.monarchIds = 'Duplicate monarch IDs detected. Each monarch should only be listed once.';
    }
  }
  
  // Timeline validation (warnings, not blocking errors)
  if (memberData.born && memberData.monarchIds && memberData.monarchIds.length > 0) {
    const bornDate = new Date(`${memberData.born}-01-01`);
    const diedDate = memberData.died && memberData.died !== 9999 
      ? new Date(`${memberData.died}-12-31`) 
      : new Date(); // If still alive, use current date

    const timelineMismatches = memberData.monarchIds.filter((id: string) => {
      const monarch = monarchs.find(m => m.id === id);
      if (!monarch) return false;
      
      const reignFromDate = new Date(monarch.reignFrom);
      const reignToDate = new Date(monarch.reignTo);
      
      // Check if reign does NOT overlap with lifetime
      return !(reignFromDate <= diedDate && reignToDate >= bornDate);
    });
    
    if (timelineMismatches.length > 0) {
      const mismatchedNames = timelineMismatches
        .map((id: string) => monarchs.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      warnings.push(`Timeline mismatch: ${mismatchedNames} may not have reigned during member's lifetime (${memberData.born}-${memberData.died || 'present'})`);
    }
    
    // Check for chronological order
    const validMonarchs = memberData.monarchIds
      .map((id: string) => monarchs.find(m => m.id === id))
      .filter((monarch: Monarch | undefined): monarch is Monarch => Boolean(monarch))
      .sort((a: Monarch, b: Monarch) => new Date(a.reignFrom).getTime() - new Date(b.reignFrom).getTime());
    
    if (validMonarchs.length > 1) {
      for (let i = 0; i < validMonarchs.length - 1; i++) {
        const currentEnd = new Date(validMonarchs[i].reignTo);
        const nextStart = new Date(validMonarchs[i + 1].reignFrom);
        
        if (currentEnd > nextStart) {
          warnings.push('Overlapping monarch reigns detected - please verify chronological accuracy');
          break;
        }
      }
    }
  }
  
  // Log warnings for debugging
  if (warnings.length > 0) {
    console.warn('Monarch relationship warnings:', warnings);
  }
  
  return errors;
}

/**
 * Process form data into member data structure
 * 
 * Uses monarchIds as the sole source of truth for monarch relationships.
 * No longer generates monarchDuringLife - data model simplified to use only IDs.
 */
export function processFamilyMemberFormData(
  formData: FormData, 
  isNew: boolean,
  editingMember: any | null,
  newMemberMonarchIds: string[],
  monarchs: Monarch[]
) {
  const bornValue = formData.get('born') as string;
  const diedValue = formData.get('died') as string;
  const ageAtDeathValue = formData.get('ageAtDeath') as string;
  
  const notesValue = formData.get('notes') as string;
  const fatherValue = formData.get('father') as string;
  const nobleBranchValue = formData.get('nobleBranch') as string;
  
  // Use monarchIds as the only source of truth - no more dual fields
  let monarchIds: string[] = [];
  
  
  if (isNew) {
    // For new members, use the provided monarch IDs
    monarchIds = newMemberMonarchIds || [];
  } else {
    // For existing members, prioritize monarchIds, but fall back to migration if needed
    if (editingMember?.monarchIds && editingMember.monarchIds.length > 0) {
      monarchIds = editingMember.monarchIds;
    } else if (editingMember?.monarchDuringLife && editingMember.monarchDuringLife.length > 0) {
      // Legacy migration fallback - convert names to IDs on-the-fly
      try {
        monarchIds = convertMonarchNamesToIds(editingMember.monarchDuringLife, monarchs);
      } catch (error) {
        console.error('Failed to migrate monarch data:', error);
        monarchIds = [];
      }
    } else {
      monarchIds = [];
    }
  }
  
  const processedData = {
    externalId: formData.get('externalId') as string,
    name: formData.get('name') as string,
    born: bornValue && bornValue.trim() ? parseInt(bornValue) : null,
    died: diedValue && diedValue.trim() ? parseInt(diedValue) : null,
    biologicalSex: formData.get('biologicalSex') as string || 'Unknown',
    notes: notesValue && notesValue.trim() ? notesValue : null,
    father: fatherValue && fatherValue.trim() ? fatherValue : null,
    // monarchIds is the only field for monarch relationships
    monarchIds: monarchIds,
    // monarchDuringLife field removed - no longer stored or generated
    isSuccessionSon: formData.get('isSuccessionSon') === 'on' || false,
    diedYoung: formData.get('diedYoung') === 'on' || false,
    hasMaleChildren: formData.get('hasMaleChildren') === 'on' || false,
    nobleBranch: nobleBranchValue && nobleBranchValue.trim() ? nobleBranchValue : null,
    ageAtDeath: ageAtDeathValue && ageAtDeathValue.trim() ? parseInt(ageAtDeathValue) : null,
  };


  return processedData;
}

/**
 * Process monarch form data into monarch data structure
 */
export function processMonarchFormData(formData: FormData): Monarch {
  return {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    born: formData.get('born') as string,
    died: formData.get('died') as string,
    reignFrom: formData.get('reignFrom') as string,
    reignTo: formData.get('reignTo') as string,
    quote: (formData.get('quote') as string) || undefined,
    about: (formData.get('about') as string) || undefined,
    portraitFileName: (formData.get('portraitFileName') as string) || undefined,
  };
}

/**
 * Enhanced search with validation
 */
export function handleSearchChange(query: string, setSearchQuery: (query: string) => void, toast: any) {
  try {
    if (query.trim()) {
      validateSearchQuery({ query: query.trim() });
    }
    setSearchQuery(query);
  } catch (error) {
    if (error instanceof ValidationError) {
      toast({
        title: 'Invalid Search',
        description: error.userMessage,
        variant: 'destructive',
        duration: 3000
      });
    }
  }
}

/**
 * Calculate monarchs based on family member's lifetime
 */
export function calculateMonarchsForLifetime(
  bornYear: number | null,
  diedYear: number | null,
  monarchs: Monarch[]
): string[] {
  if (!bornYear) return [];

  const bornDate = new Date(`${bornYear}-01-01`);
  const diedDate = diedYear && diedYear !== 9999 
    ? new Date(`${diedYear}-12-31`) 
    : new Date(); // If still alive, use current date

  const overlappingMonarchs = monarchs.filter(monarch => {
    const reignFromDate = new Date(monarch.reignFrom);
    const reignToDate = new Date(monarch.reignTo);
    
    // Check if reign overlaps with lifetime
    return reignFromDate <= diedDate && reignToDate >= bornDate;
  });

  return overlappingMonarchs.map(m => m.id);
}