const { app } = require('@azure/functions');
const { cosmosDbService } = require('../../shared/cosmosClient');

// GET /api/cosmos/members - Get all family members from Cosmos DB
app.http('cosmosGetAllMembers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'cosmos/members',
    handler: async (request, context) => {
        try {
            const members = await cosmosDbService.getAllMembers();
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(members)
            };
        } catch (error) {
            context.log.error('Error retrieving members from Cosmos DB:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to retrieve members from Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// GET /api/cosmos/members/{id} - Get specific family member by ID from Cosmos DB
app.http('cosmosGetMemberById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'cosmos/members/{id}',
    handler: async (request, context) => {
        try {
            const id = request.params.id;
            const member = await cosmosDbService.getMemberById(id);
            
            
            if (!member) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Member not found' })
                };
            }
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(member)
            };
        } catch (error) {
            context.log.error('Error retrieving member from Cosmos DB:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to retrieve member from Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// POST /api/cosmos/members - Create new family member in Cosmos DB
app.http('cosmosCreateMember', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'cosmos/members',
    handler: async (request, context) => {
        try {
            const memberData = await request.json();
            
            // Validate required fields
            if (!memberData.name || !memberData.externalId) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Missing required fields: name, externalId' })
                };
            }
            
            const createdMember = await cosmosDbService.createMember(memberData);
            
            return {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(createdMember)
            };
        } catch (error) {
            context.log.error('Error creating member in Cosmos DB:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to create member in Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// PUT /api/cosmos/members/{id} - Update existing family member in Cosmos DB
app.http('cosmosUpdateMember', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'cosmos/members/{id}',
    handler: async (request, context) => {
        try {
            const id = request.params.id;
            const memberData = await request.json();
            
            const updatedMember = await cosmosDbService.updateMember(id, memberData);
            
            if (!updatedMember) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Member not found' })
                };
            }
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(updatedMember)
            };
        } catch (error) {
            context.log.error('Error updating member in Cosmos DB:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to update member in Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// DELETE /api/cosmos/members/{id} - Delete family member from Cosmos DB
app.http('cosmosDeleteMember', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'cosmos/members/{id}',
    handler: async (request, context) => {
        try {
            const id = request.params.id;
            const result = await cosmosDbService.deleteMember(id);
            
            if (!result) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Member not found' })
                };
            }
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(result)
            };
        } catch (error) {
            context.log.error('Error deleting member from Cosmos DB:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to delete member from Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// GET /api/cosmos/members/search/{query} - Search family members in Cosmos DB
app.http('cosmosSearchMembers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'cosmos/members/search/{query}',
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
                    body: JSON.stringify({ error: 'Search query must be at least 2 characters long' })
                };
            }
            
            const members = await cosmosDbService.searchMembers(query);
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(members)
            };
        } catch (error) {
            context.log.error('Error searching members in Cosmos DB:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to search members in Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});