import React, { useState, useMemo, useCallback } from "react";
import { useDsdb } from "./hooks/useDsdb";
import Sidebar from "./components/Sidebar";
import Content from "./components/Content";
import type { Component } from "./utils/dsdb";

// A simple modal to display raw JSON data of a selected item.
const ItemDetailModal: React.FC<{
  item: any;
  onClose: () => void;
}> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={onClose} // Close modal on overlay click
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            Details: {item.displayName || item.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            aria-label="Close details"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <pre className="flex-1 overflow-y-auto text-sm bg-gray-100 p-4 rounded border border-gray-200">
          {JSON.stringify(item, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { system, isLoading, error, loadFile, fileName } = useDsdb();
  const [activeTab, setActiveTab] = useState<string>("components");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        loadFile(file);
        // Reset state when a new file is loaded
        setActiveTab("components");
        setSearchTerm("");
        setSelectedComponent(null);
        setSelectedItem(null);
      }
    },
    [loadFile]
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSelectedItem(null);
  }, []);

  const handleItemSelect = useCallback((item: any, tab: string) => {
    setSelectedItem(item);
    // If the user clicks a component in the 'components' tab, set it as the filter.
    if (tab === "components") {
      setSelectedComponent(item as Component);
    }
  }, []);

  // --- FILTERING LOGIC ---

  const filteredTokenSets = useMemo(() => {
    if (!system?.tokenSets) return [];
    if (!selectedComponent?.tokenSets) return system.tokenSets;
    const componentTokenSetNames = new Set(selectedComponent.tokenSets);
    return system.tokenSets.filter((ts) => componentTokenSetNames.has(ts.name));
  }, [system, selectedComponent]);

  const filteredTokensByComponent = useMemo(() => {
    if (!system?.tokens) return [];
    if (!selectedComponent) return system.tokens;
    const relevantTokenSetNames = new Set(
      filteredTokenSets.map((ts) => ts.name)
    );
    return system.tokens.filter((token) => {
      const tokenSetNamePart = token.name.substring(
        0,
        token.name.indexOf("/tokens/")
      );
      return relevantTokenSetNames.has(tokenSetNamePart);
    });
  }, [system, selectedComponent, filteredTokenSets]);

  const filteredDisplayGroupsByComponent = useMemo(() => {
    if (!system?.displayGroups) return [];
    if (!selectedComponent) return system.displayGroups;

    const relevantTokenDisplayGroupNames = new Set(
      filteredTokensByComponent.map((t) => t.displayGroup)
    );
    const allRelevantGroupNames = new Set<string>();

    system.displayGroups.forEach((dg) => {
      if (relevantTokenDisplayGroupNames.has(dg.name)) {
        let current = dg;
        while (current && !allRelevantGroupNames.has(current.name)) {
          allRelevantGroupNames.add(current.name);
          current = system.displayGroups.find(
            (parent) => parent.name === current.parentGroup
          )!;
        }
      }
    });

    return system.displayGroups.filter((dg) =>
      allRelevantGroupNames.has(dg.name)
    );
  }, [system, selectedComponent, filteredTokensByComponent]);

  const filteredValuesByComponent = useMemo(() => {
    if (!system?.values) return [];
    if (!selectedComponent) return system.values;
    const relevantTokenNames = new Set(
      filteredTokensByComponent.map((token) => token.tokenName)
    );
    return system.values.filter((value) =>
      relevantTokenNames.has(value.tokenName)
    );
  }, [system, selectedComponent, filteredTokensByComponent]);

  const filteredContextualReferenceTreesByComponent = useMemo(() => {
    if (!system?.contextualReferenceTrees) return {};
    if (!selectedComponent) return system.contextualReferenceTrees;
    const relevantTokenInstanceNames = new Set(
      filteredTokensByComponent.map((token) => token.name)
    );
    return Object.fromEntries(
      Object.entries(system.contextualReferenceTrees).filter(([key]) =>
        relevantTokenInstanceNames.has(key)
      )
    );
  }, [system, selectedComponent, filteredTokensByComponent]);

  // --- SEARCH AND DISPLAY LOGIC ---

  const displayDataForCurrentTab = useMemo(() => {
    if (!system) return [];
    let data: any[] = [];

    switch (activeTab) {
      case "components":
        data = system.components || [];
        break;
      case "tokenSets":
        data = filteredTokenSets;
        break;
      case "values":
        data = filteredValuesByComponent;
        break;
      case "displayGroups":
        data = filteredDisplayGroupsByComponent;
        break;
      case "contextualReferenceTrees":
        return Object.entries(filteredContextualReferenceTreesByComponent).map(
          ([key, value]) => ({
            name: key,
            displayName: key.split("/").pop(),
            ...value,
          })
        );
      case "contextTagGroups":
        data = system.contextTagGroups || [];
        break;
      case "tags":
        data = system.tags || [];
        break;
      // 'tokens' and 'system' tabs have custom rendering, so they don't need list data.
      case "tokens":
        return filteredTokensByComponent;
      default:
        return [];
    }

    if (!searchTerm) return data;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return data.filter(
      (item) =>
        (item.displayName &&
          item.displayName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (item.name && item.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (item.tokenName &&
          item.tokenName.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [
    activeTab,
    system,
    searchTerm,
    filteredTokenSets,
    filteredValuesByComponent,
    filteredDisplayGroupsByComponent,
    filteredContextualReferenceTreesByComponent,
    filteredTokensByComponent,
  ]);

  const dataCounts = useMemo(
    () => ({
      components: system?.components?.length ?? 0,
      tokenSets: filteredTokenSets.length,
      tokens: filteredTokensByComponent.length,
      values: filteredValuesByComponent.length,
      displayGroups: filteredDisplayGroupsByComponent.length,
      contextualReferenceTrees: Object.keys(
        filteredContextualReferenceTreesByComponent
      ).length,
      contextTagGroups: system?.contextTagGroups?.length ?? 0,
      tags: system?.tags?.length ?? 0,
    }),
    [
      system,
      filteredTokenSets,
      filteredTokensByComponent,
      filteredValuesByComponent,
      filteredDisplayGroupsByComponent,
      filteredContextualReferenceTreesByComponent,
    ]
  );

  return (
    <div className="h-screen w-screen bg-gray-100 font-sans text-gray-800 flex p-4 gap-4">
      <Sidebar
        fileName={fileName}
        isLoading={isLoading}
        error={error}
        onFileChange={handleFileChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        system={system}
        dataCounts={dataCounts}
        selectedComponent={selectedComponent}
        onClearComponentFilter={() => setSelectedComponent(null)}
      />
      <Content
        activeTab={activeTab}
        system={system}
        displayData={displayDataForCurrentTab}
        onItemSelect={handleItemSelect}
        selectedComponent={selectedComponent}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        // Props for the hierarchical token view
        filteredTokenSets={filteredTokenSets}
        filteredTokensByComponent={filteredTokensByComponent}
        filteredDisplayGroupsByComponent={filteredDisplayGroupsByComponent}
        filteredValuesByComponent={filteredValuesByComponent}
        filteredContextualReferenceTreesByComponent={
          filteredContextualReferenceTreesByComponent
        }
      />
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};

export default App;
