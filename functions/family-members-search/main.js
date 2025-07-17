const { app } = require('@azure/functions');
const { storage } = require('../shared/storage');

app.http('family-members-search', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'family-members/search/{query}',
    handler: async (request, context) => {
        context.log('TEST DEBUG - Search function was invoked');
        try {
            const query = request.params.query;
            if (!query) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Query parameter is required' })
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
            console.error('Family members search endpoint error:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    stack: error.stack,
                    type: error.constructor.name
                })
            };
        }
    }
});