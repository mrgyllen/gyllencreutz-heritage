/**
 * Validation utilities for admin interface
 * 
 * Extracted from admin-db.tsx to centralize validation logic and improve maintainability.
 * Contains monarch relationship validation and form submission validation.
 */

import { type Monarch } from '@/types/family';
import { ValidationError, validateSearchQuery } from '@/lib/validation';

/**
 * Validate monarch relationships for a family member
 */
export function validateMonarchRelationships(memberData: any, monarchs: Monarch[]) {
  const errors: Record<string, string> = {};
  
  // Validate monarch IDs exist
  if (memberData.monarchIds && memberData.monarchIds.length > 0) {
    const invalidMonarchIds = memberData.monarchIds.filter((id: string) => 
      !monarchs.find(m => m.id === id)
    );
    
    if (invalidMonarchIds.length > 0) {
      errors.monarchIds = `Invalid monarch IDs: ${invalidMonarchIds.join(', ')}`;
    }
  }
  
  // Timeline validation warning (not an error, just a warning)
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
      
      // This is a warning, not a blocking error
      console.warn(`Timeline warning: ${mismatchedNames} may not have reigned during member's lifetime`);
    }
  }
  
  return errors;
}

/**
 * Process form data into member data structure
 */
export function processFamilyMemberFormData(
  formData: FormData, 
  isNew: boolean,
  editingMember: any | null,
  newMemberMonarchIds: string[]
) {
  const bornValue = formData.get('born') as string;
  const diedValue = formData.get('died') as string;
  const monarchValue = formData.get('monarchDuringLife') as string;
  const ageAtDeathValue = formData.get('ageAtDeath') as string;
  
  const notesValue = formData.get('notes') as string;
  const fatherValue = formData.get('father') as string;
  const nobleBranchValue = formData.get('nobleBranch') as string;
  
  return {
    externalId: formData.get('externalId') as string,
    name: formData.get('name') as string,
    born: bornValue && bornValue.trim() ? parseInt(bornValue) : null,
    died: diedValue && diedValue.trim() ? parseInt(diedValue) : null,
    biologicalSex: formData.get('biologicalSex') as string || 'Unknown',
    notes: notesValue && notesValue.trim() ? notesValue : null,
    father: fatherValue && fatherValue.trim() ? fatherValue : null,
    // Keep backward compatibility with monarchDuringLife while using monarchIds
    monarchDuringLife: monarchValue && monarchValue.trim() ? 
      monarchValue.split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0)
        .map(m => m.replace(/\*$/, '').trim()) // Remove trailing asterisks
        .filter(m => m.length > 0) : [],
    monarchIds: isNew ? newMemberMonarchIds : (editingMember?.monarchIds || []), // Use the appropriate monarchIds state
    isSuccessionSon: formData.get('isSuccessionSon') === 'on' || false,
    diedYoung: formData.get('diedYoung') === 'on' || false,
    hasMaleChildren: formData.get('hasMaleChildren') === 'on' || false,
    nobleBranch: nobleBranchValue && nobleBranchValue.trim() ? nobleBranchValue : null,
    ageAtDeath: ageAtDeathValue && ageAtDeathValue.trim() ? parseInt(ageAtDeathValue) : null,
  };
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