import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDbService } from './shared/cosmosClient.js';

export async function bulkUpdateMembersWithMonarchIds(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    // Parse query parameters for options
    const dryRun = request.query.get('dryRun') === 'true';
    
    const result = await cosmosDbService.bulkUpdateMembersWithMonarchIds({ dryRun });
    
    return { 
      jsonBody: { 
        success: true, 
        data: result,
        message: result.message
      } 
    };
  } catch (error) {
    context.error('Error bulk updating members with monarch IDs:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to bulk update members with monarch IDs',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('bulk-update-members-with-monarch-ids', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'cosmos/members/bulk-update-monarchs',
  handler: bulkUpdateMembersWithMonarchIds,
});