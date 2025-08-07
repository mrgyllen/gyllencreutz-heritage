import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDbService } from './shared/cosmosClient.js';

export async function getMonarch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;

  if (request.method !== 'GET') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  if (!id) {
    return { status: 400, jsonBody: { error: 'Monarch ID is required' } };
  }

  try {
    const monarch = await cosmosDbService.getMonarch(id);
    
    if (!monarch) {
      return { 
        status: 404, 
        jsonBody: { 
          success: false,
          error: 'Monarch not found'
        } 
      };
    }

    return { 
      jsonBody: { 
        success: true, 
        data: monarch
      } 
    };
  } catch (error) {
    context.error('Error fetching monarch:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to fetch monarch',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('get-monarch', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'cosmos/monarchs/{id}',
  handler: getMonarch,
});