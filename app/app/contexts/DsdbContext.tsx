import {
  createContext,
  useCallback,
  useState,
  type PropsWithChildren,
} from "react";
import { DsdbManager } from "../DsdbManager";

export const DsdbContext = createContext<DsdbManager | null>(null);
export const LoadDsdbJsonContext = createContext<{
  loadJson: (json: string) => void;
  error: string | null;
} | null>(null);

export function DsdbProvider({ children }: PropsWithChildren) {
  const [manager, setManager] = useState<DsdbManager | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDsdbJson = useCallback((json: string) => {
    try {
      const newManager = DsdbManager.fromJson(json);
      setManager(newManager);
      setLoadError(null);
    } catch (error: any) {
      console.error("Failed to load DSDB JSON:", error);
      setManager(null);
      setLoadError(
        error.message || "An unknown error occurred while loading DSDB JSON."
      );
    }
  }, []);

  return (
    <DsdbContext.Provider value={manager}>
      <LoadDsdbJsonContext.Provider
        value={{ loadJson: loadDsdbJson, error: loadError }}
      >
        {children}
      </LoadDsdbJsonContext.Provider>
    </DsdbContext.Provider>
  );
}
