/**
 * Custom hook for monarchs CRUD operations and state management
 * 
 * Extracted from admin-db.tsx to improve maintainability and reusability.
 * Handles all monarch related API calls, mutations, and state.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/components/error-boundary';
import { monarchsApi, familyApi } from '@/lib/api';
import { type Monarch } from '@/types/family';
import { ValidationError } from '@/lib/validation';

export function useMonarchs() {
  const [monarchSearchQuery, setMonarchSearchQuery] = useState('');
  const [editingMonarch, setEditingMonarch] = useState<Monarch | null>(null);
  const [isAddingNewMonarch, setIsAddingNewMonarch] = useState(false);
  const [monarchValidationErrors, setMonarchValidationErrors] = useState<Record<string, string>>({});
  const [isSubmittingMonarch, setIsSubmittingMonarch] = useState(false);
  const [bulkUpdateResult, setBulkUpdateResult] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reportError = useErrorHandler('MonarchsHook');

  // Monarchs data query
  const { data: monarchs = [], isLoading: monarchsLoading, error: monarchsError } = useQuery<Monarch[]>({
    queryKey: ['/api/cosmos/monarchs'],
    queryFn: monarchsApi.getAll,
    retry: (failureCount, error: any) => {
      if (error instanceof ValidationError) return false;
      return failureCount < 3;
    },
  });

  // Create monarch mutation
  const createMonarchMutation = useMutation({
    mutationFn: async (monarchData: Monarch) => {
      return await monarchsApi.createMonarch(monarchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/monarchs'] });
      toast({ 
        title: 'Success', 
        description: 'Monarch created successfully',
        duration: 3000 
      });
      setIsAddingNewMonarch(false);
      setMonarchValidationErrors({});
      setIsSubmittingMonarch(false);
    },
    onError: (error) => {
      setIsSubmittingMonarch(false);
      if (error instanceof ValidationError) {
        const fieldErrors: Record<string, string> = {};
        if (error.field) {
          fieldErrors[error.field] = error.userMessage;
        }
        setMonarchValidationErrors(fieldErrors);
        toast({ 
          title: 'Validation Error', 
          description: error.userMessage, 
          variant: 'destructive',
          duration: 5000
        });
      } else {
        reportError(error, 'createMonarch');
        setMonarchValidationErrors({});
      }
    },
  });

  // Update monarch mutation
  const updateMonarchMutation = useMutation({
    mutationFn: async (monarch: Monarch) => {
      return await monarchsApi.updateMonarch(monarch.id, monarch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/monarchs'] });
      toast({ 
        title: 'Success', 
        description: 'Monarch updated successfully',
        duration: 3000 
      });
      setEditingMonarch(null);
      setMonarchValidationErrors({});
      setIsSubmittingMonarch(false);
    },
    onError: (error) => {
      setIsSubmittingMonarch(false);
      if (error instanceof ValidationError) {
        const fieldErrors: Record<string, string> = {};
        if (error.field) {
          fieldErrors[error.field] = error.userMessage;
        }
        setMonarchValidationErrors(fieldErrors);
        toast({ 
          title: 'Validation Error', 
          description: error.userMessage, 
          variant: 'destructive',
          duration: 5000
        });
      } else {
        reportError(error, 'updateMonarch');
        setMonarchValidationErrors({});
      }
    },
  });

  // Delete monarch mutation
  const deleteMonarchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await monarchsApi.deleteMonarch(id);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/monarchs'] });
      toast({ 
        title: 'Success', 
        description: 'Monarch deleted successfully',
        duration: 3000 
      });
    },
    onError: (error) => {
      reportError(error, 'deleteMonarch');
    },
  });

  // Bulk update monarchs mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (options: { dryRun: boolean }) => {
      if (options.dryRun) {
        return await familyApi.bulkUpdateMonarchsDryRun();
      } else {
        return await familyApi.bulkUpdateMonarchs();
      }
    },
    onSuccess: (data) => {
      setBulkUpdateResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      
      if (data.data.dryRun) {
        toast({ 
          title: 'Dry Run Complete', 
          description: `Preview: ${data.data.updated} of ${data.data.processed} members would be updated` 
        });
      } else {
        toast({ 
          title: 'Bulk Update Complete', 
          description: `Updated ${data.data.updated} of ${data.data.processed} members with monarch IDs` 
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: 'Bulk Update Failed', 
        description: error.message || 'Failed to update members with monarch IDs',
        variant: 'destructive' 
      });
    },
  });

  // Filtered monarchs based on search
  const filteredMonarchs = monarchs.filter(monarch =>
    monarch.name.toLowerCase().includes(monarchSearchQuery.toLowerCase()) ||
    monarch.id.toLowerCase().includes(monarchSearchQuery.toLowerCase()) ||
    monarch.about?.toLowerCase().includes(monarchSearchQuery.toLowerCase())
  );

  /**
   * Validate monarch data
   */
  const validateMonarchData = (monarchData: Monarch) => {
    const errors: Record<string, string> = {};
    
    // Validate required fields
    if (!monarchData.id || !monarchData.id.trim()) {
      errors.id = 'Monarch ID is required';
    } else if (monarchs.find(m => m.id === monarchData.id && m.id !== editingMonarch?.id)) {
      errors.id = 'Monarch ID must be unique';
    }
    
    if (!monarchData.name || !monarchData.name.trim()) {
      errors.name = 'Monarch name is required';
    }
    
    if (!monarchData.reignFrom) {
      errors.reignFrom = 'Reign start date is required';
    }
    
    if (!monarchData.reignTo) {
      errors.reignTo = 'Reign end date is required';
    }
    
    // Validate date logic
    if (monarchData.reignFrom && monarchData.reignTo) {
      const reignFromDate = new Date(monarchData.reignFrom);
      const reignToDate = new Date(monarchData.reignTo);
      
      if (reignFromDate >= reignToDate) {
        errors.reignTo = 'Reign end date must be after reign start date';
      }
    }
    
    if (monarchData.born && monarchData.died) {
      const bornDate = new Date(monarchData.born);
      const diedDate = new Date(monarchData.died);
      
      if (bornDate >= diedDate) {
        errors.died = 'Death date must be after birth date';
      }
    }
    
    // Validate reign vs life dates
    if (monarchData.born && monarchData.reignFrom) {
      const bornDate = new Date(monarchData.born);
      const reignFromDate = new Date(monarchData.reignFrom);
      
      if (reignFromDate < bornDate) {
        errors.reignFrom = 'Reign cannot start before birth';
      }
    }
    
    if (monarchData.died && monarchData.reignTo) {
      const diedDate = new Date(monarchData.died);
      const reignToDate = new Date(monarchData.reignTo);
      
      if (reignToDate > diedDate) {
        errors.reignTo = 'Reign cannot end after death';
      }
    }
    
    return errors;
  };

  // Helper functions
  const startEditingMonarch = (monarch: Monarch) => {
    setEditingMonarch(monarch);
    setMonarchValidationErrors({});
  };

  const startAddingNewMonarch = () => {
    setIsAddingNewMonarch(true);
    setMonarchValidationErrors({});
  };

  const cancelMonarchEditing = () => {
    setEditingMonarch(null);
    setIsAddingNewMonarch(false);
    setMonarchValidationErrors({});
  };

  const deleteMonarch = async (monarch: Monarch) => {
    if (confirm(`Are you sure you want to delete ${monarch.name}?`)) {
      await deleteMonarchMutation.mutateAsync(monarch.id);
    }
  };

  const handleBulkUpdateMonarchsDryRun = () => {
    bulkUpdateMutation.mutate({ dryRun: true });
  };

  const handleBulkUpdateMonarchs = () => {
    const confirmed = confirm(
      'This will update all family members with proper monarch relationships based on reign dates. ' +
      'This operation cannot be undone. Are you sure you want to continue?'
    );
    
    if (confirmed) {
      bulkUpdateMutation.mutate({ dryRun: false });
    }
  };

  return {
    // Data
    monarchs,
    filteredMonarchs,
    monarchsLoading,
    monarchsError,
    bulkUpdateResult,
    
    // State
    monarchSearchQuery,
    setMonarchSearchQuery,
    editingMonarch,
    isAddingNewMonarch,
    monarchValidationErrors,
    setMonarchValidationErrors,
    isSubmittingMonarch,
    setIsSubmittingMonarch,
    
    // Mutations
    createMonarchMutation,
    updateMonarchMutation,
    deleteMonarchMutation,
    bulkUpdateMutation,
    
    // Helper functions
    validateMonarchData,
    startEditingMonarch,
    startAddingNewMonarch,
    cancelMonarchEditing,
    deleteMonarch,
    handleBulkUpdateMonarchsDryRun,
    handleBulkUpdateMonarchs,
  };
}