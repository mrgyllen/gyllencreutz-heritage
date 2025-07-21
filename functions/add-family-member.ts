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

export async function addFamilyMember(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }
  
  try {
    const newMember = await request.json() as Omit<FamilyMember, 'id'>;
    const dataPath = path.join(__dirname, 'data', 'family-members.json');
    
    const data = await fs.readFile(dataPath, 'utf-8');
    const familyMembers: FamilyMember[] = JSON.parse(data);
    
    // Generate new ID (find the highest existing ID and add 1)
    const maxId = Math.max(...familyMembers.map(m => m.id));
    const newId = maxId + 1;
    
    const memberWithId: FamilyMember = {
      ...newMember,
      id: newId
    };
    
    // Add to array
    familyMembers.push(memberWithId);
    
    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(familyMembers, null, 2));
    
    return { jsonBody: { success: true, member: memberWithId } };
  } catch (error) {
    return { status: 500, jsonBody: { error: 'Failed to add family member' } };
  }
}

app.http('add-family-member', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'family-members',
  handler: addFamilyMember,
});