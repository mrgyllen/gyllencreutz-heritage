import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import cosmosClient from '../server/cosmosClient';

export async function getMonarchsDuringLifetime(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const memberId = request.params.memberId;

  if (request.method !== 'GET') {
    return { status: 405, jsonBody: { error: 'Method not allowed' } };
  }

  if (!memberId) {
    return { status: 400, jsonBody: { error: 'Member ID is required' } };
  }

  try {
    // First get the family member
    const member = await cosmosClient.getMember(memberId);
    
    if (!member) {
      return { 
        status: 404, 
        jsonBody: { 
          success: false,
          error: 'Family member not found'
        } 
      };
    }

    // Validate that member has born date
    if (member.born === null || member.born === undefined) {
      return { 
        status: 400, 
        jsonBody: { 
          success: false,
          error: 'Family member must have a birth year'
        } 
      };
    }

    // Get monarchs during the member's lifetime
    const monarchs = await cosmosClient.getMonarchsDuringLifetime(member.born, member.died || 9999);
    
    return { 
      jsonBody: { 
        success: true, 
        data: monarchs,
        count: monarchs.length,
        message: `Found ${monarchs.length} monarchs during ${member.name}'s lifetime`
      } 
    };
  } catch (error) {
    context.error('Error fetching monarchs during lifetime:', error);
    return { 
      status: 500, 
      jsonBody: { 
        success: false,
        error: 'Failed to fetch monarchs during lifetime',
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

app.http('get-monarchs-during-lifetime', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'members/{memberId}/monarchs',
  handler: getMonarchsDuringLifetime,
});