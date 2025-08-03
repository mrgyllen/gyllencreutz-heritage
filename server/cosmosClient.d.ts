/**
 * Type declarations for CosmosDB client module
 */

export interface CosmosDbMember {
  id: string;
  externalId: string;
  name: string;
  born: number | null;
  died: number | null;
  biologicalSex: string;
  notes: string | null;
  father: string | null;
  ageAtDeath: number | null;
  diedYoung: boolean;
  isSuccessionSon: boolean;
  hasMaleChildren: boolean;
  nobleBranch: string | null;
  monarchDuringLife: string[];
  monarchIds?: string[];
  importedAt?: string;
  importSource?: string;
}

export interface CosmosDbMonarch {
  id: string;
  name: string;
  born: string;
  died: string;
  reignFrom: string;
  reignTo: string;
  quote?: string;
  about?: string;
  portraitFileName?: string;
  importedAt?: string;
  importSource?: string;
}

export interface CosmosClient {
  getAllMembers(): Promise<CosmosDbMember[]>;
  getMemberById(id: string): Promise<CosmosDbMember | null>;
  createMember(memberData: Omit<CosmosDbMember, 'id'>): Promise<CosmosDbMember>;
  updateMember(id: string, memberData: Partial<CosmosDbMember>): Promise<CosmosDbMember | null>;
  deleteMember(id: string): Promise<CosmosDbMember | null>;
  importFromJson(jsonData: any[]): Promise<{ successful: number; failed: number; errors: string[] }>;
  clearAllMembers(): Promise<{ deleted: number }>;
  restoreFromBackup(backupData: any[]): Promise<{ restored: number; failed: number; errors: string[] }>;
  
  // Monarch operations
  getAllMonarchs(): Promise<CosmosDbMonarch[]>;
  getMonarch(id: string): Promise<CosmosDbMonarch | null>;
  createMonarch(monarchData: CosmosDbMonarch): Promise<CosmosDbMonarch>;
  updateMonarch(id: string, monarchData: Partial<CosmosDbMonarch>): Promise<CosmosDbMonarch | null>;
  deleteMonarch(id: string): Promise<boolean>;
  importMonarchsFromJson(jsonData: any[]): Promise<{ successful: number; failed: number; errors: string[] }>;
  
  // Helper methods
  getMonarchsDuringLifetime(born: number, died: number): Promise<CosmosDbMonarch[]>;
  bulkUpdateMembersWithMonarchIds(options?: { dryRun?: boolean }): Promise<{ 
    updated: number; 
    processed: number; 
    total: number; 
    dryRun: boolean;
    detailedReport: Array<{
      memberId: string;
      memberName: string;
      status: string;
      oldMonarchCount?: number;
      newMonarchCount?: number;
      monarchCount?: number;
      monarchIds?: string[];
      reason?: string;
    }>;
    message: string;
  }>;
}

declare const cosmosClient: CosmosClient;
export default cosmosClient;