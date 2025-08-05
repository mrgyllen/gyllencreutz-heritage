/**
 * Data Operations Tab Component
 * 
 * Extracted from admin-db.tsx to improve maintainability.
 * Handles data import/export, bulk operations, and monarch relationship updates.
 */

import React, { useState } from 'react';
import { Download, Upload, Database, CheckCircle, AlertCircle, Trash2, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useMonarchs } from '@/hooks/use-monarchs';
import { type CosmosDbFamilyMember, type Monarch } from '@/types/family';
import { 
  generateMigrationReport, 
  migrateAllFamilyMembers, 
  validateMonarchIds
} from '@/lib/data-migration-utils';

interface DataOperationsTabProps {
  familyMembers: CosmosDbFamilyMember[];
  monarchs: Monarch[];
}

export function DataOperationsTab({ familyMembers, monarchs }: DataOperationsTabProps) {
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [migrationReport, setMigrationReport] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    bulkUpdateResult,
    bulkUpdateMutation,
    handleBulkUpdateMonarchsDryRun,
    handleBulkUpdateMonarchs,
  } = useMonarchs();

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

  // Generate migration report
  const handleGenerateMigrationReport = () => {
    if (monarchs.length === 0) {
      toast({
        title: 'Monarchs Data Required',
        description: 'Please load monarchs data before running migration analysis',
        variant: 'destructive'
      });
      return;
    }
    
    const report = generateMigrationReport(familyMembers, monarchs);
    setMigrationReport(report);
    
    toast({
      title: 'Migration Report Generated',
      description: `Found ${report.membersNeedingMigration} members needing migration`
    });
  };

  // Run data migration
  const runDataMigration = useMutation({
    mutationFn: async () => {
      const migratedMembers = migrateAllFamilyMembers(familyMembers, monarchs);
      
      // Update each member via API
      const updatePromises = migratedMembers.map(member => {
        if (member.monarchIds && member.monarchIds.length > 0) {
          return fetch(`/api/cosmos/members/${member.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member)
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      return migratedMembers.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      setMigrationReport(null);
      toast({
        title: 'Migration Complete',
        description: `Successfully migrated ${count} family members to use monarch IDs`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Migration Failed',
        description: error.message || 'Failed to migrate data',
        variant: 'destructive'
      });
    }
  });

  const handleRunMigration = () => {
    const confirmed = confirm(
      'This will update all family members to use monarch IDs instead of monarch names. ' +
      'This action cannot be undone. Are you sure you want to continue?'
    );
    
    if (confirmed) {
      runDataMigration.mutate();
    }
  };

  return (
    <>
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

      {/* Data Migration Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="w-5 h-5" />
            Data Migration: Names to IDs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Migrate monarch relationships from name-based storage to ID-based storage for better data integrity.
              This will convert monarch names like "Gustav Vasa (1523–1560)" to monarch IDs like "gustav-i-vasa".
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button
              onClick={handleGenerateMigrationReport}
              disabled={runDataMigration.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Generate Migration Report
            </Button>
            <Button
              onClick={handleRunMigration}
              disabled={runDataMigration.isPending || !migrationReport}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {runDataMigration.isPending ? 'Migrating...' : 'Run Migration'}
            </Button>
          </div>
          
          {migrationReport && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Migration Analysis:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <span className="font-medium">Total Members:</span> {migrationReport.totalMembers}
                </div>
                <div>
                  <span className="font-medium">Need Migration:</span> {migrationReport.membersNeedingMigration}
                </div>
                <div>
                  <span className="font-medium">Already Migrated:</span> {migrationReport.membersAlreadyMigrated}
                </div>
              </div>
              
              {migrationReport.migrationDetails.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-sm mb-2">Members to be migrated:</h5>
                  <div className="max-h-48 overflow-y-auto text-xs">
                    {migrationReport.migrationDetails.slice(0, 10).map((detail: any, index: number) => (
                      <div key={index} className="mb-2 p-2 bg-background rounded border">
                        <div className="font-medium">{detail.memberName} ({detail.externalId})</div>
                        <div className="text-muted-foreground">
                          {detail.resolvedMonarchIds.length} monarch IDs resolved
                          {detail.unresolvedNames.length > 0 && (
                            <span className="text-orange-600 ml-2">
                              ({detail.unresolvedNames.length} unresolved)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {migrationReport.migrationDetails.length > 10 && (
                      <div className="text-muted-foreground text-center py-2">
                        ... and {migrationReport.migrationDetails.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}