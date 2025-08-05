export interface FamilyMember {
  id: number;
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
  monarchDuringLife?: string[]; // Legacy field - being phased out in favor of monarchIds
  monarchIds?: string[]; // Monarch relationship IDs (e.g., ["gustav-i-vasa", "erik-xiv"]) - allow optional for migration
  generation?: number;
}

export interface FamilyTreeNode extends FamilyMember {
  children: FamilyTreeNode[];
  x?: number;
  y?: number;
  depth?: number;
}

export interface TreeDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Monarch interface for Swedish monarchs
export interface Monarch {
  id: string; // Unique identifier (e.g., "gustav-i-vasa")
  name: string; // Full name (e.g., "Gustav I Vasa")
  born: string; // ISO date format (e.g., "1496-05-12")
  died: string; // ISO date format (e.g., "1560-09-29")
  reignFrom: string; // ISO date format (e.g., "1523-06-06")
  reignTo: string; // ISO date format (e.g., "1560-09-29")
  quote?: string; // Famous quote
  about?: string; // Description/biography
  portraitFileName?: string; // Image filename for portrait
}

// Cosmos DB-specific types
export interface CosmosDbFamilyMember {
  id: string; // Cosmos DB document ID (partition key)
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
  monarchDuringLife?: string[]; // Legacy field - being phased out in favor of monarchIds
  monarchIds?: string[]; // Monarch relationship IDs (e.g., ["gustav-i-vasa", "erik-xiv"]) - allow optional for migration
  importedAt?: string;
  importSource?: string;
  _rid?: string; // Cosmos DB resource ID
  _self?: string; // Cosmos DB self link
  _etag?: string; // Cosmos DB etag for optimistic concurrency
  _attachments?: string; // Cosmos DB attachments
  _ts?: number; // Cosmos DB timestamp
}

export interface CreateCosmosDbFamilyMember extends Omit<CosmosDbFamilyMember, 'id' | '_rid' | '_self' | '_etag' | '_attachments' | '_ts' | 'importedAt' | 'importSource' | 'notes' | 'father' | 'nobleBranch' | 'ageAtDeath' | 'diedYoung' | 'isSuccessionSon' | 'hasMaleChildren'> {
  id?: string; // Optional for creation, will be generated if not provided
  notes?: string | null; // Allow undefined for form handling
  father?: string | null; // Allow undefined for form handling
  nobleBranch?: string | null; // Allow undefined for form handling
  ageAtDeath?: number | null; // Allow undefined for form handling
  diedYoung?: boolean; // Allow undefined for form handling
  isSuccessionSon?: boolean; // Allow undefined for form handling
  hasMaleChildren?: boolean; // Allow undefined for form handling
  monarchDuringLife?: string[]; // Legacy field - allow undefined for form handling
}

export interface ImportStatus {
  jsonFile: {
    count: number;
    available: boolean;
  };
  cosmosDb: {
    count: number;
    available: boolean;
  };
  needsImport: boolean;
  inSync: boolean;
}
