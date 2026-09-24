import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface CredentialField {
  name: string;
  label: string;
  storageKey: string;
  placeholder: string;
  secret: boolean;
}

export interface CredentialDefinition {
  title: string;
  description: string;
  fields: CredentialField[];
  /** Short parts shown in the bar under the header once the credential is set. */
  summary: (
    values: Record<string, string>,
  ) => { label: string; value: string }[];
}

/**
 * Credentials the app can hold, each stored in localStorage (one raw string
 * per field) and shown / cleared as a unit from the bar under the header.
 * Any combination of them may be set.
 */
export const CREDENTIALS = {
  anthropic: {
    title: "Enter your Anthropic API key",
    description:
      "This needs an Anthropic API key. It will be saved in your browser's local storage and can be cleared at any time.",
    fields: [
      {
        name: "apiKey",
        label: "API key",
        storageKey: "eesti-ai-api-key",
        placeholder: "sk-ant-...",
        secret: true,
      },
    ],
    summary: (values) => [
      { label: "API key ending in", value: values.apiKey.slice(-5) },
    ],
  },
  baserow: {
    title: "Connect your Baserow table",
    description:
      "This needs a Baserow database token with read, create and update permissions on your vocabulary table, and that table's ID (the number after /table/ in its URL). Both will be saved in your browser's local storage and can be cleared at any time.",
    fields: [
      {
        name: "token",
        label: "Database token",
        storageKey: "eesti-ai-baserow-token",
        placeholder: "Database token",
        secret: true,
      },
      {
        name: "tableId",
        label: "Table ID",
        storageKey: "eesti-ai-baserow-table-id",
        placeholder: "e.g. 123456",
        secret: false,
      },
    ],
    summary: (values) => [
      { label: "Baserow token ending in", value: values.token.slice(-5) },
      { label: "table", value: values.tableId },
    ],
  },
} satisfies Record<string, CredentialDefinition>;

export type CredentialKind = keyof typeof CREDENTIALS;

export const CREDENTIAL_KINDS = Object.keys(CREDENTIALS) as CredentialKind[];

type CredentialValues = Record<string, string>;

function readValues(kind: CredentialKind): CredentialValues {
  return Object.fromEntries(
    CREDENTIALS[kind].fields.map((field) => [
      field.name,
      localStorage.getItem(field.storageKey) ?? "",
    ]),
  );
}

interface CredentialsContextValue {
  values: Record<CredentialKind, CredentialValues>;
  set: (kind: CredentialKind, values: CredentialValues) => void;
  clear: (kind: CredentialKind) => void;
}

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState(
    () =>
      Object.fromEntries(
        CREDENTIAL_KINDS.map((kind) => [kind, readValues(kind)]),
      ) as Record<CredentialKind, CredentialValues>,
  );

  function set(kind: CredentialKind, newValues: CredentialValues) {
    for (const field of CREDENTIALS[kind].fields) {
      localStorage.setItem(field.storageKey, newValues[field.name] ?? "");
    }
    setValues((prev) => ({ ...prev, [kind]: readValues(kind) }));
  }

  function clear(kind: CredentialKind) {
    for (const field of CREDENTIALS[kind].fields) {
      localStorage.removeItem(field.storageKey);
    }
    setValues((prev) => ({ ...prev, [kind]: readValues(kind) }));
  }

  return (
    <CredentialsContext.Provider value={{ values, set, clear }}>
      {children}
    </CredentialsContext.Provider>
  );
}

function useCredentialsContext() {
  const ctx = useContext(CredentialsContext);
  if (!ctx)
    throw new Error(
      "Credentials hooks must be used within CredentialsProvider",
    );
  return ctx;
}

function isComplete(kind: CredentialKind, values: CredentialValues) {
  return CREDENTIALS[kind].fields.every((field) => !!values[field.name]);
}

/** The kinds of credentials currently stored, in definition order. */
export function useSetCredentialKinds(): CredentialKind[] {
  const { values } = useCredentialsContext();
  return CREDENTIAL_KINDS.filter((kind) => isComplete(kind, values[kind]));
}

export function useCredential(kind: CredentialKind) {
  const ctx = useCredentialsContext();
  const values = ctx.values[kind];
  return {
    values,
    isSet: isComplete(kind, values),
    set: (newValues: CredentialValues) => ctx.set(kind, newValues),
    clear: () => ctx.clear(kind),
  };
}

export function useApiKey() {
  const { values, set, clear } = useCredential("anthropic");
  return {
    apiKey: values.apiKey,
    setApiKey: (key: string) => set({ apiKey: key }),
    clearApiKey: clear,
  };
}
