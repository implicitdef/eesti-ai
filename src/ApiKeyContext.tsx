import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "eesti-ai-api-key";

interface ApiKeyContextValue {
  apiKey: string;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );

  function setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }

  function clearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState("");
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const ctx = useContext(ApiKeyContext);
  if (!ctx) throw new Error("useApiKey must be used within ApiKeyProvider");
  return ctx;
}
