import React from 'react';
import type { Component, DSDBSystem } from '../utils/dsdb';

interface SidebarProps {
  fileName: string | null;
  isLoading: boolean;
  error: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  system: DSDBSystem | null;
  // The following props are for displaying item counts in the navigation
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
}) => {
  const navItems = [
    { key: 'components', label: 'Components', count: dataCounts.components },
    { key: 'tokenSets', label: 'Token Sets', count: dataCounts.tokenSets },
    { key: 'tokens', label: 'Tokens', count: dataCounts.tokens },
    { key: 'values', label: 'Values', count: dataCounts.values },
    { key: 'displayGroups', label: 'Display Groups', count: dataCounts.displayGroups },
    { key: 'contextualReferenceTrees', label: 'Contextual Ref Trees', count: dataCounts.contextualReferenceTrees },
    { key: 'contextTagGroups', label: 'Context Tag Groups', count: dataCounts.contextTagGroups },
    { key: 'tags', label: 'Tags', count: dataCounts.tags },
    { key: 'system', label: 'System Info', count: system ? 1 : 0 },
  ];

  return (
    <aside className="w-1/4 bg-white p-4 rounded-lg shadow-md flex flex-col h-full">
      <header className="mb-4 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">DSDB Browser</h1>
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
        {isLoading && <p className="mt-2 text-sm text-blue-600">Loading file...</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {fileName && !isLoading && !error && (
            <p className="mt-2 text-sm text-green-700 truncate">Loaded: {fileName}</p>
        )}
      </header>

      {system && (
        <div className="flex-1 flex flex-col overflow-y-auto">
            {selectedComponent && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
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

            <h2 className="text-lg font-semibold mb-3 text-gray-700">Sections</h2>
            <nav className="space-y-1 pr-2 -mr-2">
                {navItems.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    disabled={tab.count === 0}
                    className={`w-full text-left px-3 py-2 rounded font-medium text-sm transition-all duration-150 flex justify-between items-center
                    ${
                        activeTab === tab.key
                        ? 'bg-blue-500 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                    ${
                        tab.count === 0
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }
                    `}
                >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-blue-400' : 'bg-gray-200 text-gray-700'}`}>
                        {tab.count}
                    </span>
                </button>
                ))}
            </nav>
        </div>
      )}

      {!system && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-gray-500">Please select a file to begin.</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
