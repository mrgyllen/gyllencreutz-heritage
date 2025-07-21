import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit, Trash2, Save, X, Download, Upload } from 'lucide-react';
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
  birth?: string;
  death?: string;
  biologicalSex?: string;
  notes?: string;
  father?: string;
  monarch?: string;
  isSuccessionSon?: boolean;
}

export function Admin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: familyMembers = [], isLoading } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members'],
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (member: FamilyMember) => {
      const response = await fetch(`/api/family-members/${member.id}`, {
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
    mutationFn: async (id: number) => {
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
    const memberData = {
      externalId: formData.get('externalId') as string,
      name: formData.get('name') as string,
      birth: formData.get('birth') as string || undefined,
      death: formData.get('death') as string || undefined,
      biologicalSex: formData.get('biologicalSex') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      father: formData.get('father') as string || undefined,
      monarch: formData.get('monarch') as string || undefined,
      isSuccessionSon: formData.get('isSuccessionSon') === 'on',
    };

    if (isNew) {
      addMemberMutation.mutate(memberData);
    } else if (editingMember) {
      updateMemberMutation.mutate({ ...memberData, id: editingMember.id });
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
      <div className="container mx-auto p-6">
        <div className="text-center">Loading family data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Family Data Administration</h1>
        <p className="text-muted-foreground">Manage and edit Gyllencreutz family member information</p>
      </div>

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
              {new Set(familyMembers.map(m => m.monarch).filter(Boolean)).size}
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
                    {member.birth && <div>Born: {member.birth}</div>}
                    {member.death && <div>Died: {member.death}</div>}
                    {member.biologicalSex && <div>Sex: {member.biologicalSex}</div>}
                    {member.father && <div>Father: {member.father}</div>}
                    {member.monarch && <div>Monarch: {member.monarch}</div>}
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
                  <Label htmlFor="birth">Birth Year</Label>
                  <Input
                    id="birth"
                    name="birth"
                    defaultValue={editingMember?.birth || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="death">Death Year</Label>
                  <Input
                    id="death"
                    name="death"
                    defaultValue={editingMember?.death || ''}
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
                  <Label htmlFor="monarch">Monarch</Label>
                  <Input
                    id="monarch"
                    name="monarch"
                    defaultValue={editingMember?.monarch || ''}
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