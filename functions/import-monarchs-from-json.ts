import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import cosmosClient from '../server/cosmosClient';

export async function importMonarchsFromJson(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method !== 'POST') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  try {
    const { monarchs } = await request.json() as { monarchs: any[] };
    
    if (!monarchs || !Array.isArray(monarchs)) {
      return { 
        status: 400, 
        jsonBody: { 
          success: false,
          error: 'Invalid data format. Expected { monarchs: [...] }'
        } 
      };
    }

    const result = await cosmosClient.importMonarchsFromJson(monarchs);
    
    return { 
      jsonBody: { 
        success: true, 
        data: result,
        message: result.message
      } 
    };
  } catch (error) {
    context.error('Error importing monarchs from JSON:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to import monarchs from JSON',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('import-monarchs-from-json', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'monarchs/import',
  handler: importMonarchsFromJson,
});