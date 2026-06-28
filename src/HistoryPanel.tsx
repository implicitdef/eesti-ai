import type { AnalysisEntry } from "./types";

interface Props {
  entries: AnalysisEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function HistoryPanel({ entries, selectedId, onSelect }: Props) {
  return (
    <div className="w-52 flex-shrink-0 overflow-y-auto flex flex-col">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 px-4 pt-5 pb-2">
        History
      </p>
      <ul className="flex flex-col pb-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              onClick={() => onSelect(entry.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                entry.id === selectedId
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block truncate">{entry.originalText}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryPanel;
