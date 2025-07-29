import React, { useEffect, useMemo, useState } from "react";
import type {
  ContextTagGroup,
  DisplayGroupTokenItem,
  DsdbManager,
  Token,
} from "../DsdbManager";
import ContextSelector from "./ContextSelector";
import { downloadText } from "../utils/downloadText";
import { findBestResolution } from "../utils/findBestResolution";

// --- Data Structure for the Tree ---
interface TokenTreeNode {
  name: string;
  token?: Token;
  children: Map<string, TokenTreeNode>;
}

// --- Helper function to build the tree ---
const buildTokenTree = (tokens: Token[]): Map<string, TokenTreeNode> => {
  const root = new Map<string, TokenTreeNode>();

  for (const token of tokens) {
    const parts = token.tokenName.split(".");
    let currentNodeMap = root;

    parts.forEach((part, index) => {
      if (!currentNodeMap.has(part)) {
        currentNodeMap.set(part, {
          name: part,
          children: new Map(),
        });
      }

      const node = currentNodeMap.get(part)!;

      if (index === parts.length - 1) {
        // This is the leaf node
        node.token = token;
      }

      currentNodeMap = node.children;
    });
  }

  return root;
};

// --- Component to render a single token (leaf node) ---
const TokenDetailsView: React.FC<{ token: Token }> = ({ token }) => {
  return (
    <div className="pl-8 py-2 border-l border-gray-200 ml-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800">{token.displayName}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{token.tokenName}</p>
          {token.description && (
            <p className="text-sm text-gray-600 mt-1 italic">
              {token.description}
            </p>
          )}
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
          {token.tokenValueType}
        </span>
      </div>
    </div>
  );
};

// --- Recursive component to render tree nodes ---
interface TreeNodeViewProps {
  node: TokenTreeNode;
  level: number;
  path: string[];
  dsdbManager: DsdbManager;
  selectedContext: Record<string, string>;
}

