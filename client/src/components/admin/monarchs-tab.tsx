/**
 * Monarchs Tab Component
 * 
 * Extracted from admin-db.tsx to improve maintainability.
 * Handles the monarchs management interface including search, grid, and form.
 */

import React from 'react';
import { Search, Plus, Edit, Trash2, RotateCcw, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MonarchCard } from '@/components/monarch-card';
import { MonarchForm } from '@/components/admin/monarch-form';
import { useMonarchs } from '@/hooks/use-monarchs';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function MonarchsTab() {
  const {
    monarchs,
    filteredMonarchs,
    monarchsLoading,
    monarchsError,
    monarchSearchQuery,
    setMonarchSearchQuery,
    editingMonarch,
    isAddingNewMonarch,
    monarchValidationErrors,
    setMonarchValidationErrors,
    isSubmittingMonarch,
    setIsSubmittingMonarch,
    createMonarchMutation,
    updateMonarchMutation,
    deleteMonarchMutation,
    validateMonarchData,
    startEditingMonarch,
    startAddingNewMonarch,
    cancelMonarchEditing,
    deleteMonarch,
  } = useMonarchs();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Monarch form submission with validation
   */
  const handleMonarchSubmit = async (monarchData: any, isNew: boolean = false) => {
    try {
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

  if (monarchsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monarchs...</p>
        </div>
      </div>
    );
  }

  if (monarchsError) {
    return (
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
    );
  }

  return (
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
            onClick={startAddingNewMonarch}
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
                onClick={() => startEditingMonarch(monarch)}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => deleteMonarch(monarch)}
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
            <Button onClick={startAddingNewMonarch}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Monarch
            </Button>
          )}
        </div>
      )}

      {/* Monarch Edit/Add Dialog */}
      <Dialog open={editingMonarch !== null || isAddingNewMonarch} onOpenChange={(open) => {
        if (!open) {
          cancelMonarchEditing();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingNewMonarch ? 'Add New Monarch' : 'Edit Monarch'}
            </DialogTitle>
            <DialogDescription>
              {isAddingNewMonarch 
                ? 'Create a new Swedish monarch with reign dates and biographical information.'
                : 'Modify the selected monarch\'s information including reign dates and biography.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <MonarchForm
            editingMonarch={editingMonarch}
            isAddingNewMonarch={isAddingNewMonarch}
            monarchValidationErrors={monarchValidationErrors}
            setMonarchValidationErrors={setMonarchValidationErrors}
            isSubmittingMonarch={isSubmittingMonarch}
            setIsSubmittingMonarch={setIsSubmittingMonarch}
            onSubmit={handleMonarchSubmit}
            onCancel={cancelMonarchEditing}
            validateMonarchData={validateMonarchData}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}