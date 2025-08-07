import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDbService } from './shared/cosmosClient.js';

export async function deleteMonarch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;

  if (request.method !== 'DELETE') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  if (!id) {
    return { status: 400, jsonBody: { error: 'Monarch ID is required' } };
  }

  try {
    const deleted = await cosmosDbService.deleteMonarch(id);
    
    if (!deleted) {
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
        message: 'Monarch deleted successfully'
      } 
    };
  } catch (error) {
    context.error('Error deleting monarch:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to delete monarch',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('delete-monarch', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'cosmos/monarchs/{id}',
  handler: deleteMonarch,
});