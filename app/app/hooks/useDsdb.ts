import { useState, useMemo, useCallback } from "react";
import type { DSDB, DSDBSystem } from "../utils/dsdb";

export interface DsdbHook {
  /** The name of the currently loaded file. */
  fileName: string | null;
  /** The parsed DSDB system data. */
  system: DSDBSystem | null;
  /** A boolean indicating if the data is currently being loaded. */
  isLoading: boolean;
  /** Any error message that occurred during file loading or parsing. */
  error: string | null;
  /**
   * A map of all components, indexed by their name, for quick lookups.
   */
  allComponentsMap: Map<string, any>;
  /**
   * A map of all tokens, indexed by their name, for quick lookups.
   */
  allTokensMap: Map<string, any>;
  /**
   * A map of all values, indexed by their tokenName, for quick lookups.
   */
  allValuesMap: Map<string, any>;
  /**
   * The function to call to load a DSDB file.
   * @param file The file to load.
   */
  loadFile: (file: File) => void;
}

/**
 * A custom hook to manage loading and processing of a DSDB JSON file.
 * It handles file reading, JSON parsing, and memoizes the indexed data for performance.
 * @returns An object containing the DSDB data, loading state, error state, and a function to load a file.
 */
export const useDsdb = (): DsdbHook => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [system, setSystem] = useState<DSDBSystem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback((file: File) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSystem(null);
    setFileName(null);

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (typeof event.target?.result !== "string") {
          throw new Error("File could not be read.");
        }

        const parsed: DSDB = JSON.parse(event.target.result);

        if (parsed && parsed.system) {
          setSystem(parsed.system);
          setFileName(file.name);
        } else {
          throw new Error(
            'Invalid DSDB format: "system" root object not found.'
          );
        }
      } catch (e: any) {
        setError(e.message || "Failed to parse JSON file.");
        console.error("DSDB parsing error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file.");
      setIsLoading(false);
    };

    reader.readAsText(file);
  }, []);

  const allComponentsMap = useMemo(() => {
    if (!system?.components) return new Map();
    return new Map(system.components.map((c) => [c.name, c]));
  }, [system]);

  const allTokensMap = useMemo(() => {
    if (!system?.tokens) return new Map();
    return new Map(system.tokens.map((t) => [t.name, t]));
  }, [system]);

  const allValuesMap = useMemo(() => {
    if (!system?.values) return new Map();
    return new Map(system.values.map((v) => [v.tokenName, v]));
  }, [system]);

  return {
    fileName,
    system,
    isLoading,
    error,
    loadFile,
    allComponentsMap,
    allTokensMap,
    allValuesMap,
  };
};
