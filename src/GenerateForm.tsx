import { RefreshCcw } from "lucide-react";

const fieldClassName =
  "flex-1 border border-black rounded-md px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600 placeholder:italic border-2 bg-slate-100 text-blue-700 placeholder:text-sm";

const submitButtonClassName =
  "flex items-center gap-1.5 bg-blue-700 text-white rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap disabled:bg-black";

const batchButtonClassName =
  "flex items-center gap-1.5 border-2 border-blue-700 text-blue-700 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-50 transition-colors whitespace-nowrap";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateBatch: () => void;
  placeholder: string;
  loading: boolean;
  multiline?: boolean;
}

function GenerateForm({
  value,
  onChange,
  onSubmit,
  onGenerateBatch,
  placeholder,
  loading,
  multiline = false,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${fieldClassName} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className={`${submitButtonClassName} ${multiline ? "self-start" : ""} ${loading ? "btn-shimmer" : ""}`}
      >
        <RefreshCcw
          size={20}
          className={`shrink-0 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Generating…" : "Generate"}
      </button>
      <button
        type="button"
        onClick={onGenerateBatch}
        disabled={!value.trim() || loading}
        title="Generate 3 sentences for this theme"
        className={`${batchButtonClassName} ${multiline ? "self-start" : ""}`}
      >
        <RefreshCcw
          size={18}
          className={`shrink-0 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Generating…" : "Generate 3x"}
      </button>
    </form>
  );
}

export default GenerateForm;
