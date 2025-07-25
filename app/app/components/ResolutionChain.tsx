import React, { useMemo } from "react";
import type {
  ContextualResolution,
  DSDBSystem,
  ResolvedValue,
  Token,
  Value,
  Tag,
  ContextTagGroup,
} from "../utils/dsdb";
import { rgbToHex } from "../utils/dsdb";

// A small component to render the color swatch.
const ColorSwatch: React.FC<{ value: ResolvedValue | null }> = ({ value }) => {
  if (value && "color" in value && value.color) {
    const hex = rgbToHex(value.color.red, value.color.green, value.color.blue);
    return (
      <div
        className="w-4 h-4 rounded-full border border-gray-300 shadow-inner inline-block mr-2"
        style={{ backgroundColor: hex, opacity: value.color.alpha ?? 1 }}
      />
    );
  }
  // Return a placeholder for non-color values or unresolved swatches.
  return (
    <div className="w-4 h-4 rounded-full border border-gray-200 bg-gray-100 inline-block mr-2" />
  );
};

// Renders a single token in the resolution chain as a "chip".
const ChainNode: React.FC<{
  token: Token;
  finalValue: ResolvedValue | null;
}> = ({ token, finalValue }) => {
  const showSwatch = token.tokenValueType === "COLOR";

  return (
    <div className="flex items-center p-1.5 bg-gray-100 border border-gray-200 rounded-lg w-auto hover:bg-gray-200">
      {showSwatch && <ColorSwatch value={finalValue} />}
      {!showSwatch && <div className="w-4 h-4 inline-block mr-2" />}
      <p className="font-mono text-xs text-gray-800">{token.tokenName}</p>
    </div>
  );
};

// A compact, horizontal arrow.
const Arrow = () => (
  <div className="flex items-center justify-center mx-1">
    <svg
      className="w-4 h-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </div>
);

// --- Components for Tree Display ---

interface ResolutionLeafProps {
  resolution: ContextualResolution;
  remainingChain: { value: Value; token: Token }[];
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
}

// Renders the final part of a resolution path (the part after the common prefix and context branching).
const ResolutionLeaf: React.FC<ResolutionLeafProps> = ({
  resolution,
  remainingChain,
  renderValueContent,
}) => {
  const finalResolvedValue = resolution.resolvedValue;
  const hasRemainingChain = remainingChain.length > 0;
  const hasFinalValue =
    finalResolvedValue && !("undefined" in finalResolvedValue);

  return (
    <div className="flex flex-row items-center flex-wrap gap-y-1">
      {hasRemainingChain && (
        <>
          {remainingChain.map(({ value, token }, idx) => (
            <React.Fragment key={value.name}>
              <ChainNode token={token} finalValue={finalResolvedValue} />
              {idx < remainingChain.length - 1 && <Arrow />}
            </React.Fragment>
          ))}
        </>
      )}

      {hasRemainingChain && hasFinalValue && <Arrow />}

      {hasFinalValue ? (
        <div className="flex items-center p-1.5 bg-blue-100 border border-blue-200 rounded-lg w-auto">
          {renderValueContent(finalResolvedValue)}
        </div>
      ) : (
        <div className="flex items-center p-1.5 bg-gray-100 border border-gray-200 rounded-lg w-auto">
          <p className="text-gray-500 italic text-xs">Undefined Value</p>
        </div>
      )}
    </div>
  );
};

interface BranchNodeData {
  tag: string; // The context tag name from the DSDB
  displayName: string;
  children: BranchNodeData[];
  // A leaf in the context tree holds one or more final resolution details
  resolutions: {
    resolution: ContextualResolution;
    remainingChain: { value: Value; token: Token }[];
  }[];
}

interface BranchProps {
  node: BranchNodeData;
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
  isRoot?: boolean;
}

