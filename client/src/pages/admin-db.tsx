import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Save, X, Download, Upload, Database, CheckCircle, AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
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

// Azure Cosmos DB Administration Interface
export function AdminDb() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<CosmosDbFamilyMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main data query
  const { data: familyMembers = [], isLoading } = useQuery<CosmosDbFamilyMember[]>({
    queryKey: ['/api/cosmos/members'],
  });

  // Import status query
  const { data: importStatus } = useQuery<ImportStatus>({
    queryKey: ['/api/cosmos/import/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // CRUD mutations
  const updateMemberMutation = useMutation({
    mutationFn: async (member: CosmosDbFamilyMember) => {
      const response = await fetch(`/api/cosmos/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to update member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      toast({ title: 'Success', description: 'Family member updated successfully' });
      setEditingMember(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update family member', variant: 'destructive' });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: CreateCosmosDbFamilyMember) => {
      const response = await fetch('/api/cosmos/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to add member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      toast({ title: 'Success', description: 'Family member added successfully' });
      setIsAddingNew(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add family member', variant: 'destructive' });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/cosmos/members/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cosmos/members'] });
      toast({ title: 'Success', description: 'Family member deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete family member', variant: 'destructive' });
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

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.externalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (formData: FormData, isNew: boolean = false) => {
    const bornValue = formData.get('born') as string;
    const diedValue = formData.get('died') as string;
    const monarchValue = formData.get('monarchDuringLife') as string;
    
    const memberData = {
      externalId: formData.get('externalId') as string,
      name: formData.get('name') as string,
      born: bornValue ? parseInt(bornValue) : null,
      died: diedValue ? parseInt(diedValue) : null,
      biologicalSex: formData.get('biologicalSex') as string || 'Unknown',
      notes: formData.get('notes') as string || null,
      father: formData.get('father') as string || null,
      monarchDuringLife: monarchValue ? [monarchValue] : [],
      isSuccessionSon: formData.get('isSuccessionSon') === 'on',
      diedYoung: false,
      hasMaleChildren: false,
      nobleBranch: null,
      ageAtDeath: null,
    };

    if (isNew) {
      addMemberMutation.mutate({
        ...memberData,
        id: memberData.externalId, // Use externalId as Cosmos DB id
      });
    } else if (editingMember) {
      updateMemberMutation.mutate({
        ...editingMember,
        ...memberData,
      });
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading Cosmos DB data...</div>
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

      {/* Import Status Section */}
      {importStatus && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              Data Import Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importStatus.jsonFile.count}</div>
                <div className="text-sm text-muted-foreground">JSON File Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{importStatus.cosmosDb.count}</div>
                <div className="text-sm text-muted-foreground">Cosmos DB Records</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${importStatus.inSync ? 'text-green-600' : 'text-orange-600'}`}>
                  {importStatus.inSync ? 'In Sync' : 'Out of Sync'}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
            
            {importStatus.needsImport && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cosmos DB appears to be empty. You may want to import data from the JSON file.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => importDataMutation.mutate()}
                disabled={importDataMutation.isPending}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {importDataMutation.isPending ? 'Importing...' : 'Import from JSON'}
              </Button>
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
      )}

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, external ID, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
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
          <Button
            onClick={exportData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingMember?.name || ''}
                  required
                />
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="died">Died</Label>
                <Input
                  id="died"
                  name="died"
                  type="number"
                  defaultValue={editingMember?.died || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biologicalSex">Biological Sex</Label>
                <Select name="biologicalSex" defaultValue={editingMember?.biologicalSex || 'Unknown'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="father">Father</Label>
                <Input
                  id="father"
                  name="father"
                  defaultValue={editingMember?.father || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monarchDuringLife">Monarch During Life</Label>
                <Input
                  id="monarchDuringLife"
                  name="monarchDuringLife"
                  defaultValue={editingMember?.monarchDuringLife?.join(', ') || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingMember?.notes || ''}
                rows={3}
              />
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
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isAddingNew ? 'Add Member' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}