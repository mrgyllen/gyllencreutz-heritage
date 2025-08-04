import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import cosmosClient from '../server/cosmosClient';

export async function getAllMonarchs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'GET') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    const monarchs = await cosmosClient.getAllMonarchs();
    
    return { 
      jsonBody: { 
        success: true, 
        data: monarchs,
        count: monarchs.length
      } 
    };
  } catch (error) {
    context.error('Error fetching monarchs:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to fetch monarchs',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('get-all-monarchs', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'cosmos/monarchs',
  handler: getAllMonarchs,
});