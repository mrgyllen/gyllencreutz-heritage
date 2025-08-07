import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { cosmosDbService } from './shared/cosmosClient.js';

interface CosmosDbMonarch {
  id: string;
  name: string;
  born: string;
  died: string;
  reignFrom: string;
  reignTo: string;
  quote?: string;
  about?: string;
  portraitFileName?: string;
}

export async function updateMonarch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const id = request.params.id;

  if (request.method !== 'PUT') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  if (!id) {
    return { status: 400, jsonBody: { error: 'Monarch ID is required' } };
  }

  try {
    const monarchData = await request.json() as Partial<CosmosDbMonarch>;
    
    const updatedMonarch = await cosmosDbService.updateMonarch(id, monarchData);
    
    if (!updatedMonarch) {
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
        data: updatedMonarch,
        message: 'Monarch updated successfully'
      } 
    };
  } catch (error) {
    context.error('Error updating monarch:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to update monarch',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('update-monarch', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'cosmos/monarchs/{id}',
  handler: updateMonarch,
});