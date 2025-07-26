import { Fragment, useState } from "react";
import type {
  DisplayGroupChildItem,
  DisplayGroupTokenItem,
  DsdbManager,
  Tag,
  Token,
  TokenSet,
  Value,
} from "../DsdbManager";
import { rgbToHex } from "../utils/colors";
import { findBestResolution } from "../utils/findBestResolution";

function ResolutionChainView({ chain }: { chain: Value[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-4">
      {chain.map((link, index) => {
        const isLast = index === chain.length - 1;
        const hasColor = "color" in link && link.color;
        const bgColor = isLast ? "bg-gray-200" : "bg-gray-100";
        const textColor = isLast ? "text-gray-900" : "text-gray-800";

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
      <div className="p-4 border-b last:border-b-0">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900">{token.displayName}</p>
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
          <h4 className="font-semibold text-gray-900">{token.displayName}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{token.tokenName}</p>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
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
          level === 0 ? "bg-gray-100" : "bg-gray-50"
        } hover:bg-gray-200`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
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
        <div className="border-l border-gray-200">
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

function TokenSetView({
  set,
  tokens,
  displayGroups,
  selectedContextTags,
  onDownloadShallowCopy,
}: {
  set: TokenSet;
  tokens: DisplayGroupTokenItem[];
  displayGroups: DisplayGroupChildItem[];
  selectedContextTags: Set<string>;
  onDownloadShallowCopy: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex justify-between items-center p-3 cursor-pointer bg-gray-200 hover:bg-gray-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-gray-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h5l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
          </svg>
          <span className="font-semibold text-lg">{set.displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadShallowCopy();
            }}
            className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 transition-colors"
          >
            Download Shallow Copy
          </button>
          <svg
            className={`w-6 h-6 text-gray-600 transition-transform ${
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
      </div>
      {isExpanded && (
        <div>
          {tokens.map((token) => (
            <TokenView
              key={token.name}
              token={token}
              selectedContextTags={selectedContextTags}
            />
          ))}
          {displayGroups.map((group) => (
            <DisplayGroupView
              key={group.name}
              group={group}
              selectedContextTags={selectedContextTags}
              level={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TokenListProps {
  dsdbManager: DsdbManager;
  tokenSets: ReturnType<DsdbManager["tokensForComponent"]>;
  selectedContext: Record<string, string>;
  allTags: Map<string, Tag>;
}

export default function TokenList({
  dsdbManager,
  tokenSets,
  selectedContext,
  allTags,
}: TokenListProps) {
  const selectedContextTags = new Set(
    Object.values(selectedContext)
      .map((fullTagName) => allTags.get(fullTagName)?.tagName)
      .filter((t): t is string => !!t)
  );

  const handleDownload = (
    set: TokenSet,
    displayGroups: DisplayGroupChildItem[],
    tokens: DisplayGroupTokenItem[]
  ) => {
    const data = dsdbManager.shallowCopyForTokenSet(
      set,
      displayGroups,
      tokens,
      selectedContext
    );
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.tokenSetName || "tokens"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {tokenSets.map(({ set, displayGroups, tokens }) => (
        <TokenSetView
          key={set.name}
          set={set}
          tokens={tokens}
          displayGroups={displayGroups}
          selectedContextTags={selectedContextTags}
          onDownloadShallowCopy={() =>
            handleDownload(set, displayGroups, tokens)
          }
        />
      ))}
    </div>
  );
}
