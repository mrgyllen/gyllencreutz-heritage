import { familyMembers, type FamilyMember, type InsertFamilyMember } from "@shared/schema";
import { users, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllFamilyMembers(): Promise<FamilyMember[]>;
  getFamilyMember(id: string): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  searchFamilyMembers(query: string): Promise<FamilyMember[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private familyMembers: Map<string, FamilyMember>;
  private currentUserId: number;
  private currentFamilyId: number;

  constructor() {
    this.users = new Map();
    this.familyMembers = new Map();
    this.currentUserId = 1;
    this.currentFamilyId = 1;
    
    // Initialize with family data
    this.initializeFamilyData();
  }

  private initializeFamilyData() {
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
        name: "Johan Gyllencreutz",
        born: 1610,
        died: null,
        biologicalSex: "Male",
        notes: null,
        father: "0.1",
        ageAtDeath: null,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "7",
        name: "Marina",
        born: 1611,
        died: 1652,
        biologicalSex: "Female",
        notes: "Married (1647) Isak Svinhufvud af Qvalstad (1611–1666)",
        father: "0.1",
        ageAtDeath: 41,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "8",
        name: "Beata",
        born: 1613,
        died: 1639,
        biologicalSex: "Female",
        notes: "Born at Viby, died at Anklam, Pommerania; married (1630) lieutenant-colonel Anders Pedersson Utter (1592–1640)",
        father: "0.1",
        ageAtDeath: 26,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9",
        name: "Alf Gyllencreutz",
        born: 1615,
        died: 1642,
        biologicalSex: "Male",
        notes: "Killed at the battle of Leipzig; married (1634) Catharina Watts (1616)",
        father: "0.1",
        ageAtDeath: 27,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "9.1",
        name: "Johan Adolf Gyllencreutz",
        born: 1636,
        died: null,
        biologicalSex: "Male",
        notes: "Born at Viby, died after 1655 in Poland",
        father: "9",
        ageAtDeath: null,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2",
        name: "Carl Gustaf Gyllencreutz",
        born: 1637,
        died: 1720,
        biologicalSex: "Male",
        notes: "Died at Alby, Botkyrka parish; married (1685) Elisabet Prytz (1652–1732)",
        father: "9",
        ageAtDeath: 83,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "9.2.1",
        name: "Gustaf Adolf Gyllencreutz",
        born: 1685,
        died: 1709,
        biologicalSex: "Male",
        notes: "Killed at the battle of Poltava",
        father: "9.2",
        ageAtDeath: 24,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.2",
        name: "Carl Gustaf Gyllencreutz",
        born: 1686,
        died: 1686,
        biologicalSex: "Male",
        notes: "Died as infant, buried Värmdö church",
        father: "9.2",
        ageAtDeath: 0,
        diedYoung: true,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.3",
        name: "Carl Gustaf Gyllencreutz",
        born: 1688,
        died: 1705,
        biologicalSex: "Male",
        notes: "Died at age 17",
        father: "9.2",
        ageAtDeath: 17,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.4",
        name: "Johan Gyllencreutz",
        born: 1689,
        died: 1737,
        biologicalSex: "Male",
        notes: "Died at Alby, Botkyrka parish; married 1stly (1721) Maria Elisabet Lagerfelt; 2ndly (1727) baroness Elisabet Funck",
        father: "9.2",
        ageAtDeath: 48,
        diedYoung: false,
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: null
      },
      {
        externalId: "9.2.4.1",
        name: "Elisabet Maria",
        born: 1722,
        died: 1799,
        biologicalSex: "Female",
        notes: "Born 18 June 1722 at Alby, died 5 April 1799 at Göstad, Vånga parish",
        father: "9.2.4",
        ageAtDeath: 77,
        diedYoung: false,
        isSuccessionSon: false,
        hasMaleChildren: false,
        nobleBranch: null
      },
      {
        externalId: "9.2.4.2",
        name: "Carl Gustaf Gyllencreutz",
        born: 1723,
        died: 1775,
        biologicalSex: "Male",
        notes: "Born 25 November 1723, died 8 September 1775 at Viby, married 11 May 1749 Beata Margareta Leijonancker",
        father: "9.2.4",
        ageAtDeath: 52,
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
        isSuccessionSon: true,
        hasMaleChildren: true,
        nobleBranch: "Elder line"
      }
    ];

    familyData.forEach(member => {
      const familyMember: FamilyMember = {
        id: this.currentFamilyId++,
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
        nobleBranch: member.nobleBranch
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
      born: member.born ?? null,
      died: member.died ?? null,
      biologicalSex: member.biologicalSex,
      notes: member.notes ?? null,
      father: member.father ?? null,
      ageAtDeath: member.ageAtDeath ?? null,
      diedYoung: member.diedYoung ?? false,
      isSuccessionSon: member.isSuccessionSon ?? false,
      hasMaleChildren: member.hasMaleChildren ?? false,
      nobleBranch: member.nobleBranch ?? null
    };
    this.familyMembers.set(member.externalId, familyMember);
    return familyMember;
  }

  async searchFamilyMembers(query: string): Promise<FamilyMember[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.familyMembers.values()).filter(member =>
      member.name.toLowerCase().includes(lowerQuery) ||
      (member.notes && member.notes.toLowerCase().includes(lowerQuery))
    );
  }
}

export const storage = new MemStorage();
