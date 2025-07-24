import React, { useState } from "react";
import type {
  DisplayGroup,
  Token,
  Value,
  ContextualReferenceTree,
  TokenSet,
  DSDBSystem,
} from "../utils/dsdb";
import DisplayGroupNode from "./DisplayGroupNode";
import ValueContent from "./ValueContent";

interface TokenSetNodeProps {
  tokenSet: TokenSet;
  system: DSDBSystem | null;
  allDisplayGroups: DisplayGroup[];
  allTokens: Token[];
  allValues: Value[];
  allContextualReferenceTrees: Record<string, ContextualReferenceTree>;
}

const TokenSetNode: React.FC<TokenSetNodeProps> = ({
  tokenSet,
  system,
  allDisplayGroups,
  allTokens,
  allValues,
  allContextualReferenceTrees,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded

  // Find top-level display groups for this specific token set
  const topLevelDisplayGroupsForTokenSet = allDisplayGroups
    .filter(
      (dg) =>
        dg.name.startsWith(`${tokenSet.name}/displayGroups/`) &&
        (!dg.parentGroup ||
          !allDisplayGroups.some(
            (parentDg) => parentDg.name === dg.parentGroup
          ))
    )
    .sort(
      (a, b) =>
        (a.orderInParentDisplayGroup ?? 0) - (b.orderInParentDisplayGroup ?? 0)
    );

  return (
    <div className="mb-6 border border-blue-200 rounded-lg bg-white shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left bg-blue-50 p-4 border-b border-blue-200 flex justify-between items-center hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-expanded={isExpanded}
      >
        <h3 className="text-xl font-bold text-blue-800">
          {tokenSet.displayName}
        </h3>
        <svg
          className={`w-5 h-5 text-blue-600 transform transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4">
          {topLevelDisplayGroupsForTokenSet.length > 0 ? (
            topLevelDisplayGroupsForTokenSet.map((group) => (
              <DisplayGroupNode
                key={group.name}
                group={group}
                system={system}
                allDisplayGroups={allDisplayGroups}
                allTokens={allTokens}
                allValues={allValues}
                allContextualReferenceTrees={allContextualReferenceTrees}
                renderValueContent={(value) => <ValueContent value={value} />}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              No display groups found for this token set.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenSetNode;
