import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ApiKeyScreen from "./ApiKeyScreen";
import AnalysisView from "./AnalysisView";
import HistoryPanel from "./HistoryPanel";
import { analyzeEstonian } from "./api";
import type { AnalysisEntry } from "./types";

const STORAGE_KEY = "eesti-ai-api-key";
const HISTORY_KEY = "eesti-ai-history";

function App() {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? "",
  );
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

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  }, [entries]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSetApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
  }

  function handleClearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey("");
  }

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

  if (!apiKey) {
    return <ApiKeyScreen onSubmit={handleSetApiKey} />;
  }

  const maskedKey =
    apiKey.slice(0, 6) +
    "*".repeat(Math.max(0, apiKey.length - 10)) +
    apiKey.slice(-4);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;
  const hasEntries = entries.length > 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-blue-700 text-white p-4 shadow">
        <h1 className="text-2xl font-bold">Eesti AI</h1>
        <p className="text-sm text-blue-200">Learn Estonian with AI</p>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-200 ${!hasEntries ? "flex justify-center" : ""}`}>
          <form
            onSubmit={handleAnalyze}
            className={`flex gap-3 ${!hasEntries ? "w-full max-w-2xl" : ""}`}
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

        {hasEntries && (
          <div className="flex-1 flex overflow-hidden">
            <div>
              <HistoryPanel
                entries={entries}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onClear={() => { setEntries([]); setSelectedId(null); }}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {selectedEntry && <AnalysisView entry={selectedEntry} />}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-400">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-700 tracking-tight">
              Eesti AI
            </span>
            <span className="text-gray-400 select-none">|</span>
            <span className="text-xs text-gray-500">Learn Estonian with AI</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-3 py-1">
              <span className="text-xs text-gray-400">API key</span>
              <code className="font-mono text-xs text-gray-600">{maskedKey}</code>
            </div>
            <button
              onClick={handleClearApiKey}
              title="Clear API key"
              className="flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-xs text-gray-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
