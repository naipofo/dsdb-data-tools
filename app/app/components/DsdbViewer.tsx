import { useContext, useEffect, useState } from "react";
import { DsdbContext, LoadDsdbJsonContext } from "../contexts/DsdbContext";
import Sidebar from "./Sidebar";
import ContextSelector from "./ContextSelector";
import TokenList from "./TokenList";
import type {
  Component,
  ContextTagGroup,
  DisplayGroupChildItem,
  DisplayGroupTokenItem,
} from "../DsdbManager";
import ComponentTile from "./ComponentTile";
import { findBestResolution } from "../utils/findBestResolution";

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
  const [relevantContextTagGroups, setRelevantContextTagGroups] = useState<
    ContextTagGroup[]
  >([]);

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

  useEffect(() => {
    if (
      !selectedComponent ||
      !dsdb ||
      Object.keys(selectedContext).length === 0
    ) {
      setRelevantContextTagGroups([]);
      return;
    }

    function getAllTokens(
      displayGroups: DisplayGroupChildItem[]
    ): DisplayGroupTokenItem[] {
      const allTokens: DisplayGroupTokenItem[] = [];
      function recurse(groups: DisplayGroupChildItem[]) {
        for (const group of groups) {
          allTokens.push(...group.tokens);
          if (group.child) {
            recurse(group.child);
          }
        }
      }
      recurse(displayGroups);
      return allTokens;
    }

    const tokens = dsdb
      .tokensForComponent(selectedComponent)
      .flatMap((set) => getAllTokens(set.displayGroups));
    const allTags = Array.from(dsdb.tags.values());

    const relevantGroups = dsdb.contextTagGroups.filter((group) => {
      const groupTags = allTags.filter((tag) =>
        tag.name.startsWith(group.name + "/tags/")
      );
      if (groupTags.length <= 1) {
        return false;
      }

      const currentTagForGroup = selectedContext[group.name];
      const otherTags = groupTags.filter((t) => t.name !== currentTagForGroup);

      return otherTags.some((otherTag) => {
        const hypotheticalContext = {
          ...selectedContext,
          [group.name]: otherTag.name,
        };

        const currentContextTags = new Set(
          Object.values(selectedContext)
            .map((name) => dsdb.tags.get(name)?.tagName)
            .filter((t): t is string => !!t)
        );
        const hypotheticalContextTags = new Set(
          Object.values(hypotheticalContext)
            .map((name) => dsdb.tags.get(name)?.tagName)
            .filter((t): t is string => !!t)
        );

        return tokens.some((token) => {
          const currentResolution = findBestResolution(
            token.chain,
            currentContextTags
          );
          const hypotheticalResolution = findBestResolution(
            token.chain,
            hypotheticalContextTags
          );

          const currentFinalValueName =
            currentResolution?.resolutionChain.at(-1)?.name;
          const hypotheticalFinalValueName =
            hypotheticalResolution?.resolutionChain.at(-1)?.name;

          return currentFinalValueName !== hypotheticalFinalValueName;
        });
      });
    });

    setRelevantContextTagGroups(relevantGroups);
  }, [selectedComponent, selectedContext, dsdb]);

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
                contextTagGroups={relevantContextTagGroups}
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
