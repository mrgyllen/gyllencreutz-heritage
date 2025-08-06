/**
 * Custom hook for family members CRUD operations and state management
 * 
 * Extracted from admin-db.tsx to improve maintainability and reusability.
 * Handles all family member related API calls, mutations, and state.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/components/error-boundary';
import { familyApi } from '@/lib/api';
import { type CosmosDbFamilyMember, type CreateCosmosDbFamilyMember, type ImportStatus } from '@/types/family';
import { 
  validateFamilyMember, 
  validateFamilyMemberUpdate, 
  safeValidateInput,
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  ValidationError 
} from '@/lib/validation';

export function useFamilyMembers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<CosmosDbFamilyMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New member form state for monarchs
  const [newMemberMonarchIds, setNewMemberMonarchIds] = useState<string[]>([]);
  const [newMemberBornYear, setNewMemberBornYear] = useState<number | null>(null);
  const [newMemberDiedYear, setNewMemberDiedYear] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reportError = useErrorHandler('FamilyMembersHook');

  // Main data query with error handling
  const { data: familyMembers = [], isLoading, error: queryError } = useQuery<CosmosDbFamilyMember[]>({
    queryKey: ['/api/cosmos/members'],
    queryFn: familyApi.getMembers,
    retry: (failureCount, error: any) => {
      // Don't retry validation errors
      if (error instanceof ValidationError) return false;
      return failureCount < 3;
    },
  });

  // Import status query
  const { data: importStatus } = useQuery<ImportStatus>({
    queryKey: ['/api/cosmos/import/status'],
    queryFn: familyApi.getImportStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (member: CosmosDbFamilyMember) => {
      // Validate the data before sending using update schema (not cosmos schema)
      const { id, _rid, _self, _etag, _attachments, _ts, importedAt, importSource, ...updateData } = member;
      
      
      const validationResult = safeValidateInput(updateFamilyMemberSchema, updateData);
      if (!validationResult.success) {
        console.error('Validation failed:', validationResult.error);
        throw validationResult.error;
      }
      
      
      return await familyApi.updateMember(member.id, validationResult.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      toast({ 
        title: 'Success', 
        description: 'Family member updated successfully',
        duration: 3000 
      });
      setEditingMember(null);
      setValidationErrors({});
      setIsSubmitting(false);
    },
    onError: (error) => {
      setIsSubmitting(false);
      if (error instanceof ValidationError) {
        // Handle validation errors by showing field-specific messages
        const fieldErrors: Record<string, string> = {};
        if (error.field) {
          fieldErrors[error.field] = error.userMessage;
        }
        setValidationErrors(fieldErrors);
        toast({ 
          title: 'Validation Error', 
          description: error.userMessage, 
          variant: 'destructive',
          duration: 5000
        });
      } else {
        reportError(error, 'updateMember');
        setValidationErrors({});
      }
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (member: CreateCosmosDbFamilyMember) => {
      // Validate the data before sending
      const validationResult = safeValidateInput(createFamilyMemberSchema, member);
      if (!validationResult.success) {
        console.error('Add member validation failed:', validationResult.error);
        throw validationResult.error;
      }
      
      return await familyApi.createMember(validationResult.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      toast({ 
        title: 'Success', 
        description: 'Family member added successfully',
        duration: 3000 
      });
      setIsAddingNew(false);
      setValidationErrors({});
      setIsSubmitting(false);
      // Clear new member state
      setNewMemberMonarchIds([]);
      setNewMemberBornYear(null);
      setNewMemberDiedYear(null);
    },
    onError: (error) => {
      setIsSubmitting(false);
      if (error instanceof ValidationError) {
        const fieldErrors: Record<string, string> = {};
        if (error.field) {
          fieldErrors[error.field] = error.userMessage;
        }
        setValidationErrors(fieldErrors);
        toast({ 
          title: 'Validation Error', 
          description: error.userMessage, 
          variant: 'destructive',
          duration: 5000
        });
      } else {
        reportError(error, 'addMember');
        setValidationErrors({});
      }
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await familyApi.deleteMember(id);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      toast({ 
        title: 'Success', 
        description: 'Family member deleted successfully',
        duration: 3000 
      });
    },
    onError: (error) => {
      reportError(error, 'deleteMember');
    },
  });

  // Filtered members based on search
  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.externalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions
  const startEditing = (member: CosmosDbFamilyMember) => {
    setEditingMember(member);
    setValidationErrors({});
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setValidationErrors({});
    setNewMemberMonarchIds([]);
    setNewMemberBornYear(null);
    setNewMemberDiedYear(null);
  };

  const cancelEditing = () => {
    setEditingMember(null);
    setIsAddingNew(false);
    setValidationErrors({});
    setNewMemberMonarchIds([]);
    setNewMemberBornYear(null);
    setNewMemberDiedYear(null);
  };

  const deleteMember = async (member: CosmosDbFamilyMember) => {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      await deleteMemberMutation.mutateAsync(member.id);
    }
  };

  return {
    // Data
    familyMembers,
    filteredMembers,
    importStatus,
    isLoading,
    queryError,
    
    // State
    searchQuery,
    setSearchQuery,
    editingMember,
    isAddingNew,
    validationErrors,
    setValidationErrors,
    isSubmitting,
    setIsSubmitting,
    
    // New member state
    newMemberMonarchIds,
    setNewMemberMonarchIds,
    newMemberBornYear,
    setNewMemberBornYear,
    newMemberDiedYear,
    setNewMemberDiedYear,
    
    // Mutations
    updateMemberMutation,
    addMemberMutation,
    deleteMemberMutation,
    
    // Helper functions
    startEditing,
    startAddingNew,
    cancelEditing,
    deleteMember,
  };
}