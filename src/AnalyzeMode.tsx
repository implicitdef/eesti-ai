import { useState, useEffect } from "react";
import AnalysisView from "./AnalysisView";
import HistoryPanel from "./HistoryPanel";
import SidebarLayout, {
  useCollapsibleSidebar,
  SidebarToggleButton,
} from "./SidebarLayout";
import { analyzeEstonian } from "./api";
import type { AnalysisEntry } from "./types";

const HISTORY_KEY = "eesti-ai-history";
const API_KEY_STORAGE = "eesti-ai-api-key";

function AnalyzeMode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<AnalysisEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? (JSON.parse(stored) as AnalysisEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => entries[0]?.id ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, toggle, close } = useCollapsibleSidebar();

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  }, [entries]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const entry = await analyzeEstonian(text, apiKey);
      setEntries((prev) => [entry, ...prev]);
      setSelectedId(entry.id);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;
  const hasEntries = entries.length > 0;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div
        className={`px-6 py-4 border-b border-gray-200 ${!hasEntries ? "flex justify-center" : ""}`}
      >
        <div className={`flex items-center gap-3 ${!hasEntries ? "w-full max-w-2xl" : ""}`}>
          {hasEntries && <SidebarToggleButton onClick={toggle} />}
          <form
            onSubmit={handleAnalyze}
            className="flex-1 flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste Estonian text here…"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
            >
              {loading ? "Analyzing…" : "Analyze"}
            </button>
          </form>
        </div>
      </div>

      {hasEntries && (
        <SidebarLayout
          isOpen={isOpen}
          onClose={close}
          sidebar={
            <HistoryPanel
              items={entries.map((e) => ({ id: e.id, label: e.originalText }))}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                close();
              }}
              onClear={() => {
                setEntries([]);
                setSelectedId(null);
                close();
              }}
            />
          }
        >
          {selectedEntry && <AnalysisView entry={selectedEntry} />}
        </SidebarLayout>
      )}
    </main>
  );
}

export default AnalyzeMode;
