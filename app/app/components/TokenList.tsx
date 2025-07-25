import { Fragment, useState } from "react";
import type {
  DisplayGroupChildItem,
  DisplayGroupTokenItem,
  DsdbManager,
  ResolvedValue,
  Tag,
  TokenResolutionLink,
  Value,
} from "../DsdbManager";
import { rgbToHex } from "../utils/colors";

function ResolutionChainView({ chain }: { chain: Value[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-4">
      {chain.map((link, index) => {
        const isLast = index === chain.length - 1;
        const hasColor = "color" in link && link.color;
        const bgColor = isLast ? "bg-blue-50" : "bg-gray-100";
        const textColor = isLast ? "text-blue-800" : "text-gray-800";

        return (
          <Fragment key={link.name}>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${bgColor} ${textColor}`}
            >
              {hasColor && (
                <div
                  className="w-3.5 h-3.5 rounded-full border border-gray-300"
                  style={{
                    backgroundColor: rgbToHex(
                      link.color?.red,
                      link.color?.green,
                      link.color?.blue
                    ),
                    opacity: link.color?.alpha ?? 1,
                  }}
                ></div>
              )}
              <span>
                {link.tokenName ||
                  (hasColor
                    ? `${rgbToHex(
                        link.color?.red,
                        link.color?.green,
                        link.color?.blue
                      ).toUpperCase()} (Alpha: ${link.color?.alpha.toFixed(2)})`
                    : "Final Value")}
              </span>
            </div>
            {!isLast && <span className="text-gray-400">&gt;</span>}
          </Fragment>
        );
      })}
    </div>
  );
}

function ValueContentView({ value }: { value: ResolvedValue }) {
  if ("color" in value && value.color) {
    const hex = rgbToHex(value.color.red, value.color.green, value.color.blue);
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: hex, opacity: value.color.alpha }}
        ></div>
        <span>{hex.toUpperCase()}</span>
      </div>
    );
  }
  if ("length" in value && value.length) {
    return (
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>{`${value.length.value}dp`}</span>
      </div>
    );
  }
  if ("shape" in value) {
    return (
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 7L9.46 17.54a2 2 0 01-2.83 0L4 15"
          ></path>
        </svg>
        <span>Shape</span>
      </div>
    );
  }

  // Fallback for other types
  const key = Object.keys(value)[0];
  return <span>{key}</span>;
}

function findBestResolution(
  chain: TokenResolutionLink[],
  selectedContextTags: Set<string>
): TokenResolutionLink | undefined {
  let bestMatch: TokenResolutionLink | undefined = undefined;
  let highestScore = -1;

  for (const resolution of chain) {
    const resolutionTagNames = resolution.contextTags.map((t) => t.tagName);
    const isMatch = resolutionTagNames.every((tagName) =>
      selectedContextTags.has(tagName)
    );

    if (isMatch) {
      if (resolutionTagNames.length > highestScore) {
        highestScore = resolutionTagNames.length;
        bestMatch = resolution;
      }
    }
  }

  if (!bestMatch) {
    bestMatch = chain.find((r) => r.contextTags.length === 0);
  }

  return bestMatch;
}

function TokenView({
  token,
  selectedContextTags,
}: {
  token: DisplayGroupTokenItem;
  selectedContextTags: Set<string>;
}) {
  const resolution = findBestResolution(token.chain, selectedContextTags);

  if (!resolution) {
    return (
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-blue-600">{token.displayName}</p>
            <p className="text-sm text-gray-500">{token.tokenName}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-400">No value for this context</p>
      </div>
    );
  }

  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-blue-600">{token.displayName}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{token.tokenName}</p>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
          {token.tokenValueType}
        </span>
      </div>
      <ResolutionChainView chain={resolution.resolutionChain} />
    </div>
  );
}

function DisplayGroupView({
  group,
  selectedContextTags,
  level = 0,
}: {
  group: DisplayGroupChildItem;
  selectedContextTags: Set<string>;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 1);

  return (
    <div className={level > 0 ? "pl-4" : ""}>
      <div
        className={`flex justify-between items-center p-2 cursor-pointer border-b ${
          level === 0 ? "bg-purple-100" : "bg-gray-50"
        } hover:bg-purple-50`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 4a2 2 0 012-2h5l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"></path>
          </svg>
          <span className="font-medium">{group.displayName}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>
      {isExpanded && (
        <div>
          {group.tokens.map((token) => (
            <TokenView
              key={token.name}
              token={token}
              selectedContextTags={selectedContextTags}
            />
          ))}
          {group.child.map((childGroup) => (
            <DisplayGroupView
              key={childGroup.name}
              group={childGroup}
              selectedContextTags={selectedContextTags}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TokenListProps {
  tokenSets: ReturnType<DsdbManager["tokensForComponent"]>;
  selectedContext: Record<string, string>; // group.name -> tag.name
  allTags: Map<string, Tag>;
}

export default function TokenList({
  tokenSets,
  selectedContext,
  allTags,
}: TokenListProps) {
  const selectedContextTags = new Set(
    Object.values(selectedContext)
      .map((fullTagName) => allTags.get(fullTagName)?.tagName)
      .filter((t): t is string => !!t)
  );

  return (
    <div className="border rounded-lg overflow-hidden shadow">
      {tokenSets.map(({ set, displayGroups }) => (
        <div key={set.name}>
          {displayGroups.map((group) => (
            <DisplayGroupView
              key={group.name}
              group={group}
              selectedContextTags={selectedContextTags}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
