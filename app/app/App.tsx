import React, { useState, useEffect, useMemo, useCallback } from "react";

// Helper function to convert RGB to Hex for color display
const rgbToHex = (r, g, b) => {
  if (r === undefined || g === undefined || b === undefined) return "#000000"; // Default to black if components are missing
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Function to resolve a token's value and its resolution chain
const resolveTokenAndChain = (token, allContextualReferenceTrees) => {
  const crtEntry = allContextualReferenceTrees[token.name];
  if (
    !crtEntry ||
    !crtEntry.contextualReferenceTree ||
    crtEntry.contextualReferenceTree.length === 0
  ) {
    return { resolvedValue: null, resolutionChain: [] };
  }

  const primaryRefTree = crtEntry.contextualReferenceTree[0];
  const resolvedValue = primaryRefTree.resolvedValue;
  const resolutionChain = [];

  // Function to recursively build the chain
  const buildChain = (node) => {
    if (node && node.value && node.value.name) {
      // Extract just the last part of the name for cleaner display
      const displayPart = node.value.name.split("/").pop();
      resolutionChain.push(displayPart);
      if (node.childNodes) {
        // Recursively add child nodes to the chain
        node.childNodes.forEach(buildChain);
      }
    }
  };

  buildChain(primaryRefTree.referenceTree);

  return { resolvedValue, resolutionChain };
};

// Recursive component to render hierarchical display groups and their tokens
const DisplayGroupNode = ({
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
    return allTokens
      .filter((token) => token.displayGroup === group.name)
      .sort(
        (a, b) => (a.orderInDisplayGroup || 0) - (b.orderInDisplayGroup || 0)
      );
  }, [group.name, allTokens]);

  const [isExpanded, setIsExpanded] = useState(true); // State to manage expand/collapse

  return (
    <div className="border border-gray-200 rounded mb-2 overflow-hidden">
      <div
        className="bg-gray-100 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-semibold text-gray-800 flex items-center">
          <svg
            className={`w-4 h-4 mr-2 transform transition-transform ${
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
                {token.description && (
                  <p className="text-xs text-gray-500">{token.description}</p>
                )}
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
                        {resolutionChain.join(" \u2192 ")}{" "}
                        {/* Join with arrow */}
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

// Main App Component
const App = () => {
  const [loadedFiles, setLoadedFiles] = useState([]); // Stores array of { name: 'fileName', data: parsedJson }
  const [currentFileIndex, setCurrentFileIndex] = useState(0); // Index of the currently viewed file
  const [parseError, setParseError] = useState("");
  const [activeTab, setActiveTab] = useState("components"); // Default to components tab
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null); // New state for selected component

  // Get the currently active JSON data
  const jsonData = useMemo(() => {
    if (loadedFiles.length > 0 && loadedFiles[currentFileIndex]) {
      return loadedFiles[currentFileIndex].data;
    }
    return null;
  }, [loadedFiles, currentFileIndex]);

  // Memoize the system data from the current JSON data
  const parsedSystemData = useMemo(() => {
    // The root object is now 'Category' which contains 'system'
    if (jsonData && jsonData.system) {
      return jsonData.system;
    }
    return null;
  }, [jsonData]);

  // Handle file input change
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setParseError("");
    setLoadedFiles([]);
    setCurrentFileIndex(0);
    setSelectedItem(null); // Clear selected item
    setSelectedComponent(null); // Clear selected component
    setActiveTab("components"); // Reset to components tab

    let newLoadedFiles = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          // Check for 'system' within the root object (which is 'Category')
          if (parsed.system) {
            newLoadedFiles.push({ name: file.name, data: parsed });
          } else {
            setParseError(
              (prev) =>
                prev +
                `File "${file.name}" does not contain a "system" root object. `
            );
          }
        } catch (error) {
          setParseError(
            (prev) =>
              prev + `Error parsing "${file.name}": Invalid JSON format. `
          );
          console.error(`Error parsing file ${file.name}:`, error);
        } finally {
          filesProcessed++;
          if (filesProcessed === files.length) {
            // Sort files alphabetically by name
            newLoadedFiles.sort((a, b) => a.name.localeCompare(b.name));
            setLoadedFiles(newLoadedFiles);
            if (newLoadedFiles.length > 0) {
              setCurrentFileIndex(0); // Set first file as active
            }
          }
        }
      };
      reader.readAsText(file);
    });
  };

  // --- FILTERING LOGIC BASED ON SELECTED COMPONENT ---

  // 1. Filter Token Sets based on selectedComponent
  const filteredTokenSets = useMemo(() => {
    if (!parsedSystemData || !parsedSystemData.tokenSets) return [];
    if (!selectedComponent || !selectedComponent.tokenSets)
      return parsedSystemData.tokenSets; // If no component selected, show all

    const componentTokenSetNames = new Set(selectedComponent.tokenSets);
    return parsedSystemData.tokenSets.filter((ts) =>
      componentTokenSetNames.has(ts.name)
    );
  }, [parsedSystemData, selectedComponent]);

  // 2. Filter Tokens based on filteredTokenSets
  const filteredTokensByComponent = useMemo(() => {
    if (!parsedSystemData || !parsedSystemData.tokens) return [];
    if (!selectedComponent) return parsedSystemData.tokens; // If no component selected, show all

    const relevantTokenSetNames = new Set(
      filteredTokenSets.map((ts) => ts.name)
    );
    return parsedSystemData.tokens.filter((token) => {
      // A token's 'name' starts with 'designSystems/.../tokenSets/{tokenSetId}/tokens/{tokenId}'
      // We need to check if the tokenSetId part matches any of the relevantTokenSetNames
      const tokenNameParts = token.name.split("/tokens/");
      if (tokenNameParts.length > 1) {
        const tokenSetNamePart = tokenNameParts[0]; // e.g., "designSystems/20543ce18892f7d9/tokenSets/340b91829bd1a398"
        return relevantTokenSetNames.has(tokenSetNamePart);
      }
      return false;
    });
  }, [parsedSystemData, selectedComponent, filteredTokenSets]);

  // 3. Filter Display Groups based on filteredTokensByComponent and Token Sets
  const filteredDisplayGroupsByComponent = useMemo(() => {
    if (!parsedSystemData || !parsedSystemData.displayGroups) return [];
    if (!selectedComponent) return parsedSystemData.displayGroups;

    const relevantTokenSetNames = new Set(
      filteredTokenSets.map((ts) => ts.name)
    );
    const allRelevantDisplayGroupNames = new Set();

    // First, collect all display groups that are direct children of the filtered token sets
    // or are referenced by filtered tokens.
    parsedSystemData.displayGroups.forEach((dg) => {
      const isDirectChildOfTokenSet = Array.from(relevantTokenSetNames).some(
        (tsName) => dg.name.startsWith(`${tsName}/displayGroups/`)
      );
      const isReferencedByToken = filteredTokensByComponent.some(
        (token) => token.displayGroup === dg.name
      );

      if (isDirectChildOfTokenSet || isReferencedByToken) {
        allRelevantDisplayGroupNames.add(dg.name);
      }
    });

    // Now, recursively add all ancestors of the identified relevant display groups
    // as long as they also belong to one of the relevant token set paths.
    let changed = true;
    while (changed) {
      changed = false;
      parsedSystemData.displayGroups.forEach((dg) => {
        if (
          dg.parentGroup &&
          !allRelevantDisplayGroupNames.has(dg.parentGroup)
        ) {
          // Check if the parent group's name is in the format of a display group within a token set
          const parentDgParts = dg.parentGroup.split("/displayGroups/");
          if (parentDgParts.length > 1) {
            const parentDgTokenSetNamePart = parentDgParts[0];
            if (
              relevantTokenSetNames.has(parentDgTokenSetNamePart) &&
              allRelevantDisplayGroupNames.has(dg.name)
            ) {
              allRelevantDisplayGroupNames.add(dg.parentGroup);
              changed = true;
            }
          }
        }
      });
    }

    // Finally, filter the original display groups to include only those identified as relevant.
    return parsedSystemData.displayGroups.filter((dg) =>
      allRelevantDisplayGroupNames.has(dg.name)
    );
  }, [
    parsedSystemData,
    selectedComponent,
    filteredTokensByComponent,
    filteredTokenSets,
  ]);

  // 4. Filter Values based on filteredTokensByComponent
  const filteredValuesByComponent = useMemo(() => {
    if (!parsedSystemData || !parsedSystemData.values) return [];
    if (!selectedComponent) return parsedSystemData.values;

    const relevantTokenNames = new Set(
      filteredTokensByComponent.map((token) => token.tokenName)
    ); // Use tokenName for values
    return parsedSystemData.values.filter((value) =>
      relevantTokenNames.has(value.tokenName)
    );
  }, [parsedSystemData, selectedComponent, filteredTokensByComponent]);

  // 5. Filter Contextual Reference Trees based on filteredTokensByComponent
  const filteredContextualReferenceTreesByComponent = useMemo(() => {
    if (!parsedSystemData || !parsedSystemData.contextualReferenceTrees)
      return {}; // It's an object, not an array
    if (!selectedComponent) return parsedSystemData.contextualReferenceTrees;

    const relevantTokenNamesForCRT = new Set(
      filteredTokensByComponent.map((token) => token.name)
    ); // Use token.name (full path) as key for CRT
    const filteredCRT = {};
    for (const key in parsedSystemData.contextualReferenceTrees) {
      if (relevantTokenNamesForCRT.has(key)) {
        // CRT keys are token.name
        filteredCRT[key] = parsedSystemData.contextualReferenceTrees[key];
      }
    }
    return filteredCRT;
  }, [parsedSystemData, selectedComponent, filteredTokensByComponent]);

  // Data to display for the current active tab, after applying component filter and search term
  const displayDataForCurrentTab = useMemo(() => {
    let data = [];
    if (!parsedSystemData) return [];

    switch (activeTab) {
      case "system":
        // Only show basic system info, not the whole JSON
        return [
          {
            name: parsedSystemData.name,
            displayName: parsedSystemData.displayName,
            dsdbVersion: parsedSystemData.dsdbVersion,
            description: parsedSystemData.description,
            revisionCreateTime: parsedSystemData.revisionCreateTime,
            createTime: parsedSystemData.createTime,
            tokenNamePrefix: parsedSystemData.tokenNamePrefix,
            // Add other top-level system properties you want to display
          },
        ];
      case "components":
        data = parsedSystemData.components || [];
        break;
      case "tokenSets":
        data = filteredTokenSets;
        break;
      case "tokens":
        // For tokens tab, we want to render the hierarchical view
        // This 'data' variable won't be directly used for rendering the list,
        // but the filtering logic is still applied to `filteredTokensByComponent`
        data = filteredTokensByComponent;
        break;
      case "values":
        data = filteredValuesByComponent;
        break;
      case "displayGroups":
        data = filteredDisplayGroupsByComponent;
        break;
      case "contextTagGroups":
        data = parsedSystemData.contextTagGroups || []; // These are not filtered by component directly
        break;
      case "tags":
        data = parsedSystemData.tags || []; // These are not filtered by component directly
        break;
      case "contextualReferenceTrees": // Special case: it's an object, not an array
        // Convert the object into an array of { key, value } pairs for display
        return Object.entries(filteredContextualReferenceTreesByComponent).map(
          ([key, value]) => ({
            name: key, // Use the key as the 'name' for consistent display
            ...value, // Spread the actual value content
            displayName: key.split("/").pop(), // A simple display name from the key
          })
        );
      default:
        return [];
    }

    // Apply search term filtering to the selected data
    if (!searchTerm) {
      return data;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        (item.displayName &&
          item.displayName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (item.tokenName &&
          item.tokenName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (item.name && item.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (item.description &&
          item.description.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [
    activeTab,
    parsedSystemData,
    searchTerm,
    filteredTokenSets,
    filteredTokensByComponent,
    filteredValuesByComponent,
    filteredDisplayGroupsByComponent,
    filteredContextualReferenceTreesByComponent,
  ]);

  // Clear selected component when no file is loaded or file changes
  useEffect(() => {
    if (!jsonData) {
      setSelectedComponent(null);
    }
  }, [jsonData]);

  // Render individual item details
  const renderItemDetails = (item) => {
    if (!item) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow-md mt-4 overflow-y-auto max-h-[calc(90vh-80px)] relative">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">Details</h3>
        <button
          onClick={() => setSelectedItem(null)}
          className="absolute top-2 right-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
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
        <pre className="whitespace-pre-wrap break-words text-sm bg-gray-100 p-3 rounded border border-gray-200">
          {JSON.stringify(item, null, 2)}
        </pre>
      </div>
    );
  };

  // Render value specific properties (e.g., color swatch) - made it a useCallback for performance
  const renderValueContent = useCallback((value) => {
    if (!value) return "N/A";

    if (value.color) {
      const hexColor = rgbToHex(
        value.color.red,
        value.color.green,
        value.color.blue
      );
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border border-gray-300"
            style={{ backgroundColor: hexColor }}
          ></div>
          <span>
            {hexColor} (Alpha:{" "}
            {value.color.alpha !== undefined
              ? value.color.alpha.toFixed(2)
              : "N/A"}
            )
          </span>
        </div>
      );
    } else if (value.length) {
      return `${value.length.value}${value.length.unit}`;
    } else if (typeof value.opacity === "number") {
      return `Opacity: ${value.opacity.toFixed(2)}`;
    } else if (value.elevation) {
      return `Elevation: ${
        value.elevation.value !== undefined ? value.elevation.value : "N/A"
      }${value.elevation.unit}`;
    } else if (value.type) {
      // This is ValueType now
      return (
        <div>
          <p>Font Name Token: {value.type.fontNameTokenName}</p>
          <p>Font Weight Token: {value.type.fontWeightTokenName}</p>
          <p>Font Size Token: {value.type.fontSizeTokenName}</p>
          <p>Font Tracking Token: {value.type.fontTrackingTokenName}</p>
          <p>Line Height Token: {value.type.lineHeightTokenName}</p>
        </div>
      );
    } else if (value.fontNames) {
      return `Font Names: ${value.fontNames.values.join(", ")}`;
    } else if (value.fontSize) {
      return `Font Size: ${value.fontSize.value}${value.fontSize.unit}`;
    } else if (value.fontTracking) {
      return `Font Tracking: ${
        value.fontTracking.value !== undefined
          ? value.fontTracking.value
          : "N/A"
      }${value.fontTracking.unit}`;
    } else if (value.lineHeight) {
      return `Line Height: ${value.lineHeight.value}${value.lineHeight.unit}`;
    } else if (value.shape) {
      return (
        <div>
          <p>Family: {value.shape.family}</p>
          {value.shape.defaultSize && (
            <p>
              Default Size: {value.shape.defaultSize.value}
              {value.shape.defaultSize.unit}
            </p>
          )}
          {value.shape.topLeft && (
            <p>
              Top Left: {value.shape.topLeft.value}
              {value.shape.topLeft.unit}
            </p>
          )}
          {value.shape.topRight && (
            <p>
              Top Right: {value.shape.topRight.value}
              {value.shape.topRight.unit}
            </p>
          )}
        </div>
      );
    } else if (value.undefined) {
      return "Undefined";
    } else if (typeof value === "object" && value !== null) {
      // If it's a generic object and not one of the specific types above,
      // render it as a JSON block for inspection.
      return (
        <pre className="whitespace-pre-wrap break-words text-xs bg-gray-100 p-2 rounded border border-gray-200 mt-1">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return "Complex Value";
  }, []); // Empty dependency array means this function is memoized once

  const topLevelDisplayGroups = useMemo(() => {
    if (!parsedSystemData || !filteredDisplayGroupsByComponent) return [];
    return filteredDisplayGroupsByComponent
      .filter(
        (dg) =>
          !dg.parentGroup ||
          !filteredDisplayGroupsByComponent.some(
            (parentDg) => parentDg.name === dg.parentGroup
          )
      )
      .sort(
        (a, b) =>
          (a.orderInParentTokenSet || 0) - (b.orderInParentTokenSet || 0)
      );
  }, [parsedSystemData, filteredDisplayGroupsByComponent]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
      {/* Header */}
      <header className="p-4 bg-blue-600 text-white shadow">
        <h1 className="text-3xl font-extrabold text-center mb-4">
          DSDB Design Token Browser
        </h1>
        <div className="max-w-xl mx-auto">
          <label
            htmlFor="file-upload"
            className="block text-center mb-2 text-lg font-medium cursor-pointer"
          >
            Select DSDB JSON File(s)
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".json"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {parseError && (
            <p className="mt-3 text-red-100 text-center font-medium">
              {parseError}
            </p>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 p-4 gap-4">
        {/* Sidebar: File List and Sections */}
        <aside className="w-1/4 bg-white p-4 rounded-lg shadow flex flex-col">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Loaded Files</h2>
          <div className="mb-4 space-y-2 max-h-48 overflow-y-auto border-b pb-4 border-gray-200">
            {loadedFiles.length > 0 ? (
              loadedFiles.map((file, index) => (
                <button
                  key={file.name}
                  onClick={() => {
                    setCurrentFileIndex(index);
                    setActiveTab("components"); // Reset to components tab when switching files
                    setSearchTerm("");
                    setSelectedItem(null);
                    setSelectedComponent(null); // Clear selected component on file switch
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition
                    ${
                      index === currentFileIndex
                        ? "bg-blue-100 text-blue-800 font-semibold"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {file.name}
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No files loaded.</p>
            )}
          </div>

          {selectedComponent && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h3 className="text-base font-semibold text-blue-800 mb-1">
                Selected Component:
              </h3>
              <p className="text-sm text-blue-700">
                {selectedComponent.displayName || selectedComponent.name}
              </p>
              <button
                onClick={() => setSelectedComponent(null)}
                className="mt-2 text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 transition"
              >
                Clear Component Filter
              </button>
            </div>
          )}

          <h2 className="text-xl font-bold mb-3 text-gray-900">Sections</h2>
          <nav className="space-y-2">
            {[
              {
                key: "components",
                label: "Components",
                data: parsedSystemData?.components,
              },
              {
                key: "tokenSets",
                label: "Token Sets",
                data: filteredTokenSets,
              },
              {
                key: "tokens",
                label: "Tokens",
                data: filteredTokensByComponent,
              }, // Data for filtering, rendering is hierarchical
              {
                key: "values",
                label: "Values",
                data: filteredValuesByComponent,
              },
              {
                key: "displayGroups",
                label: "Display Groups",
                data: filteredDisplayGroupsByComponent,
              },
              {
                key: "contextualReferenceTrees",
                label: "Contextual Ref Trees",
                data: filteredContextualReferenceTreesByComponent,
              },
              {
                key: "contextTagGroups",
                label: "Context Tag Groups",
                data: parsedSystemData?.contextTagGroups,
              },
              { key: "tags", label: "Tags", data: parsedSystemData?.tags },
              { key: "system", label: "System Info", data: parsedSystemData }, // Moved to bottom
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearchTerm("");
                  setSelectedItem(null); // Clear selected item on tab change
                }}
                // Disable if no system data or if the specific data array is empty/null AND it's not the system tab
                disabled={
                  !parsedSystemData ||
                  (Array.isArray(tab.data) &&
                    tab.data.length === 0 &&
                    tab.key !== "system") ||
                  (typeof tab.data === "object" &&
                    tab.data !== null &&
                    Object.keys(tab.data).length === 0 &&
                    tab.key === "contextualReferenceTrees")
                }
                className={`w-full text-left px-3 py-2 rounded font-medium transition
                  ${
                    activeTab === tab.key
                      ? "bg-blue-500 text-white shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }
                  ${
                    !parsedSystemData ||
                    (Array.isArray(tab.data) &&
                      tab.data.length === 0 &&
                      tab.key !== "system") ||
                    (typeof tab.data === "object" &&
                      tab.data !== null &&
                      Object.keys(tab.data).length === 0 &&
                      tab.key === "contextualReferenceTrees")
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                `}
              >
                {tab.label} (
                {Array.isArray(tab.data)
                  ? tab.data.length
                  : tab.key === "contextualReferenceTrees" &&
                    typeof tab.data === "object"
                  ? Object.keys(tab.data).length
                  : tab.key === "system" && parsedSystemData
                  ? 1
                  : 0}
                )
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <section className="flex-1 bg-white p-4 rounded-lg shadow flex flex-col relative">
          {parsedSystemData ? (
            <>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 capitalize">
                {activeTab.replace(/([A-Z])/g, " $1")}
              </h2>

              {activeTab === "system" && (
                <div className="overflow-y-auto flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    Basic System Information
                  </h3>
                  {parsedSystemData && (
                    <div className="p-3 bg-gray-100 rounded border border-gray-200 text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {parsedSystemData.name}
                      </p>
                      <p>
                        <strong>Display Name:</strong>{" "}
                        {parsedSystemData.displayName}
                      </p>
                      <p>
                        <strong>DSDB Version:</strong>{" "}
                        {parsedSystemData.dsdbVersion}
                      </p>
                      <p>
                        <strong>Description:</strong>{" "}
                        {parsedSystemData.description}
                      </p>
                      <p>
                        <strong>Revision Create Time:</strong>{" "}
                        {new Date(
                          parsedSystemData.revisionCreateTime
                        ).toLocaleString()}
                      </p>
                      <p>
                        <strong>Create Time:</strong>{" "}
                        {new Date(parsedSystemData.createTime).toLocaleString()}
                      </p>
                      <p>
                        <strong>Token Name Prefix:</strong>{" "}
                        {parsedSystemData.tokenNamePrefix}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "tokens" && parsedSystemData && (
                <div className="flex-1 overflow-y-auto pr-2">
                  {selectedComponent ? (
                    filteredTokenSets.length > 0 ? (
                      filteredTokenSets.map((tokenSet) => {
                        // Find all display groups that belong to this tokenSet's path
                        const allDisplayGroupsInThisTokenSet =
                          parsedSystemData.displayGroups.filter((dg) =>
                            dg.name.startsWith(
                              tokenSet.name + "/displayGroups/"
                            )
                          );

                        // From those, find the ones that are top-level (no parent or parent is not in this tokenSet's DGs)
                        const topLevelDisplayGroupsForTokenSet =
                          allDisplayGroupsInThisTokenSet
                            .filter(
                              (dg) =>
                                !dg.parentGroup ||
                                !allDisplayGroupsInThisTokenSet.some(
                                  (parentDg) => parentDg.name === dg.parentGroup
                                )
                            )
                            .sort(
                              (a, b) =>
                                (a.orderInParentTokenSet || 0) -
                                (b.orderInParentTokenSet || 0)
                            );

                        return (
                          <div
                            key={tokenSet.name}
                            className="mb-4 border border-blue-200 rounded-lg overflow-hidden"
                          >
                            <div className="bg-blue-100 p-3">
                              <h3 className="text-xl font-bold text-blue-800">
                                {tokenSet.displayName}
                              </h3>
                              {tokenSet.description && (
                                <p className="text-sm text-blue-700">
                                  {tokenSet.description}
                                </p>
                              )}
                            </div>
                            <div className="p-3">
                              {topLevelDisplayGroupsForTokenSet.length > 0 ? (
                                topLevelDisplayGroupsForTokenSet.map(
                                  (group) => (
                                    <DisplayGroupNode
                                      key={group.name}
                                      group={group}
                                      allDisplayGroups={
                                        filteredDisplayGroupsByComponent
                                      } // Pass the full filtered list for children lookup
                                      allTokens={filteredTokensByComponent}
                                      allValues={filteredValuesByComponent}
                                      allContextualReferenceTrees={
                                        filteredContextualReferenceTreesByComponent
                                      }
                                      renderValueContent={renderValueContent}
                                    />
                                  )
                                )
                              ) : (
                                <p className="text-center text-gray-500 mt-4">
                                  No display groups found for this token set.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-gray-500 mt-10">
                        No token sets found for the selected component.
                      </p>
                    )
                  ) : (
                    <p className="text-center text-gray-500 mt-10">
                      Please select a component from the "Components" tab to
                      view its associated tokens.
                    </p>
                  )}
                </div>
              )}

              {activeTab !== "system" && activeTab !== "tokens" && (
                <>
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    className="w-full p-2 mb-4 rounded border border-gray-300 focus:ring-1 focus:ring-blue-400 focus:border-transparent transition"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <div className="flex-1 overflow-y-auto pr-2">
                    {displayDataForCurrentTab.length > 0 ? (
                      <ul className="space-y-3">
                        {displayDataForCurrentTab.map((item, index) => (
                          <li
                            key={item.name || index}
                            className="p-3 bg-gray-50 rounded shadow-sm border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition"
                            onClick={() => {
                              setSelectedItem(item);
                              if (activeTab === "components") {
                                setSelectedComponent(item); // Set selected component if clicked in components tab
                              }
                            }}
                          >
                            <h3 className="text-lg font-semibold text-blue-700">
                              {item.displayName || item.name || "Untitled"}
                            </h3>
                            <p className="text-sm text-gray-600 break-words">
                              {item.tokenName && (
                                <span className="font-mono text-xs bg-gray-200 px-1 py-0.5 rounded mr-2">
                                  {item.tokenName}
                                </span>
                              )}
                              {item.tokenValueType && (
                                <span className="font-medium text-purple-600">
                                  {item.tokenValueType}
                                </span>
                              )}
                              {item.description && (
                                <span className="block mt-1 text-gray-500 text-sm">
                                  {item.description}
                                </span>
                              )}
                              {activeTab === "values" && (
                                <div className="mt-2 text-sm">
                                  {renderValueContent(item)}
                                </div>
                              )}
                              {activeTab === "contextualReferenceTrees" &&
                                item.resolvedValue && (
                                  <div className="mt-2 text-sm">
                                    <p className="font-semibold">
                                      Resolved Value:
                                    </p>
                                    {renderValueContent(item.resolvedValue)}
                                  </div>
                                )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500 mt-10">
                        No data found for "{activeTab}" or no items match your
                        search.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 mt-20 text-lg">
              Please select your DSDB JSON file(s) to begin exploring.
            </p>
          )}

          {/* Item Details Panel (positioned absolutely) */}
          {selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                {renderItemDetails(selectedItem)}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
