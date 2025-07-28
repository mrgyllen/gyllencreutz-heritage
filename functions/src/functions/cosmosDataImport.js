const { app } = require('@azure/functions');
const { cosmosDbService } = require('../../shared/cosmosClient');
const { storage } = require('../../shared/storage');

// POST /api/cosmos/import - Import data from JSON file to Cosmos DB
app.http('cosmosImportData', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'cosmos/import',
    handler: async (request, context) => {
        try {
            context.log('🚀 Starting data import from JSON file to Cosmos DB...');
            
            // Get all family members from the existing JSON storage
            const jsonMembers = await storage.getAllFamilyMembers();
            
            if (!jsonMembers || jsonMembers.length === 0) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        error: 'No family members found in JSON file',
                        message: 'Please ensure the JSON file is properly loaded'
                    })
                };
            }

            context.log(`📄 Found ${jsonMembers.length} members in JSON file`);

            // Transform JSON members to Cosmos DB format
            const cosmosMembers = jsonMembers.map(member => ({
                id: member.externalId, // Use externalId as the Cosmos DB document id
                externalId: member.externalId,
                name: member.name,
                born: member.born,
                died: member.died,
                biologicalSex: member.biologicalSex,
                notes: member.notes,
                father: member.father,
                ageAtDeath: member.ageAtDeath,
                diedYoung: member.diedYoung,
                isSuccessionSon: member.isSuccessionSon,
                hasMaleChildren: member.hasMaleChildren,
                nobleBranch: member.nobleBranch,
                monarchDuringLife: member.monarchDuringLife,
                // Add metadata for tracking
                importedAt: new Date().toISOString(),
                importSource: 'json-file'
            }));

            // Perform bulk import
            const importResult = await cosmosDbService.bulkImportMembers(cosmosMembers);

            context.log(`✅ Import completed: ${importResult.successful} successful, ${importResult.failed} failed`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: 'Data import completed',
                    summary: {
                        totalFromJson: jsonMembers.length,
                        attempted: importResult.total,
                        successful: importResult.successful,
                        failed: importResult.failed
                    },
                    details: importResult.results.filter(r => !r.success) // Only include failed imports
                })
            };
        } catch (error) {
            context.log.error('❌ Error during data import:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to import data to Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// GET /api/cosmos/import/status - Check import status and compare JSON vs Cosmos DB
app.http('cosmosImportStatus', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'cosmos/import/status',
    handler: async (request, context) => {
        try {
            // Get counts from both sources
            const [jsonMembers, cosmosMembers] = await Promise.all([
                storage.getAllFamilyMembers(),
                cosmosDbService.getAllMembers()
            ]);

            const status = {
                jsonFile: {
                    count: jsonMembers ? jsonMembers.length : 0,
                    available: !!jsonMembers && jsonMembers.length > 0
                },
                cosmosDb: {
                    count: cosmosMembers ? cosmosMembers.length : 0,
                    available: !!cosmosMembers
                },
                needsImport: !cosmosMembers || cosmosMembers.length === 0,
                inSync: jsonMembers && cosmosMembers && jsonMembers.length === cosmosMembers.length
            };

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(status)
            };
        } catch (error) {
            context.log.error('❌ Error checking import status:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to check import status',
                    message: error.message 
                })
            };
        }
    }
});

// DELETE /api/cosmos/import/clear - Clear all data from Cosmos DB (for testing)
app.http('cosmosClearData', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'cosmos/import/clear',
    handler: async (request, context) => {
        try {
            context.log('⚠️ Starting to clear all data from Cosmos DB...');
            
            // Get all members
            const allMembers = await cosmosDbService.getAllMembers();
            
            if (!allMembers || allMembers.length === 0) {
                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        message: 'No data to clear',
                        deleted: 0
                    })
                };
            }

            // Delete all members
            let deleteCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const member of allMembers) {
                try {
                    await cosmosDbService.deleteMember(member.id);
                    deleteCount++;
                } catch (error) {
                    errorCount++;
                    errors.push({ id: member.id, error: error.message });
                    context.log.error(`Failed to delete member ${member.id}:`, error);
                }
            }

            context.log(`✅ Clear completed: ${deleteCount} deleted, ${errorCount} failed`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: 'Data clearing completed',
                    deleted: deleteCount,
                    failed: errorCount,
                    errors: errors
                })
            };
        } catch (error) {
            context.log.error('❌ Error during data clearing:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to clear data from Cosmos DB',
                    message: error.message 
                })
            };
        }
    }
});

// POST /api/cosmos/import/restore - Restore Cosmos DB from uploaded JSON backup
app.http('cosmosRestoreFromJson', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'cosmos/import/restore',
    handler: async (request, context) => {
        try {
            context.log('🔄 Starting restore from JSON backup...');
            
            // Parse the uploaded JSON data
            const requestBody = await request.text();
            let jsonData;
            
            try {
                jsonData = JSON.parse(requestBody);
            } catch (parseError) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        error: 'Invalid JSON format',
                        message: 'The uploaded file does not contain valid JSON data'
                    })
                };
            }

            // Validate the JSON structure
            if (!Array.isArray(jsonData)) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ 
                        error: 'Invalid data format',
                        message: 'JSON data must be an array of family members'
                    })
                };
            }

            context.log(`📄 Found ${jsonData.length} members in JSON backup`);

            // Step 1: Clear all existing data
            context.log('🗑️ Clearing existing Cosmos DB data...');
            const existingMembers = await cosmosDbService.getAllMembers();
            
            let clearCount = 0;
            let clearErrors = 0;
            
            if (existingMembers && existingMembers.length > 0) {
                for (const member of existingMembers) {
                    try {
                        await cosmosDbService.deleteMember(member.id);
                        clearCount++;
                    } catch (error) {
                        clearErrors++;
                        context.log.error(`Failed to delete member ${member.id}:`, error);
                    }
                }
            }

            context.log(`🗑️ Cleared ${clearCount} members, ${clearErrors} failures`);

            // Step 2: Import all data from JSON backup
            context.log('📥 Importing data from JSON backup...');
            
            const cosmosMembers = jsonData.map(member => ({
                id: member.externalId || member.id, // Handle both formats
                externalId: member.externalId || member.id,
                name: member.name || 'Unknown',
                born: member.born || null,
                died: member.died || null,
                biologicalSex: member.biologicalSex || 'Unknown',
                notes: member.notes || null,
                father: member.father || null,
                ageAtDeath: member.ageAtDeath || null,
                diedYoung: member.diedYoung || false,
                isSuccessionSon: member.isSuccessionSon || false,
                hasMaleChildren: member.hasMaleChildren || false,
                nobleBranch: member.nobleBranch || null,
                monarchDuringLife: member.monarchDuringLife || [],
                // Add restore metadata
                importedAt: new Date().toISOString(),
                importSource: 'json-restore'
            }));

            // Perform bulk import
            const importResult = await cosmosDbService.bulkImportMembers(cosmosMembers);

            context.log(`✅ Restore completed: ${importResult.successful} successful, ${importResult.failed} failed`);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: 'JSON restore completed successfully',
                    summary: {
                        cleared: clearCount,
                        clearErrors: clearErrors,
                        restored: importResult.successful,
                        restoreErrors: importResult.failed,
                        totalInBackup: jsonData.length
                    },
                    details: {
                        clearFailures: clearErrors,
                        importFailures: importResult.results.filter(r => !r.success)
                    }
                })
            };
        } catch (error) {
            context.log.error('❌ Error during JSON restore:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'Failed to restore from JSON backup',
                    message: error.message 
                })
            };
        }
    }
});