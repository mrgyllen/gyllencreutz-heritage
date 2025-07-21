const { app } = require('@azure/functions');
const { storage } = require('../../shared/storage');

// POST /api/family-members - Create new family member
app.http('familyMembersCreate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'family-members',
    handler: async (request, context) => {
        try {
            const memberData = await request.json();
            
            // Validate required fields
            if (!memberData.externalId || !memberData.name || !memberData.biologicalSex) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Missing required fields: externalId, name, biologicalSex' })
                };
            }
            
            // Check if member already exists
            const existingMembers = await storage.getAllFamilyMembers();
            const exists = existingMembers.find(m => m.externalId === memberData.externalId);
            if (exists) {
                return {
                    status: 409,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Family member with this external ID already exists' })
                };
            }
            
            const newMember = await storage.createFamilyMember(memberData);
            return {
                status: 201,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(newMember)
            };
        } catch (error) {
            context.log.error('Error creating family member:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Failed to create family member'
                })
            };
        }
    }
});

// PUT /api/family-members/{id} - Update existing family member
app.http('familyMembersUpdate', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'family-members/{id}',
    handler: async (request, context) => {
        try {
            const externalId = request.params.id;
            const updateData = await request.json();
            
            const updatedMember = await storage.updateFamilyMember(externalId, updateData);
            if (!updatedMember) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Family member not found' })
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
            context.log.error('Error updating family member:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Failed to update family member'
                })
            };
        }
    }
});

// DELETE /api/family-members/{id} - Delete family member
app.http('familyMembersDelete', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'family-members/{id}',
    handler: async (request, context) => {
        try {
            const externalId = request.params.id;
            
            const deletedMember = await storage.deleteFamilyMember(externalId);
            if (!deletedMember) {
                return {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Family member not found' })
                };
            }
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    message: 'Family member deleted successfully', 
                    member: deletedMember 
                })
            };
        } catch (error) {
            context.log.error('Error deleting family member:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Failed to delete family member'
                })
            };
        }
    }
});

// POST /api/family-members/bulk-update - Bulk operations
app.http('familyMembersBulkUpdate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'family-members/bulk-update',
    handler: async (request, context) => {
        try {
            const members = await request.json();
            
            if (!Array.isArray(members)) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ error: 'Request body must be an array of family members' })
                };
            }
            
            const result = await storage.bulkUpdateFamilyMembers(members);
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    message: 'Bulk update completed', 
                    updated: result.updated, 
                    created: result.created 
                })
            };
        } catch (error) {
            context.log.error('Error in bulk update:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: error.message,
                    details: 'Failed to perform bulk update'
                })
            };
        }
    }
});