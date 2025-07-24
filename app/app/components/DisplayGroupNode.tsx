import React, { useState, useMemo } from 'react';
import type {
  DisplayGroup,
  Token,
  Value,
  ContextualReferenceTree,
  ResolvedValue,
} from '../utils/dsdb';
import { resolveTokenAndChain } from '../utils/dsdb';

interface DisplayGroupNodeProps {
  group: DisplayGroup;
  allDisplayGroups: DisplayGroup[];
  allTokens: Token[];
  allValues: Value[]; // Keep for renderValueContent, though not directly used here
  allContextualReferenceTrees: Record<string, ContextualReferenceTree>;
  renderValueContent: (resolvedValue: ResolvedValue) => React.ReactNode;
}

const DisplayGroupNode: React.FC<DisplayGroupNodeProps> = ({
  group,
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
    return allTokens.filter((token) => token.displayGroup === group.name);
    // Note: The original implementation had a sort by 'orderInDisplayGroup'.
    // This field is not in the dsdb_format.md, so it's removed for now.
    // If sorting is needed, the data model should be updated.
  }, [group.name, allTokens]);

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded mb-2 overflow-hidden">
      <div
        className="bg-gray-100 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-semibold text-gray-800 flex items-center">
          <svg
            className={`w-4 h-4 mr-2 transform transition-transform ${
              isExpanded ? 'rotate-90' : ''
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
      </div>
      {isExpanded && (
        <div className="p-3">
          {tokensInGroup.map((token) => {
            const { resolvedValue, resolutionChain } = resolveTokenAndChain(
              token,
              allContextualReferenceTrees
            );
            return (
              <div
                key={token.name}
                className="mb-2 p-2 border-b border-gray-100 last:border-b-0"
              >
                <p className="font-medium text-blue-700">{token.displayName}</p>
                <div className="text-sm text-gray-700 mt-1">
                  <span className="font-mono text-xs bg-gray-200 px-1 py-0.5 rounded mr-2">
                    {token.tokenName}
                  </span>
                  <span className="font-medium text-purple-600">
                    {token.tokenValueType}
                  </span>

                  {resolutionChain.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Resolution Chain:</p>
                      <div className="text-xs font-mono text-gray-700 bg-gray-100 p-1 rounded overflow-x-auto">
                        {resolutionChain.join(' → ')}
                      </div>
                    </div>
                  )}

                  {resolvedValue && (
                    <div className="mt-1">
                      <p className="font-semibold text-gray-800">
                        Resolved Value:
                      </p>
                      {renderValueContent(resolvedValue)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {childrenGroups.map((childGroup) => (
            <DisplayGroupNode
              key={childGroup.name}
              group={childGroup}
              allDisplayGroups={allDisplayGroups}
              allTokens={allTokens}
              allValues={allValues}
              allContextualReferenceTrees={allContextualReferenceTrees}
              renderValueContent={renderValueContent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DisplayGroupNode;
