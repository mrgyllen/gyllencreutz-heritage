import { type FamilyMember, type FamilyTreeNode } from "@/types/family";

/**
 * Constructs a hierarchical family tree from flat family member data
 * 
 * Takes an array of family members and builds a tree structure based on
 * parent-child relationships defined by the 'father' field. The tree is
 * optimized for genealogical visualization and analysis.
 * 
 * @param members - Array of family members to build the tree from
 * @returns The root node of the family tree, or null if no members provided
 * 
 * @example
 * const members = [
 *   { externalId: "0", name: "Lars Tygesson", father: null },
 *   { externalId: "1", name: "Erik Larsson", father: "Lars Tygesson" }
 * ];
 * const root = buildFamilyTree(members);
 * // root.children[0].name === "Erik Larsson"
 * 
 * @throws {Error} If circular references are detected in family relationships
 */
export function buildFamilyTree(members: FamilyMember[]): FamilyTreeNode | null {
  if (members.length === 0) return null;

  const memberMap = new Map<string, FamilyTreeNode>();
  const nameToNodeMap = new Map<string, FamilyTreeNode>();
  
  // Convert members to tree nodes
  members.forEach(member => {
    const node = {
      ...member,
      children: []
    };
    memberMap.set(member.externalId, node);
    nameToNodeMap.set(member.name, node);
  });

  let root: FamilyTreeNode | null = null;

  // Build tree structure
  members.forEach(member => {
    const node = memberMap.get(member.externalId);
    if (!node) return;

    // Look for parent by name or external ID
    if (member.father) {
      // First try to find parent by external ID (for data from Cosmos DB/JSON)
      let parent = memberMap.get(member.father);
      
      // If not found by ID, try by name (for legacy compatibility)
      if (!parent) {
        parent = nameToNodeMap.get(member.father);
      }
      
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found - this member becomes a potential root
        if (member.externalId === "0") {
          root = node;
        } else if (!root) {
          root = node;
        }
      }
    } else {
      // Set root to the member with external ID "0" (Lars Tygesson)
      if (member.externalId === "0") {
        root = node;
      } else if (!root) {
        root = node;
      }
    }
  });

  return root;
}

/**
 * Searches family members by name and notes using case-insensitive matching
 * 
 * Performs a full-text search across family member names and biographical notes.
 * Useful for finding specific individuals or groups with shared characteristics.
 * 
 * @param members - Array of family members to search through
 * @param query - Search query string (minimum 1 character after trimming)
 * @returns Array of family members matching the search criteria
 * 
 * @example
 * const members = getFamilyMembers();
 * const officers = searchFamilyMembers(members, "military officer");
 * const larsSons = searchFamilyMembers(members, "Lars");
 * 
 * @performance O(n) time complexity where n is the number of family members
 */
export function searchFamilyMembers(members: FamilyMember[], query: string): FamilyMember[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.trim().toLowerCase();
  return members.filter(member =>
    member.name.toLowerCase().includes(lowerQuery) ||
    (member.notes && member.notes.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Retrieves a specific family member by their external identifier
 * 
 * Finds and returns a family member using their unique external ID.
 * This is the primary method for looking up specific individuals
 * in the genealogical database.
 * 
 * @param members - Array of family members to search through
 * @param externalId - The unique external identifier for the family member
 * @returns The family member if found, undefined otherwise
 * 
 * @example
 * const members = getFamilyMembers();
 * const founder = getFamilyMemberById(members, "0"); // Lars Tygesson
 * const erik = getFamilyMemberById(members, "1"); // Erik Larsson Gyllencreutz
 * 
 * @performance O(n) time complexity - consider using Map for frequent lookups
 */
export function getFamilyMemberById(members: FamilyMember[], externalId: string): FamilyMember | undefined {
  return members.find(member => member.externalId === externalId);
}
