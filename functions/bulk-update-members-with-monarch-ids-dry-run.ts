import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDbService } from './shared/cosmosClient.js';

export async function bulkUpdateMembersWithMonarchIdsDryRun(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    const result = await cosmosDbService.bulkUpdateMembersWithMonarchIds({ dryRun: true });
    
    return { 
      jsonBody: { 
        success: true, 
        data: result,
        message: result.message
      } 
    };
  } catch (error) {
    context.error('Error bulk updating members with monarch IDs (dry run):', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to perform dry run of bulk update members with monarch IDs',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('bulk-update-members-with-monarch-ids-dry-run', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'cosmos/members/bulk-update-monarchs-dry-run',
  handler: bulkUpdateMembersWithMonarchIdsDryRun,
});