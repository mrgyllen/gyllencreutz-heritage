import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as fs from 'fs/promises';
import * as path from 'path';

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

export async function editFamilyMember(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;
  
  if (request.method === 'GET') {
    // Get specific family member
    try {
      const dataPath = path.join(__dirname, 'data', 'family-members.json');
      const data = await fs.readFile(dataPath, 'utf-8');
      const familyMembers: FamilyMember[] = JSON.parse(data);
      
      const member = familyMembers.find(m => m.id.toString() === id);
      if (!member) {
        return { status: 404, jsonBody: { error: 'Family member not found' } };
      }
      
      return { jsonBody: member };
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Failed to read family data' } };
    }
  }
  
  if (request.method === 'PUT') {
    // Update family member
    try {
      const updatedMember = await request.json() as FamilyMember;
      const dataPath = path.join(__dirname, 'data', 'family-members.json');
      
      const data = await fs.readFile(dataPath, 'utf-8');
      const familyMembers: FamilyMember[] = JSON.parse(data);
      
      const memberIndex = familyMembers.findIndex(m => m.id.toString() === id);
      if (memberIndex === -1) {
        return { status: 404, jsonBody: { error: 'Family member not found' } };
      }
      
      // Update the member while preserving the ID
      familyMembers[memberIndex] = { ...updatedMember, id: parseInt(id) };
      
      // Write back to file
      await fs.writeFile(dataPath, JSON.stringify(familyMembers, null, 2));
      
      return { jsonBody: { success: true, member: familyMembers[memberIndex] } };
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Failed to update family member' } };
    }
  }
  
  if (request.method === 'DELETE') {
    // Delete family member
    try {
      const dataPath = path.join(__dirname, 'data', 'family-members.json');
      
      const data = await fs.readFile(dataPath, 'utf-8');
      const familyMembers: FamilyMember[] = JSON.parse(data);
      
      const memberIndex = familyMembers.findIndex(m => m.id.toString() === id);
      if (memberIndex === -1) {
        return { status: 404, jsonBody: { error: 'Family member not found' } };
      }
      
      const deletedMember = familyMembers.splice(memberIndex, 1)[0];
      
      // Write back to file
      await fs.writeFile(dataPath, JSON.stringify(familyMembers, null, 2));
      
      return { jsonBody: { success: true, deletedMember } };
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Failed to delete family member' } };
    }
  }
  
  return { status: 405, jsonBody: { error: 'Method not allowed' } };
}

app.http('edit-family-member', {
  methods: ['GET', 'PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'family-members/{id}',
  handler: editFamilyMember,
});