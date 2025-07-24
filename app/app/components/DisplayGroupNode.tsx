import React, { useState, useMemo } from "react";
import type {
  DisplayGroup,
  Token,
  Value,
  ContextualReferenceTree,
  ResolvedValue,
  DSDBSystem,
} from "../utils/dsdb";
import { resolveTokenAndChain } from "../utils/dsdb";
import ResolutionChain from "./ResolutionChain";
import test from "node:test";

interface DisplayGroupNodeProps {
  group: DisplayGroup;
  system: DSDBSystem | null; // Added to pass down to ResolutionChain
  allDisplayGroups: DisplayGroup[];
  allTokens: Token[];
  allValues: Value[];
  allContextualReferenceTrees: Record<string, ContextualReferenceTree>;
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
}

const DisplayGroupNode: React.FC<DisplayGroupNodeProps> = ({
  group,
  system,
  allDisplayGroups,
  allTokens,
  allValues,
  allContextualReferenceTrees,
  renderValueContent,
}) => {
  const childrenGroups = useMemo(() => {
    return allDisplayGroups
      .filter((dg) => dg.parentGroup === group.name)
      .sort(
        (a, b) =>
          (a.orderInParentDisplayGroup || 0) -
          (b.orderInParentDisplayGroup || 0)
      );
  }, [group.name, allDisplayGroups]);

  const tokensInGroup = useMemo(() => {
    return allTokens
      .filter((token) => token.displayGroup === group.name)
      .sort(
        (a, b) => (a.orderInDisplayGroup ?? 0) - (b.orderInDisplayGroup ?? 0)
      );
  }, [group.name, allTokens]);

  const [isExpanded, setIsExpanded] = useState(true);

  if (!system) {
    return null; // System object is required for ResolutionChain
  }

  return (
    <div className="border border-gray-200 rounded-lg mb-2 overflow-hidden bg-white">
      <button
        className="bg-gray-50 p-3 w-full flex items-center justify-between text-left cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <h4 className="font-semibold text-gray-800 flex items-center">
          <svg
            className={`w-4 h-4 mr-2 transform transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
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
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
          {group.displayName}
        </h4>
      </button>
      {isExpanded && (
        <div className="p-3 divide-y divide-gray-100">
          {tokensInGroup.map((token) => {
            const resolved = resolveTokenAndChain(
              token,
              allContextualReferenceTrees
            );
            return (
              <div key={token.name} className="py-3 first:pt-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-blue-800">
                      {token.displayName}
                    </p>
                    <p className="font-mono text-xs text-gray-500 mt-1">
                      {token.tokenName}
                    </p>
                  </div>
                  <span className="font-medium text-purple-600 text-xs bg-purple-100 px-2 py-1 rounded-full flex-shrink-0">
                    {token.tokenValueType}
                  </span>
                </div>

                <div className="text-sm text-gray-700 mt-2 pl-2 border-l-2 border-gray-200">
                  <ResolutionChain
                    chain={resolved}
                    system={system}
                    renderValueContent={renderValueContent}
                  />
                </div>
              </div>
            );
          })}
          {childrenGroups.map((childGroup) => (
            <div key={childGroup.name} className="pt-2">
              <DisplayGroupNode
                group={childGroup}
                system={system}
                allDisplayGroups={allDisplayGroups}
                allTokens={allTokens}
                allValues={allValues}
                allContextualReferenceTrees={allContextualReferenceTrees}
                renderValueContent={renderValueContent}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayGroupNode;
