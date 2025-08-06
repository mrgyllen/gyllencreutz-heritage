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
}

// Export singleton instance
const cosmosDbService = new CosmosDbService();

module.exports = {
    cosmosDbService,
    CosmosDbService
};