import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Save, X, Download, Upload, Database, CheckCircle, AlertCircle, RotateCcw, ArrowLeft, AlertTriangle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { type CosmosDbFamilyMember, type CreateCosmosDbFamilyMember, type ImportStatus } from '@/types/family';
import { AdminErrorBoundary, useErrorHandler } from '@/components/error-boundary';
import { familyApi } from '@/lib/api';
import { 
  validateFamilyMember, 
  validateFamilyMemberUpdate, 
  validateSearchQuery,
  safeValidateInput,
  cosmosFamilyMemberSchema,
  createFamilyMemberSchema,
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

  // CRUD mutations with enhanced error handling
  const updateMemberMutation = useMutation({
    mutationFn: async (member: CosmosDbFamilyMember) => {
      // Validate the data before sending
      const validationResult = safeValidateInput(cosmosFamilyMemberSchema, member);
      if (!validationResult.success) {
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
      const validationResult = safeValidateInput(createFamilyMemberSchema, member);
      if (!validationResult.success) {
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

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.externalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        born: bornValue ? parseInt(bornValue) : null,
        died: diedValue ? parseInt(diedValue) : null,
        biologicalSex: formData.get('biologicalSex') as string || 'Unknown',
        notes: notesValue || null,
        father: fatherValue || null,
        monarchDuringLife: monarchValue ? monarchValue.split(',').map(m => m.trim()) : [],
        isSuccessionSon: formData.get('isSuccessionSon') === 'on' || false,
        diedYoung: formData.get('diedYoung') === 'on' || false,
        hasMaleChildren: formData.get('hasMaleChildren') === 'on' || false,
        nobleBranch: nobleBranchValue || null,
        ageAtDeath: ageAtDeathValue ? parseInt(ageAtDeathValue) : null,
      };

      if (isNew) {
        await addMemberMutation.mutateAsync({
          ...memberData,
          id: memberData.externalId, // Use externalId as Cosmos DB id
        });
      } else if (editingMember) {
        await updateMemberMutation.mutateAsync({
          ...editingMember,
          ...memberData,
        });
      }
    } catch (error) {
      // Error handling is done in the mutation onError callbacks
      console.error('Form submission error:', error);
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
            <h1 className="text-3xl font-bold text-primary">Cosmos DB Family Administration</h1>
          </div>
          <p className="text-muted-foreground">Manage family member information stored in Azure Cosmos DB</p>
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
                <Label htmlFor="monarchDuringLife">Monarch During Life</Label>
                <Input
                  id="monarchDuringLife"
                  name="monarchDuringLife"
                  defaultValue={editingMember?.monarchDuringLife?.join(', ') || ''}
                  className={validationErrors.monarchDuringLife ? 'border-red-500' : ''}
                  placeholder="e.g., Gustav Vasa, Erik XIV"
                  aria-describedby={validationErrors.monarchDuringLife ? 'monarchDuringLife-error' : undefined}
                />
                {validationErrors.monarchDuringLife && (
                  <p id="monarchDuringLife-error" className="text-sm text-red-600" role="alert">
                    {validationErrors.monarchDuringLife}
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