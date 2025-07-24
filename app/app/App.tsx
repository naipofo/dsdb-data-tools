import React, { useState, useMemo, useCallback } from "react";
import { useDsdb } from "./hooks/useDsdb";
import Sidebar from "./components/Sidebar";
import Content from "./components/Content";
import type {
  Component,
  ContextTagGroup,
  ContextualReferenceTree,
  DisplayGroup,
  DSDBSystem,
  Tag,
  Token,
  TokenSet,
  Value,
} from "./utils/dsdb";

// This is a transformed type, so we define it here.
interface ContextualReferenceTreeItem extends ContextualReferenceTree {
  name: string;
  displayName: string;
}

// A union of all possible item types that can be selected or displayed.
type DisplayableItem =
  | Component
  | TokenSet
  | Value
  | DisplayGroup
  | ContextualReferenceTreeItem
  | ContextTagGroup
  | Tag
  | Token;

const App: React.FC = () => {
  const { system, isLoading, error, loadFile, fileName } = useDsdb();
  const [activeTab, setActiveTab] = useState<string>("components");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(
    null
  );

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
  }, []);

  const handleItemSelect = useCallback((item: DisplayableItem, tab: string) => {
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
      filteredTokensByComponent
        .map((t) => t.displayGroup)
        .filter(Boolean) as string[]
    );
    const allRelevantGroupNames = new Set<string>();

    system.displayGroups.forEach((dg) => {
      if (relevantTokenDisplayGroupNames.has(dg.name)) {
        let current: DisplayGroup | undefined = dg;
        while (current && !allRelevantGroupNames.has(current.name)) {
          allRelevantGroupNames.add(current.name);
          current = system.displayGroups.find(
            (parent) => parent.name === current!.parentGroup
          );
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
      value.tokenName ? relevantTokenNames.has(value.tokenName) : false
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

  const displayDataForCurrentTab = useMemo((): DisplayableItem[] => {
    if (!system) return [];
    let data: DisplayableItem[] = [];

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
            displayName: key.split("/").pop()!,
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

    return data.filter((item) => {
      // Generic search against displayName, name, or tokenName
      const name =
        "displayName" in item && item.displayName
          ? item.displayName
          : item.name;
      if (name?.toLowerCase().includes(lowerCaseSearchTerm)) {
        return true;
      }
      if (
        "tokenName" in item &&
        item.tokenName?.toLowerCase().includes(lowerCaseSearchTerm)
      ) {
        return true;
      }
      return false;
    });
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
        onClearComponentFilter={() => {
          setSelectedComponent(null);
          setSelectedItem(null);
        }}
        selectedItem={selectedItem}
        onClearSelection={() => setSelectedItem(null)}
      />
      <Content
        activeTab={activeTab}
        system={system}
        displayData={displayDataForCurrentTab}
        onItemSelect={handleItemSelect}
        selectedItem={selectedItem}
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
    </div>
  );
};

export default App;
