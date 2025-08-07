const { CosmosClient } = require('@azure/cosmos');

// Cosmos DB configuration
const endpoint = process.env.COSMOS_DB_ENDPOINT || 'https://gyllencreutz-db.documents.azure.com:443/';
const key = process.env.COSMOS_DB_PRIMARY_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE_ID || 'familyTreeDb';
const containerId = process.env.COSMOS_DB_CONTAINER_ID || 'members';

if (!key) {
    console.error('❌ COSMOS_DB_PRIMARY_KEY environment variable is not set');
}

// Initialize the CosmosClient
let cosmosClient = null;
let database = null;
let container = null;

function initializeCosmosClient() {
    if (!key) {
        throw new Error('Cosmos DB Primary Key is not configured. Please set COSMOS_DB_PRIMARY_KEY environment variable.');
    }

    if (!cosmosClient) {
        cosmosClient = new CosmosClient({ endpoint, key });
        database = cosmosClient.database(databaseId);
        container = database.container(containerId);
        
        console.log('✅ Cosmos DB client initialized');
        console.log(`   Database: ${databaseId}`);
        console.log(`   Container: ${containerId}`);
        console.log(`   Endpoint: ${endpoint}`);
    }
    
    return { cosmosClient, database, container };
}

// Cosmos DB operations class
class CosmosDbService {
    constructor() {
        this.isInitialized = false;
        this.cosmosClient = null;
        this.database = null;
        this.container = null;
    }

    initialize() {
        if (!this.isInitialized) {
            const client = initializeCosmosClient();
            this.cosmosClient = client.cosmosClient;
            this.database = client.database;
            this.container = client.container;
            this.isInitialized = true;
        }
    }

    async getAllMembers() {
        this.initialize();
        
        try {
            const { resources: items } = await this.container.items
                .readAll()
                .fetchAll();
            
            console.log(`📄 Retrieved ${items.length} members from Cosmos DB`);
            // Log monarchIds for debugging the first few members
            items.slice(0, 3).forEach((item, index) => {
            });
            return items;
        } catch (error) {
            console.error('❌ Error retrieving all members:', error);
            throw error;
        }
    }

    async getMemberById(id) {
        this.initialize();
        
        try {
            const { resource: item } = await this.container.item(id, id).read();
            
            if (item) {
                console.log(`📄 Retrieved member ${id} from Cosmos DB`);
                return item;
            } else {
                console.log(`❌ Member ${id} not found in Cosmos DB`);
                return null;
            }
        } catch (error) {
            if (error.code === 404) {
                console.log(`❌ Member ${id} not found in Cosmos DB`);
                return null;
            }
            console.error(`❌ Error retrieving member ${id}:`, error);
            throw error;
        }
    }

    async createMember(memberData) {
        this.initialize();
        
        try {
            // Ensure the id field is set (required for Cosmos DB)
            if (!memberData.id) {
                // Generate a unique ID based on externalId or timestamp
                memberData.id = memberData.externalId || `member_${Date.now()}`;
            }

            const { resource: createdItem } = await this.container.items.create(memberData);
            
            console.log(`✅ Created member ${createdItem.id} in Cosmos DB`);
            return createdItem;
        } catch (error) {
            console.error('❌ Error creating member:', error);
            throw error;
        }
    }

    async updateMember(id, memberData) {
        this.initialize();
        
        try {
            // Ensure the id field matches the parameter
            memberData.id = id;
            
            const { resource: updatedItem } = await this.container.item(id, id).replace(memberData);
            console.log(`✅ Updated member ${id} in Cosmos DB`);
            return updatedItem;
        } catch (error) {
            if (error.code === 404) {
                console.log(`❌ Member ${id} not found for update in Cosmos DB`);
                return null;
            }
            console.error(`❌ Error updating member ${id}:`, error);
            throw error;
        }
    }

    async deleteMember(id) {
        this.initialize();
        
        try {
            const { resource: deletedItem } = await this.container.item(id, id).delete();
            
            console.log(`✅ Deleted member ${id} from Cosmos DB`);
            return { id, deleted: true };
        } catch (error) {
            if (error.code === 404) {
                console.log(`❌ Member ${id} not found for deletion in Cosmos DB`);
                return null;
            }
            console.error(`❌ Error deleting member ${id}:`, error);
            throw error;
        }
    }

    async searchMembers(query) {
        this.initialize();
        
        try {
            const sqlQuery = {
                query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.name), LOWER(@query)) OR CONTAINS(LOWER(c.notes), LOWER(@query)) OR CONTAINS(LOWER(c.externalId), LOWER(@query))",
                parameters: [{ name: "@query", value: query }]
            };

