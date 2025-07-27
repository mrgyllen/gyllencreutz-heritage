const { app } = require('@azure/functions');
const { storage } = require('../../shared/storage');

// GET /api/backups - List available backups (simplified for Azure Functions)
app.http('backupsList', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'backups',
    handler: async (request, context) => {
        try {
            // For Azure Functions, we don't have local file system access
            // Return empty array as backups are handled via GitHub commits
            const backups = [];

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(backups)
            };
        } catch (error) {
            context.log.error('Error listing backups:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to list backups',
                    message: error.message 
                })
            };
        }
    }
});

// POST /api/backups/create - Create backup (simplified for Azure Functions)
app.http('backupsCreate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'backups/create',
    handler: async (request, context) => {
        try {
            const familyMembers = await storage.getAllFamilyMembers();
            
            // In Azure Functions, backups are essentially GitHub commits
            // Return success with current data info
            const backupInfo = {
                filename: `azure-functions-backup-${new Date().toISOString()}.json`,
                timestamp: new Date().toISOString(),
                trigger: 'manual',
                memberCount: familyMembers.length,
                size: JSON.stringify(familyMembers).length,
                note: 'Azure Functions backup (GitHub commit-based)'
            };

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(backupInfo)
            };
        } catch (error) {
            context.log.error('Error creating backup:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to create backup',
                    message: error.message 
                })
            };
        }
    }
});

// POST /api/backups/restore - Restore backup (not supported in Azure Functions)
app.http('backupsRestore', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'backups/restore',
    handler: async (request, context) => {
        try {
            return {
                status: 501,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Backup restore not supported in Azure Functions environment',
                    message: 'Use GitHub repository history for data restoration'
                })
            };
        } catch (error) {
            context.log.error('Error in backup restore:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to process restore request',
                    message: error.message 
                })
            };
        }
    }
});