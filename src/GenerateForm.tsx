import { RefreshCcw } from "lucide-react";

const fieldClassName =
  "flex-1 border border-black rounded-md px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600 placeholder:italic border-2 bg-slate-100 text-blue-700 placeholder:text-sm";

const submitButtonClassName =
  "flex items-center gap-1.5 bg-blue-700 text-white rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap disabled:bg-black";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  loading: boolean;
  error: string | null;
  multiline?: boolean;
}

function GenerateForm({
  value,
  onChange,
  onSubmit,
  placeholder,
  loading,
  error,
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
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!value.trim() || loading}
        className={
          multiline
            ? `${submitButtonClassName} self-start`
            : submitButtonClassName
        }
      >
        <RefreshCcw size={20} className="shrink-0" />
        {loading ? "Generating…" : "Generate"}
      </button>
    </form>
  );
}

export default GenerateForm;
