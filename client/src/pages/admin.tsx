import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, Plus, Edit, Trash2, Save, X, Download, Upload, Github, CheckCircle, AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';


interface FamilyMember {
  id: number;
  externalId: string;
  name: string;
  born?: number;
  died?: number;
  biologicalSex?: string;
  notes?: string;
  father?: string;
  monarchDuringLife?: any[];
  isSuccessionSon?: boolean;
  ageAtDeath?: number;
  diedYoung?: boolean;
  hasMaleChildren?: boolean;
  nobleBranch?: string;
}

export function Admin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: familyMembers = [], isLoading } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members'],
  });

  // GitHub sync status query
  const { data: githubStatus } = useQuery({
    queryKey: ['/api/github/status'],
    queryFn: async () => {
      const response = await fetch('/api/github/status');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // GitHub test connection mutation
  const testGitHubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/github/test', { method: 'POST' });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      toast({ description: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/github/status'] });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        description: error.message || 'GitHub connection test failed' 
      });
    },
  });

  // Manual retry mutation
  const retryGitHubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/github/retry', { method: 'POST' });
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      toast({ description: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/github/status'] });
    },
    onError: (error: any) => {
      toast({ 
        variant: "destructive", 
        description: error.message || 'GitHub retry failed' 
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (member: FamilyMember) => {
      const response = await fetch(`/api/family-members/${member.externalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to update member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      toast({ title: 'Success', description: 'Family member updated successfully' });
      setEditingMember(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update family member', variant: 'destructive' });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: Omit<FamilyMember, 'id'>) => {
      const response = await fetch('/api/family-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!response.ok) throw new Error('Failed to add member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      toast({ title: 'Success', description: 'Family member added successfully' });
      setIsAddingNew(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add family member', variant: 'destructive' });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/family-members/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family-members'] });
      toast({ title: 'Success', description: 'Family member deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete family member', variant: 'destructive' });
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
      born: bornValue ? parseInt(bornValue) : undefined,
      died: diedValue ? parseInt(diedValue) : undefined,
      biologicalSex: formData.get('biologicalSex') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      father: formData.get('father') as string || undefined,
      monarchDuringLife: monarchValue ? [monarchValue] : undefined,
      isSuccessionSon: formData.get('isSuccessionSon') === 'on',
    };

    if (isNew) {
      addMemberMutation.mutate(memberData);
    } else if (editingMember) {
      updateMemberMutation.mutate({
        ...memberData,
        id: editingMember.id,
        externalId: editingMember.externalId,
      });
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(familyMembers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `gyllencreutz-family-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">Family Data Administration</h1>
              <p className="text-muted-foreground">Loading family member information...</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Heritage Site
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Loading skeleton */}
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Family Data Administration</h1>
            <p className="text-muted-foreground">Manage and edit Gyllencreutz family member information</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Heritage Site
          </Button>
        </div>
      </div>

      {/* GitHub Sync Status Widget */}
      {githubStatus && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Github className="w-5 h-5" />
              GitHub Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {githubStatus.available ? (
                  <>
                    <div className="flex items-center gap-2">
                      {githubStatus.connected ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-700">Connected</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-700">
                            {githubStatus.connectionError || 'Connection failed'}
                          </span>
                        </>
                      )}
                    </div>
                    {githubStatus.lastSync && (
                      <span className="text-xs text-muted-foreground">
                        Last sync: {new Date(githubStatus.lastSync).toLocaleString()}
                      </span>
                    )}
                    {githubStatus.pendingOperations > 0 && (
                      <Badge variant="secondary">
                        {githubStatus.pendingOperations} pending
                      </Badge>
                    )}
                    {githubStatus.isRetrying && (
                      <Badge variant="outline">
                        <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                        Retrying...
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      {githubStatus.message || 'GitHub sync not configured'}
                    </span>
                  </div>
                )}
              </div>
              
              {githubStatus.available && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testGitHubMutation.mutate()}
                    disabled={testGitHubMutation.isPending}
                  >
                    {testGitHubMutation.isPending ? 'Testing...' : 'Test'}
                  </Button>
                  {githubStatus.pendingOperations > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryGitHubMutation.mutate()}
                      disabled={retryGitHubMutation.isPending}
                    >
                      {retryGitHubMutation.isPending ? 'Retrying...' : 'Retry'}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Error Display */}
            {githubStatus.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Sync Error:</strong> {githubStatus.error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, external ID, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
          <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{familyMembers.length}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {familyMembers.filter(m => m.isSuccessionSon).length}
            </div>
            <div className="text-sm text-muted-foreground">Succession Sons</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {filteredMembers.length}
            </div>
            <div className="text-sm text-muted-foreground">Search Results</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(familyMembers.flatMap(m => m.monarchDuringLife || []).filter(Boolean)).size}
            </div>
            <div className="text-sm text-muted-foreground">Unique Monarchs</div>
          </CardContent>
        </Card>
      </div>

      {/* Family Members List */}
      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <Badge variant="outline">{member.externalId}</Badge>
                    {member.isSuccessionSon && (
                      <Badge className="bg-amber-100 text-amber-800">Succession Son</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {member.born && <div>Born: {member.born}</div>}
                    {member.died && <div>Died: {member.died}</div>}
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
                        deleteMemberMutation.mutate(member.externalId);
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
              {isAddingNew ? 'Add New Family Member' : `Edit ${editingMember?.name}`}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData, isAddingNew);
          }}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingMember?.name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="externalId">External ID *</Label>
                  <Input
                    id="externalId"
                    name="externalId"
                    defaultValue={editingMember?.externalId || ''}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="born">Birth Year</Label>
                  <Input
                    id="born"
                    name="born"
                    type="number"
                    defaultValue={editingMember?.born || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="died">Death Year</Label>
                  <Input
                    id="died"
                    name="died"
                    type="number"
                    defaultValue={editingMember?.died || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="biologicalSex">Biological Sex</Label>
                  <Select name="biologicalSex" defaultValue={editingMember?.biologicalSex || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="father">Father (External ID)</Label>
                  <Input
                    id="father"
                    name="father"
                    defaultValue={editingMember?.father || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="monarchDuringLife">Monarch During Life</Label>
                  <Input
                    id="monarchDuringLife"
                    name="monarchDuringLife"
                    defaultValue={editingMember?.monarchDuringLife ? 
                      (Array.isArray(editingMember.monarchDuringLife) ? 
                        editingMember.monarchDuringLife.join(', ') : 
                        editingMember.monarchDuringLife) : ''}
                    placeholder="Gustav Vasa (1523–1560)"
                  />
                </div>
              </div>
              
              <div>
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
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingNew(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMemberMutation.isPending || addMemberMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isAddingNew ? 'Add Member' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}