const { app } = require('@azure/functions');
const { storage } = require('../../shared/storage');

app.http('familyMembers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'family-members',
    handler: async (request, context) => {
        try {
            const members = await storage.getAllFamilyMembers();
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(members)
            };
        } catch (error) {
            context.log.error('Error fetching family members:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Failed to load family members data'
                })
            };
        }
    }
});