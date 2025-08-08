/**
 * Family Members Tab Component
 * 
 * Extracted from admin-db.tsx to improve maintainability.
 * Handles the family members management interface including search, list, and form.
 */

import React from 'react';
import { Search, Plus, Edit, Trash2, RotateCcw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type CosmosDbFamilyMember, type Monarch } from '@/types/family';
import { FamilyMemberForm } from '@/components/admin/family-member-form';
import { useFamilyMembers } from '@/hooks/use-family-members';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { handleSearchChange } from '@/lib/admin-validation-utils';
import { useToast } from '@/hooks/use-toast';

interface FamilyMembersTabProps {
  monarchs: Monarch[];
}

export function FamilyMembersTab({ monarchs }: FamilyMembersTabProps) {
  const {
    familyMembers,
    filteredMembers,
    importStatus,
    isLoading,
    queryError,
    searchQuery,
    setSearchQuery,
    editingMember,
    isAddingNew,
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
    updateMemberMutation,
    addMemberMutation,
    deleteMemberMutation,
    startEditing,
    startAddingNew,
    cancelEditing,
    deleteMember,
  } = useFamilyMembers();

  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /**
   * Enhanced form submission with comprehensive validation
   */
  const handleSubmit = async (memberData: any, isNew: boolean = false) => {
    try {
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
        await updateMemberMutation.mutateAsync(updateData);
      }
    } catch (error) {
      // Error handling is done in the mutation onError callbacks
      console.error('Form submission error:', error);
    }
  };

  // Enhanced loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Cosmos DB data...</p>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
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
    );
  }

  return (
    <>
      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <Input
            placeholder="Search by name, external ID, or notes..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value, setSearchQuery, toast)}
            className="pl-11 h-10 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
            aria-label="Search family members"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={startAddingNew}
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
                    onClick={() => startEditing(member)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => deleteMember(member)}
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
          cancelEditing();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? 'Add New Family Member' : 'Edit Family Member'}
            </DialogTitle>
            <DialogDescription>
              {isAddingNew 
                ? 'Add a new member to the Gyllencreutz family tree with biographical information and relationships.'
                : 'Modify the selected family member\'s biographical information and relationships.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <FamilyMemberForm
            editingMember={editingMember}
            isAddingNew={isAddingNew}
            monarchs={monarchs}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            newMemberMonarchIds={newMemberMonarchIds}
            setNewMemberMonarchIds={setNewMemberMonarchIds}
            newMemberBornYear={newMemberBornYear}
            setNewMemberBornYear={setNewMemberBornYear}
            newMemberDiedYear={newMemberDiedYear}
            setNewMemberDiedYear={setNewMemberDiedYear}
            setEditingMember={(member) => {
              // This is handled by the hook, but we need to pass it for the form
              if (editingMember && member) {
                // Update editing member with monarch changes
                startEditing({ ...editingMember, ...member });
              }
            }}
            onSubmit={handleSubmit}
            onCancel={cancelEditing}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}