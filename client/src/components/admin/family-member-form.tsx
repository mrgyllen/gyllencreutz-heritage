/**
 * Family Member Form Component
 * 
 * Extracted from admin-db.tsx to improve maintainability.
 * Handles the creation and editing of family members with validation.
 */

import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MonarchSelector } from '@/components/monarch-selector';
import { useMonarchTimeline } from '@/hooks/use-monarch-timeline';
import { type CosmosDbFamilyMember, type Monarch } from '@/types/family';
import { useToast } from '@/hooks/use-toast';
import { 
  processFamilyMemberFormData, 
  validateMonarchRelationships,
  calculateMonarchsForLifetime 
} from '@/lib/admin-validation-utils';
import { convertMonarchNamesToIds } from '@/lib/data-migration-utils';

interface FamilyMemberFormProps {
  editingMember: CosmosDbFamilyMember | null;
  isAddingNew: boolean;
  monarchs: Monarch[];
  validationErrors: Record<string, string>;
  setValidationErrors: (errors: Record<string, string>) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  newMemberMonarchIds: string[];
  setNewMemberMonarchIds: (ids: string[]) => void;
  newMemberBornYear: number | null;
  setNewMemberBornYear: (year: number | null) => void;
  newMemberDiedYear: number | null;
  setNewMemberDiedYear: (year: number | null) => void;
  setEditingMember: (member: CosmosDbFamilyMember | null) => void;
  onSubmit: (memberData: any, isNew: boolean) => Promise<void>;
  onCancel: () => void;
}

/**
 * Get effective monarch IDs for display, handling legacy data migration
 */
function getEffectiveMonarchIds(editingMember: CosmosDbFamilyMember | null, monarchs: Monarch[]): string[] {
  if (!editingMember) return [];
  
  // If member has monarchIds, use them directly
  if (editingMember.monarchIds && editingMember.monarchIds.length > 0) {
    return editingMember.monarchIds;
  }
  
  // Legacy fallback: if member has monarchDuringLife but no monarchIds, convert on-the-fly for display
  if (editingMember.monarchDuringLife && editingMember.monarchDuringLife.length > 0) {
    const convertedIds = convertMonarchNamesToIds(editingMember.monarchDuringLife, monarchs);
    console.log(`Legacy display conversion for ${editingMember.name}: ${editingMember.monarchDuringLife} → ${convertedIds}`);
    return convertedIds;
  }
  
  return [];
}

