import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Save, X, Download, Upload, Database, CheckCircle, AlertCircle, RotateCcw, ArrowLeft, AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { type CosmosDbFamilyMember, type CreateCosmosDbFamilyMember, type ImportStatus, type Monarch } from '@/types/family';
import { AdminErrorBoundary, useErrorHandler } from '@/components/error-boundary';
import { familyApi, monarchsApi } from '@/lib/api';
import { MonarchCard } from '@/components/monarch-card';
import { MonarchSelector } from '@/components/monarch-selector';
import { 
  validateFamilyMember, 
  validateFamilyMemberUpdate, 
  validateSearchQuery,
  safeValidateInput,
  cosmosFamilyMemberSchema,
  createFamilyMemberSchema,
  updateFamilyMemberSchema,
  ValidationError 
} from '@/lib/validation';
import { handleError, ErrorSeverity, createErrorContext } from '@/lib/errors';

/**
 * Enhanced Azure Cosmos DB Administration Interface
 * 
 * Provides comprehensive family member management with:
 * - Input validation using Zod schemas
 * - Error boundaries for graceful error handling
 * - Optimistic updates with proper error recovery
 * - Bulk operations with preview and confirmation
 */
function AdminDbContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<CosmosDbFamilyMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkUpdateResult, setBulkUpdateResult] = useState<any>(null);
  
  // Monarchs management state
  const [monarchSearchQuery, setMonarchSearchQuery] = useState('');
  const [editingMonarch, setEditingMonarch] = useState<Monarch | null>(null);
  const [isAddingNewMonarch, setIsAddingNewMonarch] = useState(false);
  const [monarchValidationErrors, setMonarchValidationErrors] = useState<Record<string, string>>({});
  const [isSubmittingMonarch, setIsSubmittingMonarch] = useState(false);
  
  // New member form state for monarchs
  const [newMemberMonarchIds, setNewMemberMonarchIds] = useState<string[]>([]);
  const [newMemberBornYear, setNewMemberBornYear] = useState<number | null>(null);
  const [newMemberDiedYear, setNewMemberDiedYear] = useState<number | null>(null);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reportError = useErrorHandler('AdminInterface');

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

  // Monarchs data query
  const { data: monarchs = [], isLoading: monarchsLoading, error: monarchsError } = useQuery<Monarch[]>({
    queryKey: ['/api/cosmos/monarchs'],
    queryFn: monarchsApi.getAll,
    retry: (failureCount, error: any) => {
      if (error instanceof ValidationError) return false;
      return failureCount < 3;
    },
  });

  // CRUD mutations with enhanced error handling
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

  const addMemberMutation = useMutation({
    mutationFn: async (member: CreateCosmosDbFamilyMember) => {
      // Validate the data before sending
      console.log('Adding member, data before validation:', member);
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

  // Import data mutation
  const importDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cosmos/import', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to import data');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/import/status'] });
      toast({ 
        title: 'Import Successful', 
        description: `Imported ${data.summary.successful} members successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Import Failed', 
        description: error.message || 'Failed to import data',
        variant: 'destructive' 
      });
    },
  });

  // Clear data mutation (for testing)
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cosmos/import/clear', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear data');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/import/status'] });
      toast({ 
        title: 'Data Cleared', 
        description: `Deleted ${data.deleted} members from Cosmos DB` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Clear Failed', 
        description: error.message || 'Failed to clear data',
        variant: 'destructive' 
      });
    },
  });

  // Restore data mutation from JSON file
  const restoreDataMutation = useMutation({
    mutationFn: async (jsonData: any[]) => {
      const response = await fetch('/api/cosmos/import/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      if (!response.ok) throw new Error('Failed to restore data');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/import/status'] });
      setIsRestoreDialogOpen(false);
      toast({ 
        title: 'Restore Successful', 
        description: `Restored ${data.summary.restored} members successfully` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Restore Failed', 
        description: error.message || 'Failed to restore data',
        variant: 'destructive' 
      });
    },
  });

  // Monarch CRUD mutations
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

  // Enhanced search with validation
  const handleSearchChange = (query: string) => {
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
  };

  // Monarchs bulk update handlers
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

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.externalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMonarchs = monarchs.filter(monarch =>
    monarch.name.toLowerCase().includes(monarchSearchQuery.toLowerCase()) ||
    monarch.id.toLowerCase().includes(monarchSearchQuery.toLowerCase()) ||
    monarch.about?.toLowerCase().includes(monarchSearchQuery.toLowerCase())
  );

  /**
   * Validate monarch relationships for a family member
   */
  const validateMonarchRelationships = (memberData: any) => {
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
  };

  /**
   * Enhanced form submission with comprehensive validation
   */
  const handleSubmit = async (formData: FormData, isNew: boolean = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      const bornValue = formData.get('born') as string;
      const diedValue = formData.get('died') as string;
      const monarchValue = formData.get('monarchDuringLife') as string;
      const ageAtDeathValue = formData.get('ageAtDeath') as string;
      
      const notesValue = formData.get('notes') as string;
      const fatherValue = formData.get('father') as string;
      const nobleBranchValue = formData.get('nobleBranch') as string;
      
      const memberData = {
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

      console.log('Form submission data:', memberData);
      console.log('Monarch array after processing:', memberData.monarchDuringLife);

      // Validate monarch relationships
      const monarchValidationErrors = validateMonarchRelationships(memberData);
      if (Object.keys(monarchValidationErrors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...monarchValidationErrors }));
        setIsSubmitting(false);
        toast({ 
          title: 'Validation Error', 
          description: 'Please fix the monarch relationship errors',
          variant: 'destructive',
          duration: 5000
        });
        return;
      }

      if (isNew) {
        await addMemberMutation.mutateAsync({
          ...memberData,
          id: memberData.externalId, // Use externalId as Cosmos DB id
        });
      } else if (editingMember) {
        const updateData = {
          ...editingMember,
          ...memberData,
        };
        console.log('Update data being sent:', updateData);
        await updateMemberMutation.mutateAsync(updateData);
      }
    } catch (error) {
      // Error handling is done in the mutation onError callbacks
      console.error('Form submission error:', error);
    }
  };

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

  /**
   * Monarch form submission with validation
   */
  const handleMonarchSubmit = async (formData: FormData, isNew: boolean = false) => {
    if (isSubmittingMonarch) return;

    setIsSubmittingMonarch(true);
    setMonarchValidationErrors({});

    try {
      const monarchData: Monarch = {
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

      console.log('Monarch form submission data:', monarchData);

      // Validate monarch data
      const validationErrors = validateMonarchData(monarchData);
      if (Object.keys(validationErrors).length > 0) {
        setMonarchValidationErrors(validationErrors);
        setIsSubmittingMonarch(false);
        toast({ 
          title: 'Validation Error', 
          description: 'Please fix the form errors',
          variant: 'destructive',
          duration: 5000
        });
        return;
      }

      if (isNew) {
        await createMonarchMutation.mutateAsync(monarchData);
      } else if (editingMonarch) {
        await updateMonarchMutation.mutateAsync(monarchData);
      }
    } catch (error) {
      console.error('Monarch form submission error:', error);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(familyMembers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gyllencreutz-cosmos-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleFileRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast({ 
        title: 'Invalid File Type', 
        description: 'Please select a JSON file.',
        variant: 'destructive' 
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(jsonData)) {
          toast({ 
            title: 'Invalid File Format', 
            description: 'The JSON file must contain an array of family members.',
            variant: 'destructive' 
          });
          return;
        }

        // Confirm the restore operation
        const confirmed = confirm(
          `This will completely replace all current Cosmos DB data with ${jsonData.length} members from the backup file.\n\nThis action cannot be undone. Are you sure you want to continue?`
        );

        if (confirmed) {
          restoreDataMutation.mutate(jsonData);
        }
      } catch (error) {
        toast({ 
          title: 'File Parse Error', 
          description: 'Failed to parse the JSON file. Please check the file format.',
          variant: 'destructive' 
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Enhanced loading and error states
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Cosmos DB data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Failed to load family member data. Please check your connection and try again.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] })}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => setLocation('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-primary">Heritage Administration</h1>
          </div>
          <p className="text-muted-foreground">Manage family members, monarchs, and data operations</p>
        </div>
        <Button
          onClick={() => setLocation('/')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Heritage Site
        </Button>
      </div>

      <Tabs defaultValue="family-members" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="family-members" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Family Members
          </TabsTrigger>
          <TabsTrigger value="monarchs" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Monarchs
          </TabsTrigger>
          <TabsTrigger value="data-operations" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Data Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="family-members" className="mt-6">

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <Input
            placeholder="Search by name, external ID, or notes..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-11 h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
            aria-label="Search family members"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{familyMembers.length}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{familyMembers.filter(m => m.isSuccessionSon).length}</div>
            <div className="text-sm text-muted-foreground">Succession Sons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{filteredMembers.length}</div>
            <div className="text-sm text-muted-foreground">Search Results</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{new Set(familyMembers.flatMap(m => m.monarchDuringLife)).size}</div>
            <div className="text-sm text-muted-foreground">Unique Monarchs</div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <Badge variant="outline">{member.externalId}</Badge>
                    {member.isSuccessionSon && (
                      <Badge className="bg-amber-100 text-amber-800">Succession Son</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                    <div>Born: {member.born || '?'}</div>
                    <div>Died: {member.died || 'Living'}</div>
                    {member.biologicalSex && <div>Sex: {member.biologicalSex}</div>}
                    {member.father && <div>Father: {member.father}</div>}
                    {member.monarchDuringLife && member.monarchDuringLife.length > 0 && (
                      <div>Monarch: {Array.isArray(member.monarchDuringLife) ? member.monarchDuringLife.join(', ') : member.monarchDuringLife}</div>
                    )}
                  </div>
                  
                  {member.notes && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {member.notes}
                    </p>
                  )}
                  
                  {member.importedAt && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Imported: {new Date(member.importedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => setEditingMember(member)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${member.name}?`)) {
                        deleteMemberMutation.mutate(member.id);
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={editingMember !== null || isAddingNew} onOpenChange={(open) => {
        if (!open) {
          setEditingMember(null);
          setIsAddingNew(false);
          setValidationErrors({});
          // Clear new member state
          setNewMemberMonarchIds([]);
          setNewMemberBornYear(null);
          setNewMemberDiedYear(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? 'Add New Family Member' : 'Edit Family Member'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData, isAddingNew);
          }} className="space-y-4">
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
                  aria-describedby={validationErrors.externalId ? 'externalId-error' : undefined}
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
                  aria-describedby={validationErrors.name ? 'name-error' : undefined}
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
                  aria-describedby={validationErrors.born ? 'born-error' : undefined}
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
                  aria-describedby={validationErrors.died ? 'died-error' : undefined}
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
                  aria-describedby={validationErrors.father ? 'father-error' : undefined}
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
                  monarchs={monarchs}
                  selectedMonarchIds={isAddingNew ? newMemberMonarchIds : (editingMember?.monarchIds || [])}
                  onSelectionChange={(monarchIds) => {
                    if (isAddingNew) {
                      setNewMemberMonarchIds(monarchIds);
                    } else if (editingMember) {
                      setEditingMember({ ...editingMember, monarchIds });
                    }
                  }}
                  memberBornYear={isAddingNew ? newMemberBornYear : editingMember?.born}
                  memberDiedYear={isAddingNew ? newMemberDiedYear : editingMember?.died}
                  showOnlyTimelineValid={false}
                  showAutoCalculate={true}
                  onAutoCalculate={async () => {
                    const bornYear = isAddingNew ? newMemberBornYear : editingMember?.born;
                    const diedYear = isAddingNew ? newMemberDiedYear : editingMember?.died;
                    
                    if (bornYear) {
                      try {
                        // Calculate monarchs based on lifetime using cosmosClient logic
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

                        const calculatedMonarchIds = overlappingMonarchs.map(m => m.id);
                        
                        if (isAddingNew) {
                          setNewMemberMonarchIds(calculatedMonarchIds);
                        } else if (editingMember) {
                          setEditingMember({ ...editingMember, monarchIds: calculatedMonarchIds });
                        }
                        
                        toast({ 
                          title: 'Auto-calculated', 
                          description: `Found ${calculatedMonarchIds.length} monarchs during lifetime`,
                          duration: 3000 
                        });
                      } catch (error) {
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
                  }}
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
                aria-describedby={validationErrors.notes ? 'notes-error' : undefined}
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
                onClick={() => {
                  setEditingMember(null);
                  setIsAddingNew(false);
                  setValidationErrors({});
                  // Clear new member state
                  setNewMemberMonarchIds([]);
                  setNewMemberBornYear(null);
                  setNewMemberDiedYear(null);
                }}
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
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="monarchs" className="mt-6">
          {monarchsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading monarchs...</p>
              </div>
            </div>
          ) : monarchsError ? (
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Error Loading Monarchs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    Failed to load monarchs data. Please check your connection and try again.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/cosmos/monarchs'] })}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search and Actions */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    placeholder="Search monarchs by name, ID, or description..."
                    value={monarchSearchQuery}
                    onChange={(e) => setMonarchSearchQuery(e.target.value)}
                    className="pl-11 h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                    aria-label="Search monarchs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsAddingNewMonarch(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Monarch
                  </Button>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{monarchs.length}</div>
                    <div className="text-sm text-muted-foreground">Total Monarchs</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{filteredMonarchs.length}</div>
                    <div className="text-sm text-muted-foreground">Search Results</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{monarchs.filter(m => m.portraitFileName).length}</div>
                    <div className="text-sm text-muted-foreground">With Portraits</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">Swedish</div>
                    <div className="text-sm text-muted-foreground">Monarchs</div>
                  </CardContent>
                </Card>
              </div>

              {/* Monarchs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMonarchs.map((monarch) => (
                  <div key={monarch.id} className="relative">
                    <MonarchCard 
                      monarch={monarch}
                      className="h-full"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        onClick={() => setEditingMonarch(monarch)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${monarch.name}?`)) {
                            deleteMonarchMutation.mutate(monarch.id);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMonarchs.length === 0 && (
                <div className="text-center py-12">
                  <Crown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Monarchs Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {monarchSearchQuery ? 'Try adjusting your search terms' : 'Start by adding your first monarch'}
                  </p>
                  {!monarchSearchQuery && (
                    <Button onClick={() => setIsAddingNewMonarch(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Monarch
                    </Button>
                  )}
                </div>
              )}

              {/* Monarch Edit/Add Dialog */}
              <Dialog open={editingMonarch !== null || isAddingNewMonarch} onOpenChange={(open) => {
                if (!open) {
                  setEditingMonarch(null);
                  setIsAddingNewMonarch(false);
                  setMonarchValidationErrors({});
                }
              }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isAddingNewMonarch ? 'Add New Monarch' : 'Edit Monarch'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleMonarchSubmit(formData, isAddingNewMonarch);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monarchId">Monarch ID *</Label>
                        <Input
                          id="monarchId"
                          name="id"
                          defaultValue={editingMonarch?.id || ''}
                          required
                          className={monarchValidationErrors.id ? 'border-red-500' : ''}
                          placeholder="e.g., gustav-i-vasa"
                          aria-describedby={monarchValidationErrors.id ? 'monarchId-error' : undefined}
                        />
                        {monarchValidationErrors.id && (
                          <p id="monarchId-error" className="text-sm text-red-600" role="alert">
                            {monarchValidationErrors.id}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monarchName">Name *</Label>
                        <Input
                          id="monarchName"
                          name="name"
                          defaultValue={editingMonarch?.name || ''}
                          required
                          className={monarchValidationErrors.name ? 'border-red-500' : ''}
                          placeholder="e.g., Gustav I Vasa"
                          aria-describedby={monarchValidationErrors.name ? 'monarchName-error' : undefined}
                        />
                        {monarchValidationErrors.name && (
                          <p id="monarchName-error" className="text-sm text-red-600" role="alert">
                            {monarchValidationErrors.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monarchBorn">Born (ISO Date)</Label>
                        <Input
                          id="monarchBorn"
                          name="born"
                          type="date"
                          defaultValue={editingMonarch?.born || ''}
                          className={monarchValidationErrors.born ? 'border-red-500' : ''}
                          aria-describedby={monarchValidationErrors.born ? 'monarchBorn-error' : undefined}
                        />
                        {monarchValidationErrors.born && (
                          <p id="monarchBorn-error" className="text-sm text-red-600" role="alert">
                            {monarchValidationErrors.born}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monarchDied">Died (ISO Date)</Label>
                        <Input
                          id="monarchDied"
                          name="died"
                          type="date"
                          defaultValue={editingMonarch?.died || ''}
                          className={monarchValidationErrors.died ? 'border-red-500' : ''}
                          aria-describedby={monarchValidationErrors.died ? 'monarchDied-error' : undefined}
                        />
                        {monarchValidationErrors.died && (
                          <p id="monarchDied-error" className="text-sm text-red-600" role="alert">
                            {monarchValidationErrors.died}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reignFrom">Reign From (ISO Date) *</Label>
                        <Input
                          id="reignFrom"
                          name="reignFrom"
                          type="date"
                          defaultValue={editingMonarch?.reignFrom || ''}
                          required
                          className={monarchValidationErrors.reignFrom ? 'border-red-500' : ''}
                          aria-describedby={monarchValidationErrors.reignFrom ? 'reignFrom-error' : undefined}
                        />
                        {monarchValidationErrors.reignFrom && (
                          <p id="reignFrom-error" className="text-sm text-red-600" role="alert">
                            {monarchValidationErrors.reignFrom}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reignTo">Reign To (ISO Date) *</Label>
                        <Input
                          id="reignTo"
                          name="reignTo"
                          type="date"
                          defaultValue={editingMonarch?.reignTo || ''}
                          required
                          className={monarchValidationErrors.reignTo ? 'border-red-500' : ''}
                          aria-describedby={monarchValidationErrors.reignTo ? 'reignTo-error' : undefined}
                        />
                        {monarchValidationErrors.reignTo && (
                          <p id="reignTo-error" className="text-sm text-red-600" role="alert">
                            {monarchValidationErrors.reignTo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portraitFileName">Portrait File Name</Label>
                      <Input
                        id="portraitFileName"
                        name="portraitFileName"
                        defaultValue={editingMonarch?.portraitFileName || ''}
                        className={monarchValidationErrors.portraitFileName ? 'border-red-500' : ''}
                        placeholder="e.g., gustav-vasa-portrait.jpg"
                        aria-describedby={monarchValidationErrors.portraitFileName ? 'portraitFileName-error' : undefined}
                      />
                      {monarchValidationErrors.portraitFileName && (
                        <p id="portraitFileName-error" className="text-sm text-red-600" role="alert">
                          {monarchValidationErrors.portraitFileName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monarchQuote">Famous Quote</Label>
                      <Textarea
                        id="monarchQuote"
                        name="quote"
                        defaultValue={editingMonarch?.quote || ''}
                        rows={2}
                        className={monarchValidationErrors.quote ? 'border-red-500' : ''}
                        placeholder="A famous quote or saying by the monarch..."
                        aria-describedby={monarchValidationErrors.quote ? 'monarchQuote-error' : undefined}
                      />
                      {monarchValidationErrors.quote && (
                        <p id="monarchQuote-error" className="text-sm text-red-600" role="alert">
                          {monarchValidationErrors.quote}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monarchAbout">About / Biography</Label>
                      <Textarea
                        id="monarchAbout"
                        name="about"
                        defaultValue={editingMonarch?.about || ''}
                        rows={4}
                        className={monarchValidationErrors.about ? 'border-red-500' : ''}
                        placeholder="Historical information, achievements, important events during reign..."
                        aria-describedby={monarchValidationErrors.about ? 'monarchAbout-error' : undefined}
                      />
                      {monarchValidationErrors.about && (
                        <p id="monarchAbout-error" className="text-sm text-red-600" role="alert">
                          {monarchValidationErrors.about}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingMonarch(null);
                          setIsAddingNewMonarch(false);
                          setMonarchValidationErrors({});
                        }}
                        disabled={isSubmittingMonarch}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmittingMonarch}
                        className="min-w-[140px]"
                      >
                        {isSubmittingMonarch ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {isAddingNewMonarch ? 'Adding...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {isAddingNewMonarch ? 'Add Monarch' : 'Save Changes'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </TabsContent>

        <TabsContent value="data-operations" className="mt-6">
          {/* Export/Restore Section */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{familyMembers.length}</div>
                  <div className="text-sm text-muted-foreground">Current Records</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">Azure Cosmos DB</div>
                  <div className="text-sm text-muted-foreground">Storage Backend</div>
                </div>
              </div>
              
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Export your data to create local JSON backups, or restore from a previous backup file.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={exportData}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export to JSON
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={restoreDataMutation.isPending}
                  />
                  <Button
                    disabled={restoreDataMutation.isPending}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {restoreDataMutation.isPending ? 'Restoring...' : 'Restore from JSON'}
                  </Button>
                </div>
                <Button
                  onClick={() => clearDataMutation.mutate()}
                  disabled={clearDataMutation.isPending}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {clearDataMutation.isPending ? 'Clearing...' : 'Clear All Data'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Monarchs Bulk Operations */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="w-5 h-5" />
                Monarchs Bulk Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  Update family members with proper monarch relationships based on reign dates. 
                  Use dry-run to preview changes before applying them.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button
                  onClick={handleBulkUpdateMonarchsDryRun}
                  disabled={bulkUpdateMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {bulkUpdateMutation.isPending ? 'Processing...' : 'Dry Run Preview'}
                </Button>
                <Button
                  onClick={handleBulkUpdateMonarchs}
                  disabled={bulkUpdateMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {bulkUpdateMutation.isPending ? 'Updating...' : 'Execute Bulk Update'}
                </Button>
              </div>
              
              {bulkUpdateResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Operation Results:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Total Members:</span> {bulkUpdateResult.total}
                    </div>
                    <div>
                      <span className="font-medium">Processed:</span> {bulkUpdateResult.processed}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {bulkUpdateResult.updated}
                    </div>
                  </div>
                  {bulkUpdateResult.dryRun && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">Dry Run Mode:</span> No changes were made to the database.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Admin database page wrapped with error boundary for graceful error handling
 */
export default function AdminDbPage() {
  return (
    <AdminErrorBoundary>
      <AdminDbContent />
    </AdminErrorBoundary>
  );
}