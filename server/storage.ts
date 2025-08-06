import { type User, type InsertUser, type FamilyMember, type InsertFamilyMember } from "@shared/schema";
import { GitHubSync } from "./github-sync";

// GitHub sync instance (will be initialized later)
let gitHubSync: GitHubSync | null = null;

// Function to initialize GitHub sync (called after env vars are loaded)
function initializeGitHubSync() {
  console.log('  GITHUB_TOKEN:', process.env.GITHUB_TOKEN ? 'SET' : 'MISSING');
  console.log('  GITHUB_REPO_OWNER:', process.env.GITHUB_REPO_OWNER || 'MISSING');
  console.log('  GITHUB_REPO_NAME:', process.env.GITHUB_REPO_NAME || 'MISSING');
  
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO_OWNER && process.env.GITHUB_REPO_NAME) {
    gitHubSync = new GitHubSync({
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME
    });
    console.log('✅ GitHub sync initialized');
  } else {
    console.log('⚠️ GitHub sync disabled - missing environment variables');
  }
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllFamilyMembers(): Promise<FamilyMember[]>;
  getFamilyMember(id: string): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  searchFamilyMembers(query: string): Promise<FamilyMember[]>;
  updateFamilyMember(externalId: string, updateData: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(externalId: string): Promise<FamilyMember | undefined>;
  bulkUpdateFamilyMembers(members: InsertFamilyMember[]): Promise<{ updated: number; created: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private familyMembers: Map<string, FamilyMember>;
  private currentUserId: number;
  private currentFamilyId: number;
  private isInitialized: boolean = false;

  constructor() {
    this.users = new Map();
    this.familyMembers = new Map();
    this.currentUserId = 1;
    this.currentFamilyId = 1;
    
    // Initialize with family data
    this.initializeFamilyData().catch((err) => {
      console.error('Failed to initialize family data:', err);
    });
  }

  private async initializeFamilyData() {
    // Load the complete family data from the flat JSON file
    try {
      const { readFileSync } = await import('fs');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = await import('path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const filePath = join(__dirname, '../attached_assets/Gyllencreutz_Ancestry_Flat_CLEAN_Final_1752612544769.json');
      
      const rawData = readFileSync(filePath, 'utf8');
      // Handle NaN values in JSON by replacing them with null
      const cleanedData = rawData.replace(/: NaN/g, ': null');
      const flatData = JSON.parse(cleanedData);
      
      // Convert JSON data to our format
      const familyData = flatData.map((member: any) => ({
        externalId: member.ID,
        name: member.Name,
        born: member.Born === null ? null : member.Born,
        died: member.Died === null || member.Died === 9999 ? null : member.Died,
        biologicalSex: member.BiologicalSex || 'Unknown',
        notes: member.Notes || null,
        father: member.Father === null || member.Father === 'NaN' || member.Father === undefined ? null : member.Father,
        ageAtDeath: member.AgeAtDeath === null ? null : member.AgeAtDeath,
        diedYoung: member.DiedYoung === null ? false : member.DiedYoung,
        isSuccessionSon: member.IsSuccessionSon === null ? false : member.IsSuccessionSon,
        hasMaleChildren: member.HasMaleChildren === null ? false : member.HasMaleChildren,
        nobleBranch: member.NobleBranch === null || member.NobleBranch === 'NaN' || member.NobleBranch === undefined ? null : member.NobleBranch,
        monarchDuringLife: (() => {
          try {
            if (typeof member.MonarchDuringLife === 'string') {
              // Handle Python-style array format with single quotes
              const cleanedString = member.MonarchDuringLife.replace(/'/g, '"');
              return JSON.parse(cleanedString);
            } else if (Array.isArray(member.MonarchDuringLife)) {
              return member.MonarchDuringLife;
            }
            return [];
          } catch (e) {
            console.log('Failed to parse MonarchDuringLife for', member.Name, ':', member.MonarchDuringLife);
            return [];
          }
        })()
      }));
      
      // Initialize family members
      familyData.forEach((member: any) => {
        const familyMember: FamilyMember = {
          id: this.currentFamilyId++,
          ...member
        };
        this.familyMembers.set(member.externalId, familyMember);
      });
      
      console.log(`Loaded ${familyData.length} family members with complete monarchs data`);
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Error loading family data from JSON:', error);
      
      // Fallback to basic data if JSON loading fails
      const familyData = [
      {
        externalId: "0",
        name: "Lars Tygesson",
        born: 1515,
        died: 1559,
        biologicalSex: "Male",
        notes: "Stable-master of the Duke of Holstein",
        father: null,
        ageAtDeath: 44,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "0.1",
        name: "Tyge Larsson (Gyllencreutz)",
        born: 1545,
        died: 1625,
        biologicalSex: "Male",
        notes: "Ennobled in Sweden, buried Östra Ryd church. Married 1stly Kerstin Marbo, 2ndly Brita Alfsdotter (d. 1616), 3rdly Catharina von Masenbach.",
        father: "0",
        ageAtDeath: 80,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "1",
        name: "Johan Gyllencreutz",
        born: 1575,
        died: 1580,
        biologicalSex: "Male",
        notes: "Died from the plague, buried Östra Ryd church",
        father: "0.1",
        ageAtDeath: 5,
        diedYoung: true,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "2",
        name: "Lars (Tygesson) Gyllencreutz",
        born: 1576,
        died: 1623,
        biologicalSex: "Male",
        notes: "Buried Östra Ryd church. Married baroness Christina Oxenstierna (1619)",
        father: "0.1",
        ageAtDeath: 47,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "3",
        name: "Marina",
        born: 1578,
        died: 1578,
        biologicalSex: "Female",
        notes: "Buried Östra Ryd church",
        father: "0.1",
        ageAtDeath: 0,
        diedYoung: true,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "4",
        name: "Kerstin",
        born: 1608,
        died: 1647,
        biologicalSex: "Female",
        notes: "Born at Viby",
        father: "0.1",
        ageAtDeath: 39,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "5",
        name: "Anna",
        born: 1609,
        died: null,
        biologicalSex: "Female",
        notes: "Married 1stly morganatically a commoner; 2ndly (1629) Louis de Devane (Svanestierna)",
        father: "0.1",
        ageAtDeath: null,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "6",
        name: "Barbro",
        born: 1610,
        died: 1670,
        biologicalSex: "Female",
        notes: "Married 1stly Erik Eriksson (Törnflycht); 2ndly (1639) Krister Kristerson (Oxenstierna)",
        father: "0.1",
        ageAtDeath: 60,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "7",
        name: "Catharina",
        born: 1611,
        died: 1671,
        biologicalSex: "Female",
        notes: "Married (1633) Bernt Oxenstierna",
        father: "0.1",
        ageAtDeath: 60,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "8",
        name: "Margareta",
        born: 1612,
        died: 1686,
        biologicalSex: "Female",
        notes: "Married (1639) Pontus Fredrik de la Gardie",
        father: "0.1",
        ageAtDeath: 74,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9",
        name: "Tyge Gyllencreutz",
        born: 1613,
        died: 1677,
        biologicalSex: "Male",
        notes: "Married (1639) Märtha Stake (d. 1701)",
        father: "0.1",
        ageAtDeath: 64,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "9.1",
        name: "Tyge Gyllencreutz",
        born: 1643,
        died: 1684,
        biologicalSex: "Male",
        notes: "Married (1664) Elisabet Oxenstierna (d. 1719)",
        father: "9",
        ageAtDeath: 41,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2",
        name: "Catharina Gyllencreutz",
        born: 1645,
        died: 1718,
        biologicalSex: "Female",
        notes: "Married (1667) Gustav Adolph Lewenhaupt",
        father: "9",
        ageAtDeath: 73,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.1",
        name: "Gustaf Mauritz Gyllencreutz",
        born: 1647,
        died: 1723,
        biologicalSex: "Male",
        notes: "Married (1675) Emerentia Oxenstierna (d. 1725)",
        father: "9",
        ageAtDeath: 76,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "9.2.2",
        name: "Anna Margareta Gyllencreutz",
        born: 1649,
        died: 1722,
        biologicalSex: "Female",
        notes: "Married (1668) Bengt Oxenstierna",
        father: "9",
        ageAtDeath: 73,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.3",
        name: "Helena Charlotta Gyllencreutz",
        born: 1651,
        died: 1738,
        biologicalSex: "Female",
        notes: "Married (1674) Didrik Falkenberg",
        father: "9",
        ageAtDeath: 87,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.4",
        name: "Carl Magnus Gyllencreutz",
        born: 1679,
        died: 1755,
        biologicalSex: "Male",
        notes: "Married (1709) Margareta Elisabet Oxenstierna (d. 1756)",
        father: "9.2.1",
        ageAtDeath: 76,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "9.2.4.1",
        name: "Gustaf Mauritz Gyllencreutz",
        born: 1710,
        died: 1788,
        biologicalSex: "Male",
        notes: "Married (1736) Ulrika Eleonora Oxenstierna (d. 1792)",
        father: "9.2.4",
        ageAtDeath: 78,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.4.2",
        name: "Carl Gustaf Gyllencreutz",
        born: 1711,
        died: 1792,
        biologicalSex: "Male",
        notes: "Married (1739) Christina Charlotta Oxenstierna (d. 1799)",
        father: "9.2.4",
        ageAtDeath: 81,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: "Elder line"
      },
      {
        externalId: "9.2.4.2.1",
        name: "Johan Fredrik Gyllencreutz",
        born: 1753,
        died: 1833,
        biologicalSex: "Male",
        notes: "Born 15 April 1753 at Tomtaholm, died 19 January 1833, married 13 October 1786 Christina Fredrika Löwen",
        father: "9.2.4.2",
        ageAtDeath: 80,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: "Elder line"
      },
      {
        externalId: "9.2.4.2.2",
        name: "Alf Gyllencreutz",
        born: 1754,
        died: 1832,
        biologicalSex: "Male",
        notes: "Born 8 December 1754 at Tomtaholm, died 11 March 1832 at Linköping, married 1stly 1777 Gustava Christina Bögwald; 2ndly 1800 Brita Christina le Moine",
        father: "9.2.4.2",
        ageAtDeath: 78,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: true,
        nobleBranch: "Elder line"
      },
      {
        externalId: "9.2.4.2.2.1",
        name: "Carl Fredrik Gyllencreutz",
        born: 1778,
        died: 1859,
        biologicalSex: "Male",
        notes: "Son of Alf Gyllencreutz, continued the family line",
        father: "9.2.4.2.2",
        ageAtDeath: 81,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: "Elder line"
      },
      {
        externalId: "9.2.4.2.1.1",
        name: "Gustaf Mauritz Gyllencreutz",
        born: 1787,
        died: 1862,
        biologicalSex: "Male",
        notes: "Son of Johan Fredrik Gyllencreutz, military officer",
        father: "9.2.4.2.1",
        ageAtDeath: 75,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: "Elder line"
      }
    ];

    // Initialize family members from the fallback data
    familyData.forEach(member => {
      const familyMember: FamilyMember = {
        id: this.currentFamilyId++,
        externalId: member.externalId,
        name: member.name,
        generation: null,
        born: member.born ?? null,
        died: member.died ?? null,
        biologicalSex: member.biologicalSex,
        notes: member.notes ?? null,
        father: member.father ?? null,
        ageAtDeath: member.ageAtDeath ?? null,
        diedYoung: member.diedYoung ?? false,
        isSuccessionSon: member.isSuccessionSon ?? false,
        hasMaleChildren: member.hasMaleChildren ?? false,
        nobleBranch: member.nobleBranch ?? null,
        monarchDuringLife: [],
        monarchIds: []
      };
      this.familyMembers.set(member.externalId, familyMember);
    });

    console.log(`Loaded ${familyData.length} family members from fallback data`);
    this.isInitialized = true;
    }
  }

  private initializeFallbackData() {
    const basicFamilyData = [
      {
        externalId: "0",
        name: "Lars Tygesson",
        born: 1515,
        died: 1559,
        biologicalSex: "Male",
        notes: "Stable-master of the Duke of Holstein",
        father: null,
        ageAtDeath: 44,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "0.1",
        name: "Tyge Larsson (Gyllencreutz)",
        born: 1545,
        died: 1625,
        biologicalSex: "Male",
        notes: "Ennobled in Sweden, buried Östra Ryd church. Married 1stly Kerstin Marbo, 2ndly Brita Alfsdotter (d. 1616), 3rdly Catharina von Masenbach.",
        father: "0",
        ageAtDeath: 80,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      }
    ];

    basicFamilyData.forEach(member => {
      const familyMember: FamilyMember = {
        id: this.currentFamilyId++,
        externalId: member.externalId,
        name: member.name,
        generation: null,
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
        monarchDuringLife: [],
        monarchIds: []
      };
      this.familyMembers.set(member.externalId, familyMember);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllFamilyMembers(): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values());
  }

  async getFamilyMember(externalId: string): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(externalId);
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const familyMember: FamilyMember = {
      id: this.currentFamilyId++,
      externalId: member.externalId,
      name: member.name,
      generation: member.generation ?? null,
      born: member.born ?? null,
      died: member.died ?? null,
      biologicalSex: member.biologicalSex,
      notes: member.notes ?? null,
      father: member.father ?? null,
      ageAtDeath: member.ageAtDeath ?? null,
      diedYoung: member.diedYoung ?? null,
      isSuccessionSon: member.isSuccessionSon ?? null,
      hasMaleChildren: member.hasMaleChildren ?? null,
      nobleBranch: member.nobleBranch ?? null,
      monarchDuringLife: member.monarchDuringLife ?? null,
      monarchIds: []
    };
    this.familyMembers.set(member.externalId, familyMember);
    
    // Persist to file system
    await this.persistToFile();
    
    // Sync to GitHub if available
    if (gitHubSync) {
      try {
        const allMembers = Array.from(this.familyMembers.values());
        await gitHubSync.syncFamilyData('create', familyMember, allMembers);
        console.log('✅ New member synced to GitHub:', familyMember.name);
      } catch (error) {
        console.error('❌ GitHub sync failed for create:', error);
        // Don't throw error - local create succeeded
      }
    }
    
    return familyMember;
  }

  async searchFamilyMembers(query: string): Promise<FamilyMember[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.familyMembers.values()).filter(member =>
      member.name.toLowerCase().includes(lowerQuery) ||
      (member.notes && member.notes.toLowerCase().includes(lowerQuery))
    );
  }

  async updateFamilyMember(externalId: string, updateData: Partial<InsertFamilyMember>): Promise<FamilyMember | undefined> {
    const existingMember = this.familyMembers.get(externalId);
    if (!existingMember) {
      return undefined;
    }

    const updatedMember: FamilyMember = {
      ...existingMember,
      ...updateData,
      id: existingMember.id, // Preserve original ID
      externalId: existingMember.externalId, // Preserve original externalId
    };

    this.familyMembers.set(externalId, updatedMember);
    
    // Persist changes to file system
    await this.persistToFile();
    
    // Sync to GitHub if available
    if (gitHubSync) {
      try {
        const allMembers = Array.from(this.familyMembers.values());
        await gitHubSync.syncFamilyData('update', updatedMember, allMembers);
        console.log('✅ Updated member synced to GitHub:', updatedMember.name);
      } catch (error) {
        console.error('❌ GitHub sync failed for update:', error);
        // Don't throw error - local save succeeded
      }
    }
    
    return updatedMember;
  }

  async deleteFamilyMember(externalId: string): Promise<FamilyMember | undefined> {
    const member = this.familyMembers.get(externalId);
    if (!member) {
      return undefined;
    }

    this.familyMembers.delete(externalId);
    
    // Persist changes to file system
    await this.persistToFile();
    
    // Sync to GitHub if available
    if (gitHubSync) {
      try {
        const allMembers = Array.from(this.familyMembers.values());
        await gitHubSync.syncFamilyData('delete', member, allMembers);
        console.log('✅ Deleted member synced to GitHub:', member.name);
      } catch (error) {
        console.error('❌ GitHub sync failed for delete:', error);
        // Don't throw error - local delete succeeded
      }
    }
    
    return member;
  }

  async bulkUpdateFamilyMembers(members: InsertFamilyMember[]): Promise<{ updated: number; created: number }> {
    // Create backup before bulk operation
    if (gitHubSync) {
      try {
        const currentData = Array.from(this.familyMembers.values());
        await gitHubSync.createBackup(currentData, 'auto-bulk');
        console.log('✅ Auto-backup created before bulk update');
      } catch (error) {
        console.warn('⚠️ Failed to create GitHub backup, proceeding with local backup');
        await this.createBackup();
      }
    } else {
      await this.createBackup();
    }
    
    let updated = 0;
    let created = 0;
    
    for (const memberData of members) {
      const existingMember = this.familyMembers.get(memberData.externalId);
      
      if (existingMember) {
        // Update existing member
        const updatedMember: FamilyMember = {
          ...existingMember,
          externalId: memberData.externalId,
          name: memberData.name,
          generation: memberData.generation ?? existingMember.generation,
          born: memberData.born ?? existingMember.born,
          died: memberData.died ?? existingMember.died,
          biologicalSex: memberData.biologicalSex,
          notes: memberData.notes ?? existingMember.notes,
          father: memberData.father ?? existingMember.father,
          ageAtDeath: memberData.ageAtDeath ?? existingMember.ageAtDeath,
          diedYoung: memberData.diedYoung ?? existingMember.diedYoung,
          isSuccessionSon: memberData.isSuccessionSon ?? existingMember.isSuccessionSon,
          hasMaleChildren: memberData.hasMaleChildren ?? existingMember.hasMaleChildren,
          nobleBranch: memberData.nobleBranch ?? existingMember.nobleBranch,
          monarchDuringLife: memberData.monarchDuringLife ?? existingMember.monarchDuringLife,
          monarchIds: existingMember.monarchIds ?? [],
          id: existingMember.id, // Preserve original ID
        };
        this.familyMembers.set(memberData.externalId, updatedMember);
        updated++;
      } else {
        // Create new member
        const newMember: FamilyMember = {
          id: this.currentFamilyId++,
          externalId: memberData.externalId,
          name: memberData.name,
          generation: memberData.generation ?? null,
          born: memberData.born ?? null,
          died: memberData.died ?? null,
          biologicalSex: memberData.biologicalSex,
          notes: memberData.notes ?? null,
          father: memberData.father ?? null,
          ageAtDeath: memberData.ageAtDeath ?? null,
          diedYoung: memberData.diedYoung ?? null,
          isSuccessionSon: memberData.isSuccessionSon ?? null,
          hasMaleChildren: memberData.hasMaleChildren ?? null,
          nobleBranch: memberData.nobleBranch ?? null,
          monarchDuringLife: memberData.monarchDuringLife ?? null,
          monarchIds: []
        };
        this.familyMembers.set(memberData.externalId, newMember);
        created++;
      }
    }
    
    // Persist changes to file system
    await this.persistToFile();
    
    // Sync to GitHub if available
    if (gitHubSync) {
      try {
        const allMembers = Array.from(this.familyMembers.values());
        await gitHubSync.syncFamilyData('bulk', { count: updated + created }, allMembers);
        console.log('✅ Bulk update synced to GitHub:', `${updated} updated, ${created} created`);
      } catch (error) {
        console.error('❌ GitHub sync failed for bulk update:', error);
        // Don't throw error - local bulk update succeeded
      }
    }
    
    return { updated, created };
  }

  private async persistToFile(): Promise<void> {
    try {
      const { writeFileSync } = await import('fs');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = await import('path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const filePath = join(__dirname, '../attached_assets/Gyllencreutz_Ancestry_Flat_CLEAN_Final_1752612544769.json');
      
      // Convert family members back to original JSON format
      const familyArray = Array.from(this.familyMembers.values()).map(member => ({
        ID: member.externalId,
        Name: member.name,
        Born: member.born,
        Died: member.died,
        BiologicalSex: member.biologicalSex,
        Notes: member.notes,
        Father: member.father,
        AgeAtDeath: member.ageAtDeath,
        DiedYoung: member.diedYoung,
        IsSuccessionSon: member.isSuccessionSon,
        HasMaleChildren: member.hasMaleChildren,
        NobleBranch: member.nobleBranch,
        MonarchDuringLife: JSON.stringify(member.monarchDuringLife || [])
      }));
      
      const jsonData = JSON.stringify(familyArray, null, 2);
      writeFileSync(filePath, jsonData, 'utf8');
      
      console.log(`Persisted ${familyArray.length} family members to file`);
    } catch (error) {
      console.error('Error persisting data to file:', error);
      throw new Error('Failed to persist data changes');
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const { writeFileSync } = await import('fs');
      const { fileURLToPath } = await import('url');
      const { dirname, join } = await import('path');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = join(__dirname, `../attached_assets/backup_${timestamp}.json`);
      
      // Create backup of current data
      const familyArray = Array.from(this.familyMembers.values()).map(member => ({
        ID: member.externalId,
        Name: member.name,
        Born: member.born,
        Died: member.died,
        BiologicalSex: member.biologicalSex,
        Notes: member.notes,
        Father: member.father,
        AgeAtDeath: member.ageAtDeath,
        DiedYoung: member.diedYoung,
        IsSuccessionSon: member.isSuccessionSon,
        HasMaleChildren: member.hasMaleChildren,
        NobleBranch: member.nobleBranch,
        MonarchDuringLife: JSON.stringify(member.monarchDuringLife || [])
      }));
      
      const jsonData = JSON.stringify(familyArray, null, 2);
      writeFileSync(backupPath, jsonData, 'utf8');
      
      console.log(`Created backup at ${backupPath}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create backup');
    }
  }
}

export const storage = new MemStorage();

// Export GitHub sync instance for use in routes  
export { gitHubSync };

// Export the initialization function for use in main server file
export { initializeGitHubSync };