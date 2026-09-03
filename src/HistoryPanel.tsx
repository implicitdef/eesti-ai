import {
  Check,
  ChevronDown,
  CircleAlert,
  Dot,
  Eye,
  PencilLine,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type HistoryItemStatus =
  | "not_started"
  | "in_progress"
  | "revealed"
  | "solved"
  | "generating"
  | "error";

export type HistoryView = "demo" | "mine";

const VIEW_LABELS: Record<HistoryView, string> = {
  demo: "Demo sentences",
  mine: "Your sentences",
};

interface Props {
  items: { id: string; label: string; status: HistoryItemStatus }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  view: HistoryView;
  onSwitchView: (view: HistoryView) => void;
  hasMineItems: boolean;
  onClearMine: () => void;
  onResetDemo: () => void;
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

function ViewSwitcher({
  view,
  onSwitchView,
  hasMineItems,
}: {
  view: HistoryView;
  onSwitchView: (view: HistoryView) => void;
  hasMineItems: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handlePick(next: HistoryView) {
    if (next === "mine" && !hasMineItems) return;
    setOpen(false);
    onSwitchView(next);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-blue-700 transition-colors"
      >
        {VIEW_LABELS[view]}
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {(["demo", "mine"] as const).map((v) => {
            const disabled = v === "mine" && !hasMineItems;
            return (
              <button
                key={v}
                onClick={() => handlePick(v)}
                disabled={disabled}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                  disabled
                    ? "cursor-not-allowed text-gray-300"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Check
                  size={14}
                  className={view === v ? "text-blue-600" : "text-transparent"}
                />
                {VIEW_LABELS[v]}
                {disabled && (
                  <span className="ml-auto text-xs text-gray-300">empty</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({
  items,
  selectedId,
  onSelect,
  view,
  onSwitchView,
  hasMineItems,
  onClearMine,
  onResetDemo,
}: Props) {
  return (
    <div className="w-52 shrink-0 overflow-y-auto flex flex-col bg-slate-200 h-full">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-2">
        <ViewSwitcher
          view={view}
          onSwitchView={onSwitchView}
          hasMineItems={hasMineItems}
        />
        {view === "demo" ? (
          <button
            onClick={onResetDemo}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
            title="Reset demo sentences to their original unsolved state"
          >
            Reset
          </button>
        ) : (
          <button
            onClick={onClearMine}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="Clear your sentences"
          >
            Clear
          </button>
        )}
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
