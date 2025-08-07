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

export async function createMonarch(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    const monarchData = await request.json() as CosmosDbMonarch;
    
    // Validate required fields
    if (!monarchData.id) {
      return { 
        status: 400, 
        jsonBody: { 
          success: false,
          error: 'Monarch ID is required'
        } 
      };
    }

    if (!monarchData.name) {
      return { 
        status: 400, 
        jsonBody: { 
          success: false,
          error: 'Monarch name is required'
        } 
      };
    }

    const newMonarch = await cosmosDbService.createMonarch(monarchData);
    
    return { 
      status: 201,
      jsonBody: { 
        success: true, 
        data: newMonarch,
        message: 'Monarch created successfully'
      } 
    };
  } catch (error) {
    context.error('Error creating monarch:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to create monarch',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('create-monarch', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'cosmos/monarchs',
  handler: createMonarch,
});