import type { PracticeConversation } from "./types";

interface Props {
  conversations: PracticeConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

function PracticeHistoryPanel({
  conversations,
  selectedId,
  onSelect,
  onClear,
}: Props) {
  return (
    <div className="w-52 flex-shrink-0 overflow-y-auto flex flex-col bg-slate-200 h-full">
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
      <ul className="flex flex-col">
        {conversations.map((conv) => (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left py-2 text-sm transition-colors ${
                conv.id === selectedId
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="block truncate px-4">{conv.theme}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PracticeHistoryPanel;
