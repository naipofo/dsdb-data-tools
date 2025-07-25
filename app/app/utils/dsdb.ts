// --- Type Definitions based on dsdb_format.md ---

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface Type {
  fontNameTokenName: string;
  fontWeightTokenName: string;
  fontSizeTokenName: string;
  fontTrackingTokenName: string;
  lineHeightTokenName: string;
}

export interface Length {
  value?: number;
  unit: "DIPS" | "PERCENT" | "POINTS"; // points only used in font specifiers
}

export interface ShapeDimension {
  value?: number;
  unit: "DIPS" | "PERCENT";
}

export interface ShapeCircular {
  family: "SHAPE_FAMILY_CIRCULAR";
}

export interface ShapeRoundedCorners {
  family: "SHAPE_FAMILY_ROUNDED_CORNERS";
  defaultSize?: ShapeDimension;
  topLeft?: ShapeDimension;
  topRight?: ShapeDimension;
  bottomLeft?: ShapeDimension;
  bottomRight?: ShapeDimension;
}

export type Shape = ShapeCircular | ShapeRoundedCorners;

export type ResolvedValue =
  | { color: Color }
  | { opacity: number }
  | { length: Length }
  | { shape: Shape }
  | { type: Type }
  | { numeric: number }
  | { fontWeight: number }
  | { fontNames: { values: string[] } }
  | { fontSize: Length }
  | { fontTracking: Length }
  | { lineHeight: Length }
  | { elevation: Length }
  | { axisValue: { tag: string; value?: string } }
  | { undefined: true };

export type Value = {
  name: string;
  tokenName?: string;
  specificityScore?: number;
  createTime: string;
} & ResolvedValue;

export interface Token {
  name: string;
  tokenName: string;
  displayName: string;
  displayGroup?: string;
  orderInDisplayGroup?: number;
  tokenNameSuffix: string;
  description?: string;
  tokenValueType:
    | "COLOR"
    | "OPACITY"
    | "LENGTH"
    | "SHAPE"
    | "TYPOGRAPHY"
    | "FONT_NAMES"
    | "FONT_WEIGHT"
    | "FONT_SIZE"
    | "FONT_TRACKING"
    | "LINE_HEIGHT"
    | "ELEVATION"
    | "AXIS_VALUE"
    | "DURATION"
    | "NUMERIC";
  deprecationMessage?: {
    message: string;
    replacementTokenName: string;
  };
  createTime: string;
}

export interface DisplayGroup {
  name: string;
  displayName: string;
  parentGroup?: string;
  orderInParentDisplayGroup?: number;
  orderInParentTokenSet?: number;
  createTime: string;
}

export interface Component {
  name: string;
  displayName: string;
  definition: string;
  tokenSets: string[];
  componentImage: {
    imageUrl: string;
  };
  alternativeNames?: string[];
  componentDisplayGroup?: string;
  createTime: string;
}

export interface TokenSet {
  name: string;
  tokenSetName: string;
  displayName: string;
  description?: string;
  tokenSetNameSuffix: string;
  tokenType: "COMPONENT";
  order: number;
  createTime: number;
}

export interface ContextTagGroup {
  name: string;
  displayName: string;
  contextTagGroupName: string;
  defaultTag: string;
  specificity: number;
  createTime: number;
}

export interface Tag {
  name: string;
  displayName: string;
  tagName: string;
  tagOrder: string;
  createTime: string;
}

interface ReferenceNode {
  value: {
    name: string;
  };
  childNodes?: ReferenceNode[];
}

interface ContextualReference {
  contextTags?: string[];
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
  revisionId: string;
  revisionCreateTime: string;
  createTime: string;
  description: string;
  thumbnailUrl: {
    thumbnailUrl: string;
    imageUrl: string;
  };
  tokenNamePrefix: string;
  components: Component[];
  tokenSets: TokenSet[];
  tokens: Token[];
  values: Value[];
  displayGroups: DisplayGroup[];
  contextualReferenceTrees: Record<string, ContextualReferenceTree>;
  contextTagGroups: ContextTagGroup[];
  tags: Tag[];
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

export interface ContextualResolution {
  contextTags: string[];
  resolvedValue: ResolvedValue | null;
  resolutionChain: { name: string }[];
}

/**
 * Resolves all contextual values for a token and its resolution chains.
 * @param token - The token to resolve.
 * @param allContextualReferenceTrees - A map of all contextual reference trees.
 * @returns An array of objects, each containing the resolved value, context, and resolution chain.
 */
export const resolveTokenAndChain = (
  token: Token,
  allContextualReferenceTrees: Record<string, ContextualReferenceTree>
): ContextualResolution[] => {
  const crtEntry = allContextualReferenceTrees[token.name];
  if (
    !crtEntry ||
    !crtEntry.contextualReferenceTree ||
    crtEntry.contextualReferenceTree.length === 0
  ) {
    return [];
  }

  return crtEntry.contextualReferenceTree.map((contextualReference) => {
    const resolvedValue = contextualReference.resolvedValue;
    const resolutionChain: { name: string }[] = [];

    const buildChain = (node: ReferenceNode) => {
      if (node && node.value && node.value.name) {
        resolutionChain.push({ name: node.value.name });
        if (node.childNodes) {
          node.childNodes.forEach(buildChain);
        }
      }
    };

    if (contextualReference.referenceTree) {
      buildChain(contextualReference.referenceTree);
    }

    return {
      contextTags: contextualReference.contextTags ?? [],
      resolvedValue,
      resolutionChain,
    };
  });
};
