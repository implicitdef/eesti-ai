import { SidebarToggleButton } from "./SidebarLayout";

interface Props {
  hasHistory: boolean;
  onToggleHistory: () => void;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder: string;
  disabled: boolean;
  error: string | null;
  submitLabel: string;
}

function ModeToolbar({
  hasHistory,
  onToggleHistory,
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  error,
  submitLabel,
}: Props) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 ${!hasHistory ? "flex justify-center" : ""}`}
    >
      <div
        className={`flex items-center gap-3 ${!hasHistory ? "w-full max-w-2xl" : ""}`}
      >
        {hasHistory && <SidebarToggleButton onClick={onToggleHistory} />}
        <form onSubmit={onSubmit} className="flex-1 flex gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={disabled}
            className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModeToolbar;
