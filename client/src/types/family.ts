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
  monarchDuringLife: string[];
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
