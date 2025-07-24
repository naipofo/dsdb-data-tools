// dsdb-data-tools/app/app/components/Content.tsx

import React from "react";
import type {
  Component,
  DisplayGroup,
  DSDBSystem,
  Token,
  TokenSet,
  Value,
  ContextualReferenceTree,
} from "../utils/dsdb";
import DisplayGroupNode from "./DisplayGroupNode";
import ValueContent from "./ValueContent";

// --- Type Definitions for Props ---

interface ContentProps {
  activeTab: string;
  system: DSDBSystem | null;
  displayData: any[];
  onItemSelect: (item: any, tab: string) => void;
  selectedComponent: Component | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  // Data needed for the 'tokens' tab hierarchical view
  filteredTokenSets: TokenSet[];
  filteredTokensByComponent: Token[];
  filteredDisplayGroupsByComponent: DisplayGroup[];
  filteredValuesByComponent: Value[];
  filteredContextualReferenceTreesByComponent: Record<
    string,
    ContextualReferenceTree
  >;
}

// --- Helper Components ---

const SystemInfo: React.FC<{ system: DSDBSystem }> = ({ system }) => (
  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-2">
    <p>
      <strong>Name:</strong> {system.name}
    </p>
    <p>
      <strong>Display Name:</strong> {system.displayName}
    </p>
    <p>
      <strong>DSDB Version:</strong> {system.dsdbVersion}
    </p>
    <p>
      <strong>Description:</strong> {system.description}
    </p>
    <p>
      <strong>Token Name Prefix:</strong> {system.tokenNamePrefix}
    </p>
  </div>
);

const TokenHierarchyView: React.FC<{
  selectedComponent: Component | null;
  filteredTokenSets: TokenSet[];
  allDisplayGroups: DisplayGroup[];
  allTokens: Token[];
  allValues: Value[];
  allContextualReferenceTrees: Record<string, ContextualReferenceTree>;
}> = ({
  selectedComponent,
  filteredTokenSets,
  allDisplayGroups,
  allTokens,
  allValues,
  allContextualReferenceTrees,
}) => {
  if (!selectedComponent) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Please select a component from the "Components" tab to view its
        associated tokens.
      </p>
    );
  }

  if (filteredTokenSets.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-10">
        No token sets found for the selected component.
      </p>
    );
  }

  return (
    <>
      {filteredTokenSets.map((tokenSet) => {
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
              (a.orderInParentDisplayGroup || 0) -
              (b.orderInParentDisplayGroup || 0)
          );

        return (
          <div
            key={tokenSet.name}
            className="mb-6 border border-blue-200 rounded-lg bg-white"
          >
            <div className="bg-blue-50 p-4 border-b border-blue-200">
              <h3 className="text-xl font-bold text-blue-800">
                {tokenSet.displayName}
              </h3>
            </div>
            <div className="p-4">
              {topLevelDisplayGroupsForTokenSet.length > 0 ? (
                topLevelDisplayGroupsForTokenSet.map((group) => (
                  <DisplayGroupNode
                    key={group.name}
                    group={group}
                    allDisplayGroups={allDisplayGroups}
                    allTokens={allTokens}
                    allValues={allValues}
                    allContextualReferenceTrees={allContextualReferenceTrees}
                    renderValueContent={(value) => (
                      <ValueContent value={value} />
                    )}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No display groups found for this token set.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

const ItemList: React.FC<{
  items: any[];
  activeTab: string;
  onItemSelect: (item: any, tab: string) => void;
}> = ({ items, activeTab, onItemSelect }) => (
  <ul className="space-y-3">
    {items.map((item, index) => (
      <li
        key={item.name || index}
        className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-150"
        onClick={() => onItemSelect(item, activeTab)}
      >
        <h3 className="text-lg font-semibold text-blue-800 truncate">
          {item.displayName || item.name || "Untitled"}
        </h3>
        {item.tokenName && (
          <p className="text-sm text-gray-600 break-words mt-1">
            <span className="font-mono text-xs bg-gray-200 px-1 py-0.5 rounded mr-2">
              {item.tokenName}
            </span>
            {item.tokenValueType && (
              <span className="font-medium text-purple-600">
                {item.tokenValueType}
              </span>
            )}
          </p>
        )}
        {activeTab === "values" && (
          <div className="mt-2 text-sm">
            <ValueContent value={item} />
          </div>
        )}
      </li>
    ))}
  </ul>
);

// --- Main Content Component ---

const Content: React.FC<ContentProps> = ({
  activeTab,
  system,
  displayData,
  onItemSelect,
  selectedComponent,
  searchTerm,
  onSearchChange,
  filteredTokenSets,
  filteredTokensByComponent,
  filteredDisplayGroupsByComponent,
  filteredValuesByComponent,
  filteredContextualReferenceTreesByComponent,
}) => {
  const showSearchBar = activeTab !== "system" && activeTab !== "tokens";
  const tabTitle = activeTab.replace(/([A-Z])/g, " $1");

  return (
    <section className="flex-1 bg-white p-6 rounded-lg shadow-md flex flex-col relative h-full overflow-y-auto">
      <header className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {tabTitle}
        </h2>
      </header>

      {showSearchBar && (
        <div className="py-4">
          <input
            type="text"
            placeholder={`Search in ${tabTitle}...`}
            className="w-full p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      <div className="flex-1 pt-4 overflow-y-auto pr-2 -mr-4">
        {activeTab === "system" && system && <SystemInfo system={system} />}

        {activeTab === "tokens" && system && (
          <TokenHierarchyView
            selectedComponent={selectedComponent}
            filteredTokenSets={filteredTokenSets}
            allDisplayGroups={filteredDisplayGroupsByComponent}
            allTokens={filteredTokensByComponent}
            allValues={filteredValuesByComponent}
            allContextualReferenceTrees={
              filteredContextualReferenceTreesByComponent
            }
          />
        )}

        {activeTab !== "system" &&
          activeTab !== "tokens" &&
          (displayData.length > 0 ? (
            <ItemList
              items={displayData}
              activeTab={activeTab}
              onItemSelect={onItemSelect}
            />
          ) : (
            <p className="text-center text-gray-500 mt-10">
              No items found for "{tabTitle}"
              {searchTerm && ` matching "${searchTerm}"`}.
            </p>
          ))}
      </div>
    </section>
  );
};

export default Content;
