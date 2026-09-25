import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { usePersistedState } from "./usePersistedState";

const OWNER_MODE_KEY = "opimasin-owner-mode";

interface OwnerModeContextValue {
  ownerMode: boolean;
  toggleOwnerMode: () => void;
}

const OwnerModeContext = createContext<OwnerModeContextValue | null>(null);

/**
 * Owner mode reveals features that are hidden from regular users. It is
 * toggled by a secret gesture in the header and persisted in localStorage.
 */
export function OwnerModeProvider({ children }: { children: ReactNode }) {
  const [ownerMode, setOwnerMode] = usePersistedState(OWNER_MODE_KEY, false);

  return (
    <OwnerModeContext.Provider
      value={{ ownerMode, toggleOwnerMode: () => setOwnerMode((v) => !v) }}
    >
      {children}
    </OwnerModeContext.Provider>
  );
}

export function useOwnerMode() {
  const ctx = useContext(OwnerModeContext);
  if (!ctx)
    throw new Error("useOwnerMode must be used within an OwnerModeProvider");
  return ctx;
}
