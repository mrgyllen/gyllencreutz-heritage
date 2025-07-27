const { app } = require('@azure/functions');
const { storage } = require('../../shared/storage');

// Debug endpoint to see what data is being loaded
app.http('debugData', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'debug/data',
    handler: async (request, context) => {
        try {
            const members = await storage.getAllFamilyMembers();
            
            const debugInfo = {
                totalCount: members.length,
                firstThreeMembers: members.slice(0, 3),
                sampleMemberFields: members.length > 0 ? Object.keys(members[0]) : [],
                hasNames: members.slice(0, 10).map(m => ({ 
                    externalId: m.externalId, 
                    name: m.name, 
                    hasName: !!m.name,
                    nameLength: m.name ? m.name.length : 0
                }))
            };

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(debugInfo, null, 2)
            };
        } catch (error) {
            context.log.error('Error in debug data endpoint:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    stack: error.stack
                })
            };
        }
    }
});