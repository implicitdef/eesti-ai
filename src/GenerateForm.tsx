import { RefreshCcw } from "lucide-react";
import type { SentenceLevel } from "./types";

const selectClassName =
  "border border-black rounded-md px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-2 bg-slate-100 text-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed";

const fieldClassName =
  "flex-1 border border-black rounded-md px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600 placeholder:italic border-2 bg-slate-100 text-blue-700 placeholder:text-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-300 disabled:placeholder:text-gray-400 disabled:cursor-not-allowed disabled:shadow-inner";

const actionButtonClassName =
  "flex items-center gap-1.5 border-blue-200 border bg-blue-200 text-gray-700 rounded-md py-2 text-sm font-semibold hover:bg-blue-300 transition-colors whitespace-nowrap disabled:bg-blue-100 disabled:text-gray-400 disabled:border-gray-300 disabled:border disabled:cursor-not-allowed ";

const submitButtonClassName = `${actionButtonClassName} px-5`;

const batchButtonClassName = `${actionButtonClassName} px-3`;

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateBatch: () => void;
  placeholder: string;
  submitLoading: boolean;
  batchLoading: boolean;
  disabled: boolean;
  multiline?: boolean;
  level: SentenceLevel;
  onLevelChange: (level: SentenceLevel) => void;
}

function GenerateForm({
  value,
  onChange,
  onSubmit,
  onGenerateBatch,
  placeholder,
  submitLoading,
  batchLoading,
  disabled,
  multiline = false,
  level,
  onLevelChange,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className={`${fieldClassName} resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={fieldClassName}
        />
      )}
      <select
        value={level}
        onChange={(e) => onLevelChange(e.target.value as SentenceLevel)}
        disabled={disabled}
        title="Sentence difficulty level"
        className={selectClassName}
      >
        <option value="A1">Easy</option>
        <option value="B1">Difficult</option>
      </select>
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className={`${submitButtonClassName} ${multiline ? "self-start" : ""} ${submitLoading ? "btn-shimmer" : ""}`}
      >
        <RefreshCcw
          size={20}
          className={`shrink-0 ${submitLoading ? "animate-spin" : ""}`}
        />
        {submitLoading ? "Generating…" : "Generate"}
      </button>
      <button
        type="button"
        onClick={onGenerateBatch}
        disabled={!value.trim() || disabled}
        title="Generate 3 sentences for this theme"
        className={`${batchButtonClassName} ${multiline ? "self-start" : ""} ${batchLoading ? "btn-shimmer" : ""}`}
      >
        <RefreshCcw
          size={18}
          className={`shrink-0 ${batchLoading ? "animate-spin" : ""}`}
        />
        3x
      </button>
    </form>
  );
}

export default GenerateForm;
