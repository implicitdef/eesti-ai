import { useState } from "react";
import { CREDENTIALS } from "./CredentialsContext";
import type { CredentialKind } from "./CredentialsContext";

interface Props {
  kind: CredentialKind;
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => void;
}

/** One input per field of the credential; submits trimmed values once all are filled. */
function CredentialForm({ kind, submitLabel, onSubmit }: Props) {
  const { fields } = CREDENTIALS[kind];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  const isComplete = fields.every((field) => values[field.name].trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;
    onSubmit(
      Object.fromEntries(
        fields.map((field) => [field.name, values[field.name].trim()]),
      ),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {fields.map((field, i) => (
        <input
          key={field.name}
          autoFocus={i === 0}
          type={field.secret ? "password" : "text"}
          aria-label={field.label}
          placeholder={field.placeholder}
          value={values[field.name]}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
          }
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ))}
      <button
        type="submit"
        disabled={!isComplete}
        className="bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default CredentialForm;
