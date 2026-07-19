import { ArrowRight } from "lucide-react";
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
  hint?: string;
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
  hint,
}: Props) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 ${!hasHistory ? "flex justify-center" : ""}`}
    >
      <div
        className={`flex gap-3 ${
          !hasHistory
            ? "items-center w-full max-w-2xl"
            : "flex-col md:flex-row md:items-center"
        }`}
      >
        {hasHistory && <SidebarToggleButton onClick={onToggleHistory} />}
        <div className="flex-1 flex flex-col gap-1.5">
          <form onSubmit={onSubmit} className="flex gap-3">
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
              className="bg-blue-700 text-white rounded-lg px-2.5 md:px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
            >
              <ArrowRight size={18} className="md:hidden" />
              <span className="hidden md:inline whitespace-nowrap">
                {submitLabel}
              </span>
            </button>
          </form>
          {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export default ModeToolbar;
