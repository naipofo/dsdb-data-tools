import { findBestResolution } from "./utils/findBestResolution";
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
  | {
      customComposite: {
        properties: {
          damping: { tokenName: string };
          stiffness: { tokenName: string };
        };
      };
    }
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
    | "NUMERIC"
    | "CUSTOM_COMPOSITE";
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
    public tags: Map<string, Tag>
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

  getAllTokens(): Token[] {
    return this.tokens;
  }

  tokensForComponent({ tokenSets: tokenSetNames }: Component) {
    return this.getTokenSetsForComponent(tokenSetNames).map((set) => ({
      set,
      displayGroups: this.getRootDisplayGroupsForSet(set.name),
      tokens: this.getTokensByNamePrefixWithoutDisplayGroup(set.name),
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

  private mapTokensToDisplayItems(tokens: Token[]): DisplayGroupTokenItem[] {
    return tokens
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
        chain: this.resolveTokenChain(name) ?? [],
      }));
  }

  private getDisplayGroupTokens(groupName: string): DisplayGroupTokenItem[] {
    const groupTokens = this.tokens.filter(
      ({ displayGroup }) => displayGroup === groupName
    );
    return this.mapTokensToDisplayItems(groupTokens);
  }

  private getTokensByNamePrefixWithoutDisplayGroup(
    namePrefix: string
  ): DisplayGroupTokenItem[] {
    const prefixTokens = this.tokens.filter(
      ({ name, displayGroup }) => name.startsWith(namePrefix) && !displayGroup
    );
    return this.mapTokensToDisplayItems(prefixTokens);
  }

  public resolveTokenChain(
    tokenName: string
  ): TokenResolutionLink[] | undefined {
    const treeData = this.contextualReferenceTrees.get(tokenName);
    if (!treeData) {
      return undefined;
    }
    const { contextualReferenceTree } = treeData;

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

  private shallowCopyTokenMake(
    token: DisplayGroupTokenItem,
    selectedContext: Record<string, string>
  ) {
    const currentContextTags = new Set(
      Object.values(selectedContext)
        .map((name) => this.tags.get(name)?.tagName)
        .filter((t): t is string => !!t)
    );

    const bestResolution = findBestResolution(token.chain, currentContextTags);

    if (!bestResolution) {
      return {};
    }

    const { resolutionChain } = bestResolution;

    const {
      name,
      specificityScore,
      createTime,
      revisionId,
      revisionCreateTime,
      ...restOfToken
    } = resolutionChain[0] as Value & {
      revisionId: unknown;
      revisionCreateTime: unknown;
      state: unknown;
    };
    return { token: restOfToken };
  }

  shallowCopyForTokenSet(
    set: TokenSet,
    displayGroups: DisplayGroupChildItem[],
    tokens: DisplayGroupTokenItem[],
    selectedContext: Record<string, string>
  ): any {
    const tokenList: DisplayGroupTokenItem[] = [...tokens];
    const processDg = (dg: DisplayGroupChildItem[]) => {
      for (const { tokens, child } of dg) {
        tokenList.push(...tokens);
        processDg(child);
      }
    };

    processDg(displayGroups);

    return {
      displayName: set.displayName,
      tokenSetName: set.tokenSetName,
      tokens: tokenList.map((token) => {
        const data = this.shallowCopyTokenMake(token, selectedContext);
        const { tokenName, displayName, tokenValueType } = token;
        return {
          tokenName,
          displayName,
          tokenValueType,
          data,
        };
      }),
    };
  }

  getTokensExport(
    tokens: Token[],
    selectedContext: Record<string, string>
  ): Record<string, object | string> {
    const currentContextTags = new Set(
      Object.values(selectedContext)
        .map((name) => this.tags.get(name)?.tagName)
        .filter((t): t is string => !!t)
    );

    const results: Record<string, object | string> = {};

    for (const token of tokens) {
      const chain = this.resolveTokenChain(token.name);
      if (!chain) {
        continue;
      }

      const bestResolution = findBestResolution(chain, currentContextTags);

      if (bestResolution) {
        const finalValue = bestResolution.resolutionChain.slice(-1)[0];
        if (!finalValue) continue;
        let styleValue: string | object = "";

        if (
          token.tokenValueType === "TYPOGRAPHY" &&
          "type" in bestResolution.resolutionChain[0]
        ) {
          styleValue = bestResolution.resolutionChain[0].type;
        } else if (
          token.tokenValueType === "CUSTOM_COMPOSITE" &&
          "customComposite" in bestResolution.resolutionChain[0]
        ) {
          styleValue = {
            damping:
              bestResolution.resolutionChain[0].customComposite.properties
                .damping.tokenName,
            stiffness:
              bestResolution.resolutionChain[0].customComposite.properties
                .stiffness.tokenName,
          };
        } else if ("color" in finalValue && finalValue.color) {
          const { red, green, blue, alpha } = finalValue.color;
          if (alpha !== 1) {
            console.warn("NON 1.0 ALPHA DETECTED - NO SUPPORT", finalValue);
          }
          styleValue = `${Math.round((red || 0) * 255)} ${Math.round(
            (green || 0) * 255
          )} ${Math.round((blue || 0) * 255)}`;
        } else if (
          "length" in finalValue &&
          finalValue.length &&
          finalValue.length.value !== undefined
        ) {
          const unit = finalValue.length.unit === "DIPS" ? "px" : "";
          styleValue = `${finalValue.length.value}${unit}`;
        } else if (
          "fontWeight" in finalValue &&
          finalValue.fontWeight !== undefined
        ) {
          styleValue = { value: finalValue.fontWeight, type: "weight" };
        } else if (
          "numeric" in finalValue &&
          finalValue.numeric !== undefined
        ) {
          styleValue = `${finalValue.numeric}`;
        } else if (
          "elevation" in finalValue &&
          finalValue.elevation &&
          finalValue.elevation.value !== undefined
        ) {
          const unit = finalValue.elevation.unit === "DIPS" ? "px" : "";
          styleValue = `${finalValue.elevation.value}${unit}`;
        } else if ("fontSize" in finalValue && finalValue.fontSize?.value) {
          styleValue = finalValue.fontSize.value.toString();
        } else if ("lineHeight" in finalValue && finalValue.lineHeight?.value) {
          styleValue = finalValue.lineHeight.value.toString();
        } else if ("fontTracking" in finalValue && finalValue.fontTracking) {
          styleValue = {
            value: finalValue.fontTracking?.value || 0,
            type: "tracking",
          };
        } else if ("fontNames" in finalValue && finalValue.fontNames) {
          const value = finalValue.fontNames.values
            .map((v) => `"${v}"`)
            .join(", ");
          styleValue = { value, type: "font" };
        } else if ("shape" in finalValue && finalValue.shape) {
          const { shape } = finalValue;
          if (shape.family === "SHAPE_FAMILY_CIRCULAR") {
            styleValue = "50%";
            // TODO: this will generate an eclipse instead of a pill, but might be OK
            // pill-shapes will define corners anyways for animations
          } else if (shape.family === "SHAPE_FAMILY_ROUNDED_CORNERS") {
            const format = (dim?: ShapeDimension) => {
              if (!dim || dim.value === undefined) return "0";
              const unit = dim.unit === "DIPS" ? "px" : "%";
              return `${dim.value}${unit}`;
            };

            if (shape.defaultSize && shape.defaultSize.value !== undefined) {
              styleValue = format(shape.defaultSize);
            } else {
              const tl = format(shape.topLeft);
              const tr = format(shape.topRight);
              const br = format(shape.bottomRight);
              const bl = format(shape.bottomLeft);
              styleValue = `${tl} ${tr} ${br} ${bl}`;
            }
          }
        }

        if (styleValue) {
          results[token.tokenName] = styleValue;
        }
      }
    }
    return results;
  }

  getSystemTokensExport(
    selectedContext: Record<string, string>
  ): Record<string, string | object> {
    const systemTokens = this.getAllTokens().filter((token) =>
      token.tokenName.startsWith("md.sys")
    );
    return this.getTokensExport(systemTokens, selectedContext);
  }
}