// Recursively renders a branch of the context tree
const Branch: React.FC<BranchProps> = ({
  node,
  renderValueContent,
  isRoot = false,
}) => {
  return (
    <div className={!isRoot ? "pt-1 pl-3" : ""}>
      {!isRoot && (
        <div className="flex items-center mb-1">
          <div className="w-2 h-px bg-gray-300"></div>
          <div className="pl-2">
            <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              {node.displayName}
            </span>
          </div>
        </div>
      )}
      <div className={!isRoot ? "pl-4 border-l border-gray-300" : ""}>
        {/* If this node is a leaf in the context tree, render its resolutions */}
        {node.resolutions.map(({ resolution, remainingChain }, index) => (
          <div key={index} className="pb-1 last:pb-0">
            <ResolutionLeaf
              resolution={resolution}
              remainingChain={remainingChain}
              renderValueContent={renderValueContent}
            />
          </div>
        ))}

        {/* Recursively render children branches */}
        {node.children.map((child) => (
          <Branch
            key={child.tag}
            node={child}
            renderValueContent={renderValueContent}
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---

interface ResolutionChainProps {
  chain: ContextualResolution[];
  system: DSDBSystem | null;
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
}

const findCommonPrefix = (
  chain: ContextualResolution[],
  system: DSDBSystem
) => {
  if (!chain || chain.length === 0) return { commonPrefix: [], remaining: [] };

  const chains = chain.map((c) => c.resolutionChain);
  let prefixLength = 0;
  if (chains.length > 0 && chains[0].length > 0) {
    for (let i = 0; i < chains[0].length; i++) {
      const refName = chains[0][i].name;
      if (chains.every((c) => c.length > i && c[i].name === refName)) {
        prefixLength++;
      } else {
        break;
      }
    }
  }

  const resolveRef = (ref: { name: string }) => {
    const value = system.values.find((v) => v.name === ref.name);
    if (!value || !value.tokenName) return null;
    const token = system.tokens.find((t) => t.tokenName === value.tokenName);
    return token ? { value, token } : null;
  };

  const commonPrefixRefs =
    chains.length > 0 ? chains[0].slice(0, prefixLength) : [];
  const commonPrefix = commonPrefixRefs
    .map(resolveRef)
    .filter((item): item is { value: Value; token: Token } => !!item);

  const remaining = chain.map((c) => {
    const remainingRefs = c.resolutionChain.slice(prefixLength);
    const remainingChain = remainingRefs
      .map(resolveRef)
      .filter((item): item is { value: Value; token: Token } => !!item);
    return { resolution: c, remainingChain };
  });

  return { commonPrefix, remaining };
};

export const ResolutionChain: React.FC<ResolutionChainProps> = ({
  chain,
  system,
  renderValueContent,
}) => {
  const { tree, commonPrefix } = useMemo(() => {
    if (!system || !chain || chain.length === 0) {
      return { tree: null, commonPrefix: [] };
    }

    const tagInfoCache = new Map<
      string,
      { tag: Tag; group: ContextTagGroup } | null
    >();
    const getTagInfo = (tagName: string) => {
      if (tagInfoCache.has(tagName)) return tagInfoCache.get(tagName);
      const tag = system.tags.find((t) => t.name === tagName);
      if (!tag) {
        tagInfoCache.set(tagName, null);
        return null;
      }
      const group = system.contextTagGroups.find((g) =>
        tag.name.startsWith(g.name + "/")
      );
      const result = group ? { tag, group } : null;
      tagInfoCache.set(tagName, result);
      return result;
    };

    const tagSortFn = (a: string, b: string) => {
      const infoA = getTagInfo(a);
      const infoB = getTagInfo(b);
      if (!infoA || !infoB) return 0;

      const specDiff = infoA.group.specificity - infoB.group.specificity;
      if (specDiff !== 0) return specDiff;

      return (
        parseInt(infoA.tag.tagOrder, 10) - parseInt(infoB.tag.tagOrder, 10)
      );
    };

    const { commonPrefix, remaining } = findCommonPrefix(chain, system);

    const root: BranchNodeData = {
      tag: "root",
      displayName: "root",
      children: [],
      resolutions: [],
    };

    remaining.forEach(({ resolution, remainingChain }) => {
      // Create a stable sort by sorting a copy of the array.
      const sortedTags = [...resolution.contextTags].sort(tagSortFn);

      let currentNode = root;
      if (sortedTags.length === 0) {
        currentNode.resolutions.push({ resolution, remainingChain });
        return;
      }

      sortedTags.forEach((tag) => {
        let childNode = currentNode.children.find((c) => c.tag === tag);
        if (!childNode) {
          const info = getTagInfo(tag);
          childNode = {
            tag,
            displayName: info?.tag.displayName || tag,
            children: [],
            resolutions: [],
          };
          currentNode.children.push(childNode);
          currentNode.children.sort((a, b) => tagSortFn(a.tag, b.tag));
        }
        currentNode = childNode;
      });
      currentNode.resolutions.push({ resolution, remainingChain });
    });

    return { tree: root, commonPrefix };
  }, [chain, system]);

  if (!system || !chain || chain.length === 0) {
    return (
      <div className="mt-2">
        <h4 className="text-xs font-semibold text-gray-600 mb-1">
          Resolution Path
        </h4>
        <p className="text-gray-500 italic text-xs">
          No resolution information available.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {commonPrefix.length > 0 && (
        <div className="flex flex-row items-center flex-wrap gap-y-1 mb-2">
          {commonPrefix.map(({ value, token }, idx) => (
            <React.Fragment key={value.name}>
              <ChainNode token={token} finalValue={null} />
              {idx < commonPrefix.length && <Arrow />}
            </React.Fragment>
          ))}
        </div>
      )}
      {tree && (
        <Branch node={tree} renderValueContent={renderValueContent} isRoot />
      )}
    </div>
  );
};

export default ResolutionChain;
