const fieldClassName =
  "flex-1 border border-black rounded-lg px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600 placeholder:italic border-2 bg-slate-100 text-blue-700 placeholder:text-sm";

const submitButtonClassName =
  "bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  submitLabel: string;
  loading: boolean;
  error: string | null;
  multiline?: boolean;
}

function GenerateForm({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  loading,
  error,
  multiline = false,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex gap-3 max-w-4xl">
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
        {loading ? "Generating…" : submitLabel}
      </button>
    </form>
  );
}

export default GenerateForm;
