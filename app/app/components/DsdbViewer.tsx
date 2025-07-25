import { useContext, useEffect, useState } from "react";
import { DsdbContext, LoadDsdbJsonContext } from "../contexts/DsdbContext";
import Sidebar from "./Sidebar";
import ContextSelector from "./ContextSelector";
import TokenList from "./TokenList";
import type { Component } from "../DsdbManager";
import ComponentTile from "./ComponentTile";

export function DsdbViewer() {
  const { error, loadJson } = useContext(LoadDsdbJsonContext)!;
  const dsdb = useContext(DsdbContext);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [selectedContext, setSelectedContext] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (selectedComponent && dsdb) {
      const initialContext: Record<string, string> = {};
      dsdb.contextTagGroups.forEach((group) => {
        initialContext[group.name] = group.defaultTag;
      });
      setSelectedContext(initialContext);
    } else {
      setSelectedContext({});
    }
  }, [selectedComponent, dsdb]);

  const handleContextChange = (groupName: string, tagName: string) => {
    setSelectedContext((prev) => ({
      ...prev,
      [groupName]: tagName,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonContent = e.target?.result;
        if (typeof jsonContent === "string") {
          loadJson(jsonContent);
          setFileName(file.name);
        } else {
          console.error("File content is not a string.");
          loadJson("");
        }
      };
      reader.onerror = (e) => {
        console.error("Error reading file:", e);
        loadJson("");
      };
      reader.readAsText(file);

      setSelectedComponent(null);
    }
  };

  return (
    <>
      <div className="h-screen w-screen bg-gray-100 font-sans text-gray-800 flex p-4 gap-4">
        <Sidebar
          fileName={fileName}
          error={error}
          onFileChange={handleFileChange}
          selectedComponent={selectedComponent}
          onClearSelection={() => setSelectedComponent(null)}
          displayName={dsdb?.displayName}
          thumbnailUrl={dsdb?.thumbnailUrl}
        />
        <main className="bg-white flex-1 overflow-y-auto p-6 rounded-lg shadow-md">
          {!selectedComponent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(dsdb?.components ?? []).map((component) => (
                <ComponentTile
                  key={component.name}
                  component={component}
                  onSelect={setSelectedComponent}
                />
              ))}
            </div>
          )}
          {selectedComponent && dsdb && (
            <>
              <ContextSelector
                contextTagGroups={dsdb.contextTagGroups}
                tags={Array.from(dsdb.tags.values())}
                selectedContext={selectedContext}
                onContextChange={handleContextChange}
              />
              <TokenList
                tokenSets={dsdb.tokensForComponent(selectedComponent)}
                selectedContext={selectedContext}
                allTags={dsdb.tags}
              />
            </>
          )}
        </main>
      </div>
    </>
  );
}
