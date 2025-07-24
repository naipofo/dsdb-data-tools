import React from "react";
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
} from "../utils/dsdb";

// This is a transformed type, so we define it here.
interface ContextualReferenceTreeItem extends ContextualReferenceTree {
  name: string;
  displayName: string;
}

// A union of all possible item types that can be selected and displayed.
type DisplayableItem =
  | Component
  | TokenSet
  | Value
  | DisplayGroup
  | ContextualReferenceTreeItem
  | ContextTagGroup
  | Tag
  | Token;

interface SidebarProps {
  fileName: string | null;
  isLoading: boolean;
  error: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  system: DSDBSystem | null;
  dataCounts: {
    components: number;
    tokenSets: number;
    tokens: number;
    values: number;
    displayGroups: number;
    contextualReferenceTrees: number;
    contextTagGroups: number;
    tags: number;
  };
  selectedComponent: Component | null;
  onClearComponentFilter: () => void;
  selectedItem: DisplayableItem | null; // The currently selected item to display details for
  onClearSelection: () => void; // Function to clear the selected item
}

const Sidebar: React.FC<SidebarProps> = ({
  fileName,
  isLoading,
  error,
  onFileChange,
  activeTab,
  onTabChange,
  system,
  dataCounts,
  selectedComponent,
  onClearComponentFilter,
  selectedItem,
  onClearSelection,
}) => {
  const navItems = [
    { key: "components", label: "Components", count: dataCounts.components },
    { key: "tokenSets", label: "Token Sets", count: dataCounts.tokenSets },
    { key: "tokens", label: "Tokens", count: dataCounts.tokens },
    { key: "values", label: "Values", count: dataCounts.values },
    {
      key: "displayGroups",
      label: "Display Groups",
      count: dataCounts.displayGroups,
    },
    {
      key: "contextualReferenceTrees",
      label: "Contextual Ref Trees",
      count: dataCounts.contextualReferenceTrees,
    },
    {
      key: "contextTagGroups",
      label: "Context Tag Groups",
      count: dataCounts.contextTagGroups,
    },
    { key: "tags", label: "Tags", count: dataCounts.tags },
    { key: "system", label: "System Info", count: system ? 1 : 0 },
  ];

  return (
    <aside className="w-1/3 bg-white p-4 rounded-lg shadow-md flex flex-col h-full max-h-full">
      <header className="mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          {system?.thumbnailUrl?.thumbnailUrl && (
            <img
              src={system.thumbnailUrl.thumbnailUrl}
              alt="System Thumbnail"
              className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">
            {system?.displayName || "DSDB Browser"}
          </h1>
        </div>
        <label
          htmlFor="file-upload"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select DSDB JSON File
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {isLoading && (
          <p className="mt-2 text-sm text-blue-600">Loading file...</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {fileName && !isLoading && !error && (
          <p className="mt-2 text-sm text-green-700 truncate">
            Loaded: {fileName}
          </p>
        )}
      </header>

      {system && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Component Filter Info */}
          {selectedComponent && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-indigo-800 mb-1">
                Filtering by Component:
              </h3>
              <p className="text-sm text-indigo-700 font-medium truncate">
                {selectedComponent.displayName || selectedComponent.name}
              </p>
              <button
                onClick={onClearComponentFilter}
                className="mt-2 text-xs px-2 py-1 bg-indigo-200 text-indigo-800 rounded hover:bg-indigo-300 transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Selected Item Details */}
          {selectedItem && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0 flex flex-col max-h-[50%]">
              <div className="flex justify-between items-center mb-2 pb-2 border-b">
                <h3 className="text-md font-semibold text-gray-800">Details</h3>
                <button
                  onClick={onClearSelection}
                  className="text-xs px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
                <p className="text-sm text-gray-700 font-medium truncate mb-2">
                  {"displayName" in selectedItem && selectedItem.displayName
                    ? selectedItem.displayName
                    : selectedItem.name}
                </p>
                {/* Type guard to check if the selected item is a Component and has an image */}
                {"componentImage" in selectedItem &&
                  selectedItem.componentImage && (
                    <div className="my-2 flex justify-center p-2 bg-gray-100 rounded">
                      <img
                        src={selectedItem.componentImage.imageUrl}
                        alt="Component Thumbnail"
                        className="max-w-full h-auto rounded border border-gray-300"
                      />
                    </div>
                  )}
                <pre className="text-xs bg-white p-2 rounded border border-gray-200 whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedItem, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-3 text-gray-700">
              Sections
            </h2>
            <nav className="space-y-1">
              {navItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  disabled={tab.count === 0}
                  className={`w-full text-left px-3 py-2 rounded font-medium text-sm transition-all duration-150 flex justify-between items-center
                      ${
                        activeTab === tab.key
                          ? "bg-blue-500 text-white shadow"
                          : "text-gray-600 hover:bg-gray-100"
                      }
                      ${tab.count === 0 ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key
                        ? "bg-blue-400"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {!system && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-center text-gray-500">
            Please select a file to begin.
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
