import { CosmosClient } from '@azure/cosmos';

class CosmosDbClient {
  constructor() {
    this.endpoint = process.env.COSMOS_DB_ENDPOINT;
    this.key = process.env.COSMOS_DB_PRIMARY_KEY;
    this.databaseId = process.env.COSMOS_DB_DATABASE_ID || 'familyTreeDb';
    this.containerId = process.env.COSMOS_DB_CONTAINER_ID || 'members';
    this.monarchsContainerId = process.env.COSMOS_DB_MONARCHS_CONTAINER_ID || 'monarchs';

    if (!this.endpoint || !this.key) {
      throw new Error('Cosmos DB endpoint and key must be provided');
    }

    this.client = new CosmosClient({ endpoint: this.endpoint, key: this.key });
    this.database = this.client.database(this.databaseId);
    this.container = this.database.container(this.containerId);
    this.monarchsContainer = this.database.container(this.monarchsContainerId);
  }

  async getAllMembers() {
    try {
      const { resources } = await this.container.items.readAll().fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching all members:', error);
      throw error;
    }
  }

  async getMember(id) {
    try {
      const { resource } = await this.container.item(id, id).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error fetching member:', error);
      throw error;
    }
  }

  async createMember(memberData) {
    try {
      const now = new Date().toISOString();
      const memberWithMetadata = {
        ...memberData,
        importedAt: now,
        importSource: 'admin-db'
      };

      // Ensure id is set (use externalId if id is not provided)
      if (!memberWithMetadata.id) {
        memberWithMetadata.id = memberWithMetadata.externalId;
      }

      const { resource } = await this.container.items.create(memberWithMetadata);
      return resource;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  }

  async updateMember(id, memberData) {
    try {
      // First get the existing member to preserve required Cosmos DB fields
      const existingMember = await this.getMember(id);
      if (!existingMember) {
        return null;
      }
      
      // Merge the existing member with the new data, ensuring id is preserved
      const updatedMember = {
        ...existingMember,
        ...memberData,
        id: id // Ensure id is always present for Cosmos DB
      };
      
      const { resource } = await this.container.item(id, id).replace(updatedMember);
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error updating member:', error);
      throw error;
    }
  }

  async deleteMember(id) {
    try {
      await this.container.item(id, id).delete();
      return true;
    } catch (error) {
      if (error.code === 404) {
        return false;
      }
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  async importFromJson(jsonMembers) {
    const results = { successful: 0, failed: 0, errors: [] };
    const now = new Date().toISOString();

    for (const member of jsonMembers) {
      try {
        const cosmosDbMember = {
          id: member.externalId,
          externalId: member.externalId,
          name: member.name,
          born: member.born,
          died: member.died,
          biologicalSex: member.biologicalSex || 'Unknown',
          notes: member.notes,
          father: member.father,
          ageAtDeath: member.ageAtDeath,
          diedYoung: member.diedYoung || false,
          isSuccessionSon: member.isSuccessionSon || false,
          hasMaleChildren: member.hasMaleChildren || false,
          nobleBranch: member.nobleBranch,
          monarchDuringLife: member.monarchDuringLife || [],
          importedAt: now,
          importSource: 'json-import'
        };

        await this.container.items.upsert(cosmosDbMember);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          externalId: member.externalId,
          error: error.message
        });
      }
    }

    return {
      summary: results,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`
    };
  }

  async clearAllMembers() {
    try {
      const { resources } = await this.container.items.readAll().fetchAll();
      let deleted = 0;

      for (const member of resources) {
        await this.container.item(member.id, member.id).delete();
        deleted++;
      }

      return { deleted, message: `Deleted ${deleted} members from Cosmos DB` };
    } catch (error) {
      console.error('Error clearing all members:', error);
      throw error;
    }
  }

  // Monarch operations
  async getAllMonarchs() {
    try {
      const { resources } = await this.monarchsContainer.items.readAll().fetchAll();
      return resources;
    } catch (error) {
      console.error('Error fetching all monarchs:', error);
      throw error;
    }
  }

  async getMonarch(id) {
    try {
      const { resource } = await this.monarchsContainer.item(id, id).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error fetching monarch:', error);
      throw error;
    }
  }

  async createMonarch(monarchData) {
    try {
      // Ensure id is provided
      if (!monarchData.id) {
        throw new Error('Monarch ID is required');
      }

      const { resource } = await this.monarchsContainer.items.create(monarchData);
      return resource;
    } catch (error) {
      console.error('Error creating monarch:', error);
      throw error;
    }
  }

  async updateMonarch(id, monarchData) {
    try {
      const { resource } = await this.monarchsContainer.item(id, id).replace(monarchData);
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error updating monarch:', error);
      throw error;
    }
  }

  async deleteMonarch(id) {
    try {
      await this.monarchsContainer.item(id, id).delete();
      return true;
    } catch (error) {
      if (error.code === 404) {
        return false;
      }
      console.error('Error deleting monarch:', error);
      throw error;
    }
  }

  async importMonarchsFromJson(jsonMonarchs) {
    const results = { successful: 0, failed: 0, errors: [] };

    for (const monarch of jsonMonarchs) {
      try {
        // Ensure id is provided
        if (!monarch.id) {
          throw new Error('Monarch ID is required');
        }

        const cosmosDbMonarch = {
          ...monarch,
          importedAt: new Date().toISOString(),
          importSource: 'json-import'
        };

        await this.monarchsContainer.items.upsert(cosmosDbMonarch);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          id: monarch.id || 'unknown',
          error: error.message
        });
      }
    }

    return {
      summary: results,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`
    };
  }

  // Helper method to find monarchs during a family member's lifetime
  async getMonarchsDuringLifetime(born, died) {
    try {
      // Validate inputs
      if (born === null || born === undefined) {
        return [];
      }

      // Special case: if died is 9999, only get monarch during born year
      if (died === 9999) {
        // Convert born year to date for comparison (using January 1st)
        const bornDate = new Date(`${born}-01-01`);
        
        // Filter monarchs in memory since we need to compare actual dates
        const allMonarchs = await this.getAllMonarchs();
        return allMonarchs.filter(monarch => {
          const reignFromDate = new Date(monarch.reignFrom);
          const reignToDate = new Date(monarch.reignTo);
          return reignFromDate <= bornDate && reignToDate >= bornDate;
        });
      } else {
        // Validate died year
        if (died === null || died === undefined) {
          return [];
        }

        // Convert years to dates for comparison
        const bornDate = new Date(`${born}-01-01`);
        const diedDate = new Date(`${died}-12-31`);
        
        // Filter monarchs in memory since we need to compare actual dates
        const allMonarchs = await this.getAllMonarchs();
        return allMonarchs.filter(monarch => {
          const reignFromDate = new Date(monarch.reignFrom);
          const reignToDate = new Date(monarch.reignTo);
          
          // Check if reign overlaps with lifetime
          // Reign overlaps if: reignStart <= lifetimeEnd AND reignEnd >= lifetimeStart
          return reignFromDate <= diedDate && reignToDate >= bornDate;
        });
      }
    } catch (error) {
      console.error('Error fetching monarchs during lifetime:', error);
      throw error;
    }
  }

  // Bulk update family members with monarch IDs using date-based calculation
  async bulkUpdateMembersWithMonarchIds(options = {}) {
    const { dryRun = false } = options;
    
    try {
      const members = await this.getAllMembers();
      let updatedCount = 0;
      let processedCount = 0;
      const detailedReport = [];
      
      console.log(`${dryRun ? 'DRY RUN' : 'EXECUTING'}: Bulk updating ${members.length} family members with monarch IDs`);

      for (const member of members) {
        // Skip members without born date
        if (member.born === null || member.born === undefined) {
          detailedReport.push({
            memberId: member.id,
            memberName: member.name,
            status: 'skipped',
            reason: 'No birth date available'
          });
          continue;
        }

        // Get monarchs that reigned during this member's lifetime
        const monarchsDuringLifetime = await this.getMonarchsDuringLifetime(member.born, member.died || 9999);
        const monarchIds = monarchsDuringLifetime.map(monarch => monarch.id);
        
        processedCount++;

        // Check if update is needed
        const currentMonarchIds = member.monarchIds || [];
        const needsUpdate = JSON.stringify(currentMonarchIds.sort()) !== JSON.stringify(monarchIds.sort());
        
        if (needsUpdate) {
          detailedReport.push({
            memberId: member.id,
            memberName: member.name,
            status: dryRun ? 'would_update' : 'updated',
            oldMonarchCount: currentMonarchIds.length,
            newMonarchCount: monarchIds.length,
            monarchIds: monarchIds
          });
          
          if (!dryRun) {
            const updatedMember = {
              ...member,
              monarchIds: monarchIds
            };

            await this.updateMember(member.id, updatedMember);
            updatedCount++;
          } else {
            updatedCount++; // Count what would be updated
          }
        } else {
          detailedReport.push({
            memberId: member.id,
            memberName: member.name,
            status: 'no_change',
            monarchCount: monarchIds.length
          });
        }
      }

      const result = { 
        updated: updatedCount, 
        processed: processedCount,
        total: members.length,
        dryRun: dryRun,
        detailedReport: detailedReport,
        message: `${dryRun ? 'DRY RUN - Would update' : 'Updated'} ${updatedCount} of ${processedCount} processed family members with monarch IDs` 
      };
      
      console.log(`${dryRun ? 'DRY RUN' : 'EXECUTED'}: ${result.message}`);
      return result;
    } catch (error) {
      console.error('Error bulk updating members with monarch IDs:', error);
      throw error;
    }
  }
}

export default new CosmosDbClient();