export function FamilyMemberForm({
  editingMember,
  isAddingNew,
  monarchs,
  validationErrors,
  setValidationErrors,
  isSubmitting,
  setIsSubmitting,
  newMemberMonarchIds,
  setNewMemberMonarchIds,
  newMemberBornYear,
  setNewMemberBornYear,
  newMemberDiedYear,
  setNewMemberDiedYear,
  setEditingMember,
  onSubmit,
  onCancel,
}: FamilyMemberFormProps) {
  const { toast } = useToast();
  
  // Local state to track monarch IDs for the form (both new and editing)
  const [localMonarchIds, setLocalMonarchIds] = useState<string[]>([]);
  
  // Get timeline validation data for monarch selection
  const memberBornYear = isAddingNew ? newMemberBornYear : editingMember?.born;
  const memberDiedYear = isAddingNew ? newMemberDiedYear : editingMember?.died;
  const { timelineValidMonarchs } = useMonarchTimeline({
    memberId: editingMember?.externalId,
    memberBornYear,
    memberDiedYear
  });
  const timelineValidMonarchIds = timelineValidMonarchs.map(m => m.id);
  
  // Initialize local monarch IDs when component mounts or editingMember changes
  useEffect(() => {
    if (isAddingNew) {
      setLocalMonarchIds(newMemberMonarchIds);
    } else if (editingMember) {
      setLocalMonarchIds(getEffectiveMonarchIds(editingMember, monarchs));
    } else {
      setLocalMonarchIds([]);
    }
  }, [editingMember, isAddingNew, newMemberMonarchIds, monarchs]);
  
  // Handle monarch selection changes
  const handleMonarchSelectionChange = (monarchIds: string[]) => {
    setLocalMonarchIds(monarchIds);
    
    if (isAddingNew) {
      setNewMemberMonarchIds(monarchIds);
    } else if (editingMember) {
      setEditingMember({ ...editingMember, monarchIds });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const memberData = processFamilyMemberFormData(
        formData, 
        isAddingNew, 
        editingMember, 
        isAddingNew ? newMemberMonarchIds || [] : localMonarchIds,
        monarchs
      );


      // Validate monarch relationships
      const monarchValidationErrors = validateMonarchRelationships(memberData, monarchs);
      if (Object.keys(monarchValidationErrors).length > 0) {
        setValidationErrors({ ...validationErrors, ...monarchValidationErrors });
        setIsSubmitting(false);
        toast({ 
          title: 'Validation Error', 
          description: 'Please fix the monarch relationship errors',
          variant: 'destructive',
          duration: 5000
        });
        return;
      }

      await onSubmit(memberData, isAddingNew);
    } catch (error) {
      console.error('Form submission error:', error);
      setIsSubmitting(false);
    }
  };

  const handleAutoCalculateMonarchs = async () => {
    if (memberBornYear) {
      try {
        // Use the timeline-valid monarch IDs from the hook (backend-calculated)
        handleMonarchSelectionChange(timelineValidMonarchIds);
        
        toast({ 
          title: 'Auto-calculated', 
          description: `Selected ${timelineValidMonarchIds.length} monarchs that reigned during lifetime. Click Save to persist changes.`,
          duration: 4000 
        });
      } catch (error) {
        console.error('Auto-calculate failed:', error);
        toast({ 
          title: 'Auto-calculate failed', 
          description: 'Could not calculate monarchs for this member',
          variant: 'destructive',
          duration: 3000 
        });
      }
    } else {
      toast({ 
        title: 'Birth year required', 
        description: 'Please enter a birth year to auto-calculate monarchs',
        variant: 'destructive',
        duration: 3000 
      });
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="externalId">External ID *</Label>
          <Input
            id="externalId"
            name="externalId"
            defaultValue={editingMember?.externalId || ''}
            required
            className={validationErrors.externalId ? 'border-red-500' : ''}
            placeholder="e.g., 0, 0.1, 1.2.3"
            {...(validationErrors.externalId && { 'aria-describedby': 'externalId-error' })}
          />
          {validationErrors.externalId && (
            <p id="externalId-error" className="text-sm text-red-600" role="alert">
              {validationErrors.externalId}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={editingMember?.name || ''}
            required
            className={validationErrors.name ? 'border-red-500' : ''}
            placeholder="e.g., Lars Tygesson"
            {...(validationErrors.name && { 'aria-describedby': 'name-error' })}
          />
          {validationErrors.name && (
            <p id="name-error" className="text-sm text-red-600" role="alert">
              {validationErrors.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="born">Born</Label>
          <Input
            id="born"
            name="born"
            type="number"
            defaultValue={editingMember?.born || ''}
            className={validationErrors.born ? 'border-red-500' : ''}
            placeholder="e.g., 1515"
            {...(validationErrors.born && { 'aria-describedby': 'born-error' })}
            onChange={(e) => {
              const year = e.target.value ? parseInt(e.target.value) : null;
              if (isAddingNew) {
                setNewMemberBornYear(year);
              }
            }}
          />
          {validationErrors.born && (
            <p id="born-error" className="text-sm text-red-600" role="alert">
              {validationErrors.born}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="died">Died</Label>
          <Input
            id="died"
            name="died"
            type="number"
            defaultValue={editingMember?.died || ''}
            className={validationErrors.died ? 'border-red-500' : ''}
            placeholder="e.g., 1560"
            {...(validationErrors.died && { 'aria-describedby': 'died-error' })}
            onChange={(e) => {
              const year = e.target.value ? parseInt(e.target.value) : null;
              if (isAddingNew) {
                setNewMemberDiedYear(year);
              }
            }}
          />
          {validationErrors.died && (
            <p id="died-error" className="text-sm text-red-600" role="alert">
              {validationErrors.died}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="biologicalSex">Biological Sex</Label>
          <Select name="biologicalSex" defaultValue={editingMember?.biologicalSex || 'Unknown'}>
            <SelectTrigger className={validationErrors.biologicalSex ? 'border-red-500' : ''}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.biologicalSex && (
            <p className="text-sm text-red-600" role="alert">
              {validationErrors.biologicalSex}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="father">Father</Label>
          <Input
            id="father"
            name="father"
            defaultValue={editingMember?.father || ''}
            className={validationErrors.father ? 'border-red-500' : ''}
            placeholder="e.g., Lars Tygesson"
            {...(validationErrors.father && { 'aria-describedby': 'father-error' })}
          />
          {validationErrors.father && (
            <p id="father-error" className="text-sm text-red-600" role="alert">
              {validationErrors.father}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="monarchDuringLife">Monarchs During Life</Label>
          <MonarchSelector
            allMonarchs={monarchs}
            timelineValidMonarchIds={timelineValidMonarchIds}
            selectedMonarchIds={localMonarchIds}
            onSelectionChange={handleMonarchSelectionChange}
            memberBornYear={memberBornYear}
            memberDiedYear={memberDiedYear}
            showAutoCalculate={true}
            onAutoCalculate={handleAutoCalculateMonarchs}
            className={validationErrors.monarchIds ? 'border-red-500' : ''}
            placeholder="Search and select monarchs..."
          />
          {validationErrors.monarchIds && (
            <p className="text-sm text-red-600" role="alert">
              {validationErrors.monarchIds}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={editingMember?.notes || ''}
          rows={3}
          className={validationErrors.notes ? 'border-red-500' : ''}
          placeholder="Biographical information, achievements, historical context..."
          {...(validationErrors.notes && { 'aria-describedby': 'notes-error' })}
        />
        {validationErrors.notes && (
          <p id="notes-error" className="text-sm text-red-600" role="alert">
            {validationErrors.notes}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isSuccessionSon"
          name="isSuccessionSon"
          defaultChecked={editingMember?.isSuccessionSon || false}
        />
        <Label htmlFor="isSuccessionSon">Succession Son</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isAddingNew ? 'Adding...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isAddingNew ? 'Add Member' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}