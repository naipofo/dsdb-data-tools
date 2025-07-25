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
  createTime: string;
}

export interface ContextTagGroup {
  name: string;
  displayName: string;
  contextTagGroupName: string;
  defaultTag: string;
  specificity: number;
  createTime: string;
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

export interface TokenResolutionLink {
  contextTags: {
    displayName: string;
    tagOrder: string;
    tagName: string;
  }[];
  resolvedValue: ResolvedValue;
  resolutionChain: Value[];
}

export interface DisplayGroupTokenItem {
  name: string;
  displayName: string;
  tokenName: string;
  tokenValueType: Token["tokenValueType"];
  description?: string;
  chain: TokenResolutionLink[];
}

export interface DisplayGroupChildItem {
  name: string;
  displayName: string;
  child: DisplayGroupChildItem[];
  tokens: DisplayGroupTokenItem[];
}

export class DsdbManager {
  constructor(
    public name: string,
    public displayName: string,
    public description: string,
    public thumbnailUrl: string,
    public imageUrl: string,
    public tokenNamePrefix: string,

    public components: Component[],
    private tokenSets: Map<string, TokenSet>,
    private tokens: Token[],
    private values: Map<string, Value>,
    private displayGroups: DisplayGroup[],
    private contextualReferenceTrees: Map<string, ContextualReferenceTree>,
    public contextTagGroups: ContextTagGroup[],
    private tags: Map<string, Tag>
  ) {}

  static fromJson(json: string) {
    const {
      name,
      components,
      contextTagGroups,
      contextualReferenceTrees,
      description,
      displayGroups,
      displayName,
      tags,
      thumbnailUrl: { thumbnailUrl, imageUrl },
      tokenNamePrefix,
      tokenSets,
      tokens,
      values,
    }: {
      name: string;
      displayName: string;
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
    } = JSON.parse(json).system;

    return new this(
      name,
      displayName,
      description,
      thumbnailUrl,
      imageUrl,
      tokenNamePrefix,
      components,
      new Map(tokenSets.map((ts) => [ts.name, ts])),
      tokens,
      new Map(values.map((v) => [v.name, v])),
      displayGroups,
      new Map(Object.entries(contextualReferenceTrees)),
      contextTagGroups,
      new Map(tags.map((t) => [t.name, t]))
    );
  }

  tokensForComponent({ tokenSets: tokenSetNames }: Component) {
    return this.getTokenSetsForComponent(tokenSetNames).map((set) => ({
      set,
      displayGroups: this.getRootDisplayGroupsForSet(set.name),
    }));
  }

  private getTokenSetsForComponent(tokenSetNames: string[]) {
    return tokenSetNames
      .map((name) => this.tokenSets.get(name)!)
      .filter(Boolean);
  }

  private getRootDisplayGroupsForSet(setName: string) {
    return this.displayGroups
      .filter(
        ({ name, parentGroup }) => name.indexOf(setName) === 0 && !parentGroup
      )
      .sort(
        (
          { orderInParentTokenSet },
          { orderInParentTokenSet: orderInParentTokenSet2 }
        ) => (orderInParentTokenSet ?? 0) - (orderInParentTokenSet2 ?? 0)
      )
      .map(({ name, displayName }) => ({
        name,
        displayName,
        child: this.getDisplayGroupChild(name),
        tokens: this.getDisplayGroupTokens(name),
      }));
  }

  private getDisplayGroupChild(parentName: string): DisplayGroupChildItem[] {
    return this.displayGroups
      .filter(({ parentGroup }) => parentGroup === parentName)
      .sort(
        (
          { orderInParentDisplayGroup },
          { orderInParentDisplayGroup: orderInParentDisplayGroup2 }
        ) =>
          (orderInParentDisplayGroup ?? 0) - (orderInParentDisplayGroup2 ?? 0)
      )
      .map(({ name, displayName }) => ({
        name,
        displayName,
        child: this.getDisplayGroupChild(name),
        tokens: this.getDisplayGroupTokens(name),
      }));
  }

  private getDisplayGroupTokens(groupName: string): DisplayGroupTokenItem[] {
    return this.tokens
      .filter(({ displayGroup }) => displayGroup === groupName)
      .sort(
        (
          { orderInDisplayGroup },
          { orderInDisplayGroup: orderInDisplayGroup2 }
        ) => (orderInDisplayGroup ?? 0) - (orderInDisplayGroup2 ?? 0)
      )
      .map(({ name, displayName, tokenName, tokenValueType, description }) => ({
        name,
        displayName,
        tokenName,
        tokenValueType,
        description,
        chain: this.resolveTokenChain(name),
      }));
  }

  private resolveTokenChain(tokenName: string) {
    const { contextualReferenceTree } =
      this.contextualReferenceTrees.get(tokenName)!;

    return contextualReferenceTree.map(
      ({ referenceTree, resolvedValue, contextTags }) => {
        const resolutionChain: string[] = [];

        const buildChain = (node: ReferenceNode) => {
          if (node && node.value && node.value.name) {
            resolutionChain.push(node.value.name);
            if (node.childNodes) {
              node.childNodes.forEach(buildChain);
            }
          }
        };
        buildChain(referenceTree);

        return {
          contextTags: (contextTags ?? []).map((contextTagName) => {
            const { displayName, tagOrder, tagName } =
              this.tags.get(contextTagName)!;
            return { displayName, tagOrder, tagName };
          }),
          resolvedValue,
          resolutionChain: resolutionChain.map(
            (name) => this.values.get(name)!
          ),
        };
      }
    );
  }
}