            const { resources: items } = await this.container.items
                .query(sqlQuery)
                .fetchAll();
            
            return items;
        } catch (error) {
            console.error(`❌ Error searching members with query '${query}':`, error);
            throw error;
        }
    }

    // Bulk import function for migrating JSON data
    async bulkImportMembers(membersArray) {
        this.initialize();
        
        try {
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            console.log(`📥 Starting bulk import of ${membersArray.length} members...`);

            for (const member of membersArray) {
                try {
                    // Ensure the member has an id field (use externalId as id for Cosmos DB)
                    const memberToImport = {
                        ...member,
                        id: member.externalId || member.id || `member_${Date.now()}_${Math.random()}`
                    };

                    const createdItem = await this.createMember(memberToImport);
                    results.push({ success: true, id: createdItem.id, item: createdItem });
                    successCount++;
                } catch (error) {
                    console.error(`❌ Failed to import member ${member.externalId || member.name}:`, error.message);
                    results.push({ success: false, error: error.message, originalItem: member });
                    errorCount++;
                }
            }

            console.log(`✅ Bulk import completed: ${successCount} successful, ${errorCount} failed`);
            return {
                total: membersArray.length,
                successful: successCount,
                failed: errorCount,
                results: results
            };
        } catch (error) {
            console.error('❌ Error during bulk import:', error);
            throw error;
        }
    }

    // Monarchs operations
    async getAllMonarchs() {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            // For now, use JSON file as data source
            const fs = require('fs');
            const path = require('path');
            const monarchsPath = path.join(__dirname, '../../swedish_monarchs.json');
            
            if (fs.existsSync(monarchsPath)) {
                const monarchsData = JSON.parse(fs.readFileSync(monarchsPath, 'utf8'));
                console.log(`📄 Retrieved ${monarchsData.length} monarchs from JSON file`);
                return monarchsData;
            } else {
                console.log('❌ swedish_monarchs.json file not found');
                return [];
            }
        } catch (error) {
            console.error('❌ Error retrieving all monarchs:', error);
            throw error;
        }
    }

    async getMonarch(id) {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            const monarchs = await this.getAllMonarchs();
            const monarch = monarchs.find(m => m.id === id);
            
            if (monarch) {
                console.log(`📄 Retrieved monarch ${id}`);
                return monarch;
            } else {
                console.log(`❌ Monarch ${id} not found`);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error retrieving monarch ${id}:`, error);
            throw error;
        }
    }

    async createMonarch(monarchData) {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            const fs = require('fs');
            const path = require('path');
            const monarchsPath = path.join(__dirname, '../../swedish_monarchs.json');
            
            let monarchs = [];
            if (fs.existsSync(monarchsPath)) {
                monarchs = JSON.parse(fs.readFileSync(monarchsPath, 'utf8'));
            }
            
            // Check if monarch already exists
            const existingMonarch = monarchs.find(m => m.id === monarchData.id);
            if (existingMonarch) {
                throw new Error(`Monarch with ID ${monarchData.id} already exists`);
            }
            
            // Add new monarch
            monarchs.push(monarchData);
            
            // Save back to file
            fs.writeFileSync(monarchsPath, JSON.stringify(monarchs, null, 2));
            
            console.log(`✅ Created monarch ${monarchData.id}`);
            return monarchData;
        } catch (error) {
            console.error('❌ Error creating monarch:', error);
            throw error;
        }
    }

    async updateMonarch(id, monarchData) {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            const fs = require('fs');
            const path = require('path');
            const monarchsPath = path.join(__dirname, '../../swedish_monarchs.json');
            
            let monarchs = [];
            if (fs.existsSync(monarchsPath)) {
                monarchs = JSON.parse(fs.readFileSync(monarchsPath, 'utf8'));
            }
            
            const monarchIndex = monarchs.findIndex(m => m.id === id);
            if (monarchIndex === -1) {
                console.log(`❌ Monarch ${id} not found for update`);
                return null;
            }
            
            // Update monarch
            monarchs[monarchIndex] = { ...monarchs[monarchIndex], ...monarchData, id };
            
            // Save back to file
            fs.writeFileSync(monarchsPath, JSON.stringify(monarchs, null, 2));
            
            console.log(`✅ Updated monarch ${id}`);
            return monarchs[monarchIndex];
        } catch (error) {
            console.error(`❌ Error updating monarch ${id}:`, error);
            throw error;
        }
    }

    async deleteMonarch(id) {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            const fs = require('fs');
            const path = require('path');
            const monarchsPath = path.join(__dirname, '../../swedish_monarchs.json');
            
            let monarchs = [];
            if (fs.existsSync(monarchsPath)) {
                monarchs = JSON.parse(fs.readFileSync(monarchsPath, 'utf8'));
            }
            
            const monarchIndex = monarchs.findIndex(m => m.id === id);
            if (monarchIndex === -1) {
                console.log(`❌ Monarch ${id} not found for deletion`);
                return false;
            }
            
            // Remove monarch
            monarchs.splice(monarchIndex, 1);
            
            // Save back to file
            fs.writeFileSync(monarchsPath, JSON.stringify(monarchs, null, 2));
            
            console.log(`✅ Deleted monarch ${id}`);
            return true;
        } catch (error) {
            console.error(`❌ Error deleting monarch ${id}:`, error);
            throw error;
        }
    }

    async importMonarchsFromJson(monarchsData) {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            const fs = require('fs');
            const path = require('path');
            const monarchsPath = path.join(__dirname, '../../swedish_monarchs.json');
            
            // Save monarchs data to file
            fs.writeFileSync(monarchsPath, JSON.stringify(monarchsData, null, 2));
            
            console.log(`✅ Imported ${monarchsData.length} monarchs from JSON`);
            return {
                successful: monarchsData.length,
                failed: 0,
                errors: [],
                message: `Successfully imported ${monarchsData.length} monarchs`
            };
        } catch (error) {
            console.error('❌ Error importing monarchs from JSON:', error);
            throw error;
        }
    }

    async getMonarchsDuringLifetime(born, died) {
        // Monarchs use JSON file, no Cosmos DB initialization needed
        
        try {
            const monarchs = await this.getAllMonarchs();
            
            // Filter monarchs whose reign overlaps with the person's lifetime
            const relevantMonarchs = monarchs.filter(monarch => {
                const reignStart = new Date(monarch.reignFrom).getFullYear();
                const reignEnd = new Date(monarch.reignTo).getFullYear();
                
                // Check if there's any overlap between the person's life and monarch's reign
                const lifeStart = born;
                const lifeEnd = died || new Date().getFullYear(); // If still alive, use current year
                
                return (reignStart <= lifeEnd && reignEnd >= lifeStart);
            });
            
            console.log(`📄 Found ${relevantMonarchs.length} monarchs during lifetime ${born}-${died}`);
            return relevantMonarchs;
        } catch (error) {
            console.error('❌ Error getting monarchs during lifetime:', error);
            throw error;
        }
    }

    async bulkUpdateMembersWithMonarchIds(options = {}) {
        this.initialize();
        
        try {
            const { dryRun = false } = options;
            const members = await this.getAllMembers();
            const monarchs = await this.getAllMonarchs();
            
            let updated = 0;
            let processed = 0;
            const detailedReport = [];
            
            for (const member of members) {
                processed++;
                
                if (member.born) {
                    const relevantMonarchs = await this.getMonarchsDuringLifetime(member.born, member.died);
                    const monarchIds = relevantMonarchs.map(m => m.id);
                    
                    if (monarchIds.length > 0) {
                        if (!dryRun) {
                            await this.updateMember(member.id, { monarchIds });
                        }
                        updated++;
                        
                        detailedReport.push({
                            memberId: member.id,
                            memberName: member.name,
                            status: dryRun ? 'would_update' : 'updated',
                            monarchCount: monarchIds.length,
                            monarchIds
                        });
                    } else {
                        detailedReport.push({
                            memberId: member.id,
                            memberName: member.name,
                            status: 'no_monarchs_found',
                            reason: 'No monarchs found during lifetime'
                        });
                    }
                } else {
                    detailedReport.push({
                        memberId: member.id,
                        memberName: member.name,
                        status: 'skipped',
                        reason: 'No birth year available'
                    });
                }
            }
            
            const message = dryRun 
                ? `Dry run complete: ${updated} of ${processed} members would be updated with monarch IDs`
                : `Bulk update complete: ${updated} of ${processed} members updated with monarch IDs`;
            
            console.log(`✅ ${message}`);
            
            return {
                updated,
                processed,
                total: members.length,
                dryRun,
                detailedReport,
                message
            };
        } catch (error) {
            console.error('❌ Error bulk updating members with monarch IDs:', error);
            throw error;
        }
    }
}

// Export singleton instance
const cosmosDbService = new CosmosDbService();

module.exports = {
    cosmosDbService,
    CosmosDbService
};