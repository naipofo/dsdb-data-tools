// dsdb-data-tools/app/app/utils/dsdb.ts

// --- Type Definitions based on dsdb_format.md ---

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface Length {
  value: number;
  unit: string; // e.g., "DIPS"
}

export interface Value {
  name: string;
  tokenName: string;
  color?: Color;
  length?: Length;
}

export interface Token {
  name: string;
  tokenName: string;
  displayName: string;
  displayGroup: string;
  tokenValueType: string;
}

export interface DisplayGroup {
  name: string;
  displayName: string;
  parentGroup?: string;
  orderInParentDisplayGroup: number;
}

export interface Component {
  name: string;
  displayName: string;
  tokenSets: string[];
  componentImage?: {
    imageUrl: string;
  };
}

export interface TokenSet {
  name: string;
  tokenSetName: string;
  displayName: string;
  tokenType: string;
}

interface ReferenceNode {
    value: {
        name: string;
    };
    childNodes?: ReferenceNode[];
}

export interface ResolvedValue {
    color?: Color;
    length?: Length;
    opacity?: number;
}

interface ContextualReference {
    referenceTree: ReferenceNode;
    resolvedValue: ResolvedValue;
}

export interface ContextualReferenceTree {
    contextualReferenceTree: ContextualReference[];
}

export interface DSDBSystem {
  name: string;
  displayName: string;
  dsdbVersion: string;
  description: string;
  tokenNamePrefix: string;
  components: Component[];
  tokenSets: TokenSet[];
  tokens: Token[];
  values: Value[];
  displayGroups: DisplayGroup[];
  contextualReferenceTrees: Record<string, ContextualReferenceTree>;
  contextTagGroups: any[];
  tags: any[];
  versions: any[];
  connections: any[];
  parentVersionsMapping: Record<string, any>;
}

export interface DSDB {
    system: DSDBSystem;
}


// --- Utility Functions ---

/**
 * Converts RGB color components to a hex color string.
 * @param r - Red component (0-1)
 * @param g - Green component (0-1)
 * @param b - Blue component (0-1)
 * @returns The hex color string (e.g., "#RRGGBB").
 */
export const rgbToHex = (r?: number, g?: number, b?: number): string => {
  if (r === undefined || g === undefined || b === undefined) return "#000000";
  const toHex = (c: number): string => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};


export interface ResolvedTokenInfo {
    resolvedValue: ResolvedValue | null;
    resolutionChain: string[];
}

/**
 * Resolves a token's value and its resolution chain from the contextual reference trees.
 * @param token - The token to resolve.
 * @param allContextualReferenceTrees - A map of all contextual reference trees.
 * @returns An object containing the resolved value and the resolution chain.
 */
export const resolveTokenAndChain = (
    token: Token,
    allContextualReferenceTrees: Record<string, ContextualReferenceTree>
): ResolvedTokenInfo => {
  const crtEntry = allContextualReferenceTrees[token.name];
  if (
    !crtEntry ||
    !crtEntry.contextualReferenceTree ||
    crtEntry.contextualReferenceTree.length === 0
  ) {
    return { resolvedValue: null, resolutionChain: [] };
  }

  const primaryRefTree = crtEntry.contextualReferenceTree[0];
  const resolvedValue = primaryRefTree.resolvedValue;
  const resolutionChain: string[] = [];

  const buildChain = (node: ReferenceNode) => {
    if (node && node.value && node.value.name) {
      const displayPart = node.value.name.split("/").pop() || node.value.name;
      resolutionChain.push(displayPart);
      if (node.childNodes) {
        node.childNodes.forEach(buildChain);
      }
    }
  };

  if (primaryRefTree.referenceTree) {
      buildChain(primaryRefTree.referenceTree);
  }

  return { resolvedValue, resolutionChain };
};
