import React from 'react';
import { Database, Crown, Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { AdminErrorBoundary } from '@/components/error-boundary';
import { FamilyMembersTab } from '@/components/admin/family-members-tab';
import { MonarchsTab } from '@/components/admin/monarchs-tab';
import { DataOperationsTab } from '@/components/admin/data-operations-tab';
import { useFamilyMembers } from '@/hooks/use-family-members';
import { useMonarchs } from '@/hooks/use-monarchs';

/**
 * Enhanced Azure Cosmos DB Administration Interface
 * 
 * Refactored into separate components for better maintainability:
 * - FamilyMembersTab: Family member CRUD operations
 * - MonarchsTab: Monarch management interface
 * - DataOperationsTab: Import/export and bulk operations
 */
function AdminDbContent() {
  const [, setLocation] = useLocation();
  
  // Use custom hooks for data management
  const { familyMembers, isLoading: familyMembersLoading } = useFamilyMembers();
  const { monarchs } = useMonarchs();

  // Loading state for the entire interface
  if (familyMembersLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading admin interface...</p>
          </div>
        </div>
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
          <FamilyMembersTab monarchs={monarchs} />
        </TabsContent>

        <TabsContent value="monarchs" className="mt-6">
          <MonarchsTab />
        </TabsContent>

        <TabsContent value="data-operations" className="mt-6">
          <DataOperationsTab familyMembers={familyMembers} />
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