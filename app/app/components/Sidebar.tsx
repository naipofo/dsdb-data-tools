import React from "react";
import type { Component } from "../DsdbManager";

interface SidebarProps {
  fileName: string | null;
  error: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedComponent: Component | null;
  onClearSelection: () => void;
  displayName?: string;
  thumbnailUrl?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  fileName,
  error,
  onFileChange,
  selectedComponent,
  onClearSelection,
  displayName,
  thumbnailUrl,
}) => {
  return (
    <aside className="w-1/3 bg-white p-4 rounded-lg shadow-md flex flex-col h-full max-h-full">
      <header className="mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="System Thumbnail"
              className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">
            {displayName || "DSDB Browser"}
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

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {fileName && !error && (
          <p className="mt-2 text-sm text-green-700 truncate">
            Loaded: {fileName}
          </p>
        )}
      </header>

      {fileName && (
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
                onClick={onClearSelection}
                className="mt-2 text-xs px-2 py-1 bg-indigo-200 text-indigo-800 rounded hover:bg-indigo-300 transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}

      {!fileName && (
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