const TreeNodeView: React.FC<TreeNodeViewProps> = ({
  node,
  level,
  path,
  dsdbManager,
  selectedContext,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first few levels
  const hasChildren = node.children.size > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const getAllTokensInNode = (startNode: TokenTreeNode): Token[] => {
    let tokens: Token[] = [];
    if (startNode.token) {
      tokens.push(startNode.token);
    }
    for (const childNode of startNode.children.values()) {
      tokens = tokens.concat(getAllTokensInNode(childNode));
    }
    return tokens;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tokensToExport = getAllTokensInNode(node);
    const data = dsdbManager.getTokensExport(tokensToExport, selectedContext);
    const json = JSON.stringify(data, null, 2);
    const filename = `${path.at(-1)}.json`;
    downloadText(filename, json, "application/json");
  };

  return (
    <div className={level > 0 ? "pl-4" : ""}>
      <div
        className={`flex items-center justify-between p-2 rounded-md ${
          hasChildren ? "cursor-pointer hover:bg-gray-100" : ""
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center">
          {hasChildren && (
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform mr-2 flex-shrink-0 ${
                isExpanded ? "transform rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          )}
          {!hasChildren && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 0h4v1H8V4z" />
            </svg>
          )}
          <span
            className={`font-medium ${
              hasChildren ? "text-gray-800" : "text-indigo-700"
            }`}
          >
            {node.name}
          </span>
        </div>
        {hasChildren && path.join(".").startsWith("md.sys") && (
          <button
            onClick={handleDownload}
            className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors ml-4"
          >
            Download
          </button>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="border-l border-gray-200 ml-4">
          {Array.from(node.children.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((childNode) => (
              <TreeNodeView
                key={childNode.name}
                node={childNode}
                level={level + 1}
                path={[...path, childNode.name]}
                dsdbManager={dsdbManager}
                selectedContext={selectedContext}
              />
            ))}
        </div>
      )}
      {node.token && <TokenDetailsView token={node.token} />}
    </div>
  );
};

// --- Main TokenMapView Component ---
interface TokenMapViewProps {
  dsdbManager: DsdbManager;
  onClose: () => void;
}

const TokenMapView: React.FC<TokenMapViewProps> = ({
  dsdbManager,
  onClose,
}) => {
  const [selectedContext, setSelectedContext] = useState<
    Record<string, string>
  >({});
  const [relevantContextTagGroups, setRelevantContextTagGroups] = useState<
    ContextTagGroup[]
  >([]);

  useEffect(() => {
    const initialContext: Record<string, string> = {};
    dsdbManager.contextTagGroups.forEach((group) => {
      initialContext[group.name] = group.defaultTag;
    });
    setSelectedContext(initialContext);
  }, [dsdbManager]);

  const systemTokens = useMemo(() => {
    return dsdbManager
      .getAllTokens()
      .filter((token) => token.tokenName.startsWith("md.sys"));
  }, [dsdbManager]);

  const systemTokensForResolution: DisplayGroupTokenItem[] = useMemo(() => {
    return systemTokens.map(
      ({ name, displayName, tokenName, tokenValueType, description }) => ({
        name,
        displayName,
        tokenName,
        tokenValueType,
        description,
        chain: dsdbManager.resolveTokenChain(name) ?? [],
      })
    );
  }, [systemTokens, dsdbManager]);

  useEffect(() => {
    if (Object.keys(selectedContext).length === 0) {
      setRelevantContextTagGroups([]);
      return;
    }

    const allTags = Array.from(dsdbManager.tags.values());

    const relevantGroups = dsdbManager.contextTagGroups.filter((group) => {
      const groupTags = allTags.filter((tag) =>
        tag.name.startsWith(group.name + "/tags/")
      );
      if (groupTags.length <= 1) {
        return false;
      }

      const currentTagForGroup = selectedContext[group.name];
      const otherTags = groupTags.filter((t) => t.name !== currentTagForGroup);

      return otherTags.some((otherTag) => {
        const hypotheticalContext = {
          ...selectedContext,
          [group.name]: otherTag.name,
        };

        const currentContextTags = new Set(
          Object.values(selectedContext)
            .map((name) => dsdbManager.tags.get(name)?.tagName)
            .filter((t): t is string => !!t)
        );
        const hypotheticalContextTags = new Set(
          Object.values(hypotheticalContext)
            .map((name) => dsdbManager.tags.get(name)?.tagName)
            .filter((t): t is string => !!t)
        );

        return systemTokensForResolution.some((token) => {
          const currentResolution = findBestResolution(
            token.chain,
            currentContextTags
          );
          const hypotheticalResolution = findBestResolution(
            token.chain,
            hypotheticalContextTags
          );

          const currentFinalValueName =
            currentResolution?.resolutionChain.at(-1)?.name;
          const hypotheticalFinalValueName =
            hypotheticalResolution?.resolutionChain.at(-1)?.name;

          return currentFinalValueName !== hypotheticalFinalValueName;
        });
      });
    });

    setRelevantContextTagGroups(relevantGroups);
  }, [selectedContext, dsdbManager, systemTokensForResolution]);

  const handleContextChange = (groupName: string, tagName: string) => {
    setSelectedContext((prev) => ({
      ...prev,
      [groupName]: tagName,
    }));
  };

  const tokenTree = useMemo(() => {
    const allTokens = dsdbManager.getAllTokens();
    return buildTokenTree(allTokens);
  }, [dsdbManager]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">Token Map</h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
        >
          Back to Components
        </button>
      </div>
      <div className="mb-4">
        <ContextSelector
          contextTagGroups={relevantContextTagGroups}
          tags={Array.from(dsdbManager.tags.values())}
          selectedContext={selectedContext}
          onContextChange={handleContextChange}
        />
      </div>

      <div className="bg-white rounded-lg p-4">
        {Array.from(tokenTree.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((node) => (
            <TreeNodeView
              key={node.name}
              node={node}
              level={0}
              path={[node.name]}
              dsdbManager={dsdbManager}
              selectedContext={selectedContext}
            />
          ))}
      </div>
    </div>
  );
};

export default TokenMapView;
