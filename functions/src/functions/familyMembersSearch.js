const { app } = require('@azure/functions');
const { storage } = require('../../shared/storage');

app.http('familyMembersSearch', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'family-members/search/{query}',
    handler: async (request, context) => {
        try {
            const query = request.params.query;
            if (!query || query.length < 2) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Query parameter must be at least 2 characters' })
                };
            }

            const results = await storage.searchFamilyMembers(query);
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(results)
            };
        } catch (error) {
            context.log.error('Error searching family members:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Failed to search family members'
                })
            };
        }
    }
});