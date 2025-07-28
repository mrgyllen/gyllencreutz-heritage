import { CosmosClient } from '@azure/cosmos';

class CosmosDbClient {
  constructor() {
    this.endpoint = process.env.COSMOS_DB_ENDPOINT;
    this.key = process.env.COSMOS_DB_PRIMARY_KEY;
    this.databaseId = process.env.COSMOS_DB_DATABASE_ID || 'familyTreeDb';
    this.containerId = process.env.COSMOS_DB_CONTAINER_ID || 'members';

    if (!this.endpoint || !this.key) {
      throw new Error('Cosmos DB endpoint and key must be provided');
    }

    this.client = new CosmosClient({ endpoint: this.endpoint, key: this.key });
    this.database = this.client.database(this.databaseId);
    this.container = this.database.container(this.containerId);
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
      const { resource } = await this.container.item(id, id).replace(memberData);
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
}

export default new CosmosDbClient();