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

export async function bulkUpdateFamily(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }
  
  try {
    const { members } = await request.json() as { members: FamilyMember[] };
    const dataPath = path.join(__dirname, 'data', 'family-members.json');
    
    // Create backup first
    const backupPath = path.join(__dirname, 'data', `family-members-backup-${Date.now()}.json`);
    const currentData = await fs.readFile(dataPath, 'utf-8');
    await fs.writeFile(backupPath, currentData);
    
    // Write new data
    await fs.writeFile(dataPath, JSON.stringify(members, null, 2));
    
    return { 
      jsonBody: { 
        success: true, 
        message: `Updated ${members.length} family members`,
        backupPath: path.basename(backupPath)
      } 
    };
  } catch (error) {
    return { status: 500, jsonBody: { error: 'Failed to bulk update family data' } };
  }
}

app.http('bulk-update-family', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'family-members/bulk-update',
  handler: bulkUpdateFamily,
});