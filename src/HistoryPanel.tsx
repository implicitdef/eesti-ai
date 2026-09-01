import {
  Check,
  CircleAlert,
  Dot,
  Eye,
  PencilLine,
  RefreshCcw,
} from "lucide-react";

export type HistoryItemStatus =
  | "not_started"
  | "in_progress"
  | "revealed"
  | "solved"
  | "generating"
  | "error";

interface Props {
  items: { id: string; label: string; status: HistoryItemStatus }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

function StatusIcon({ status }: { status: HistoryItemStatus }) {
  switch (status) {
    case "generating":
      return (
        <RefreshCcw
          size={14}
          className="shrink-0 text-blue-500 animate-spin"
          aria-label="Generating"
        />
      );
    case "error":
      return (
        <CircleAlert
          size={14}
          className="shrink-0 text-red-600"
          aria-label="Generation failed"
        />
      );
    case "solved":
      return (
        <Check
          size={16}
          strokeWidth={4}
          className="shrink-0 text-green-500"
          aria-label="Solved"
        />
      );
    case "revealed":
      return (
        <Eye
          size={14}
          className="shrink-0 text-red-500"
          aria-label="Answer revealed"
        />
      );
    case "in_progress":
      return (
        <PencilLine
          size={16}
          strokeWidth={2}
          className="shrink-0 text-orange-600"
          aria-label="In progress, mistakes made"
        />
      );
    case "not_started":
      return (
        <Dot
          size={14}
          strokeWidth={5}
          className="shrink-0 text-gray-500"
          aria-label="Not started"
        />
      );
  }
}

function HistoryPanel({ items, selectedId, onSelect, onClear }: Props) {
  return (
    <div className="w-52 shrink-0 overflow-y-auto flex flex-col bg-slate-200 h-full">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          History
        </p>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          title="Clear history"
        >
          Clear
        </button>
      </div>
      <ul className="flex flex-col pb-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                item.id === selectedId
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <StatusIcon status={item.status} />
                <span className="block truncate">{item.label}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryPanel;
