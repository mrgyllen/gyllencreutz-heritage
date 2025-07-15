import { type FamilyMember, type FamilyTreeNode } from "@/types/family";

export function buildFamilyTree(members: FamilyMember[]): FamilyTreeNode | null {
  if (members.length === 0) return null;

  const memberMap = new Map<string, FamilyTreeNode>();
  
  // Convert members to tree nodes
  members.forEach(member => {
    memberMap.set(member.externalId, {
      ...member,
      children: []
    });
  });

  let root: FamilyTreeNode | null = null;

  // Build tree structure
  members.forEach(member => {
    const node = memberMap.get(member.externalId);
    if (!node) return;

    if (member.father && memberMap.has(member.father)) {
      const parent = memberMap.get(member.father);
      parent?.children.push(node);
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

export function searchFamilyMembers(members: FamilyMember[], query: string): FamilyMember[] {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  return members.filter(member =>
    member.name.toLowerCase().includes(lowerQuery) ||
    (member.notes && member.notes.toLowerCase().includes(lowerQuery))
  );
}

export function getFamilyMemberById(members: FamilyMember[], externalId: string): FamilyMember | undefined {
  return members.find(member => member.externalId === externalId);
}
