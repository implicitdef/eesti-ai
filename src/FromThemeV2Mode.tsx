import { useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import { isExactMatch } from "./estonianDiff";
import HistoryPanel from "./HistoryPanel";
import { generateThemeV2Sentence } from "./from-theme-v2-api";
import TranslationExerciseView from "./TranslationExerciseView";
import SidebarLayout, {
  SidebarToggleButton,
  useCollapsibleSidebar,
} from "./SidebarLayout";
import type { ThemeV2PracticeItem } from "./types";

const FROM_THEME_V2_HISTORY_KEY = "eesti-ai-from-theme-v2-history";
const API_KEY_STORAGE = "eesti-ai-api-key";

function FromThemeV2Mode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [items, setItems] = useState<ThemeV2PracticeItem[]>(() => {
    try {
      const stored = localStorage.getItem(FROM_THEME_V2_HISTORY_KEY);
      return stored ? (JSON.parse(stored) as ThemeV2PracticeItem[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => items[0]?.id ?? null,
  );
  const [themeInput, setThemeInput] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, toggle, close } = useCollapsibleSidebar();

  useEffect(() => {
    localStorage.setItem(FROM_THEME_V2_HISTORY_KEY, JSON.stringify(items));
  }, [items]);

  function updateItem(updated: ThemeV2PracticeItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  async function generateFrom(theme: string) {
    if (!theme || loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);
    try {
      const previousSentences = items
        .filter((it) => it.theme === theme)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_PREVIOUS_SENTENCES)
        .map((it) => it.sentence);
      const result = await generateThemeV2Sentence(
        theme,
        apiKey,
        previousSentences,
      );
      const newItem: ThemeV2PracticeItem = {
        id: crypto.randomUUID(),
        theme,
        sentence: result.sentence,
        englishTranslation: result.englishTranslation,
        attempts: [],
        status: "in_progress",
        revealed: false,
        createdAt: Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      setThemeInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateFrom(themeInput.trim());
  }

  function handleSubmitAttempt(userAnswer: string) {
    const item = items.find((it) => it.id === selectedId);
    if (!item) return;
    const isCorrect = isExactMatch(item.sentence, userAnswer);
    updateItem({
      ...item,
      attempts: [...item.attempts, { userAnswer, isCorrect }],
      status: isCorrect ? "completed" : item.status,
    });
  }

  function handleShowAnswer() {
    const item = items.find((it) => it.id === selectedId);
    if (!item) return;
    updateItem({ ...item, revealed: true, status: "completed" });
  }

  const selectedItem = items.find((it) => it.id === selectedId) ?? null;
  const hasItems = items.length > 0;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div
        className={`px-6 py-4 border-b border-gray-200 ${!hasItems ? "flex justify-center" : ""}`}
      >
        <div
          className={`flex gap-3 ${
            !hasItems
              ? "items-start w-full max-w-2xl"
              : "flex-col md:flex-row md:items-start"
          }`}
        >
          {hasItems && <SidebarToggleButton onClick={toggle} />}
          <div className="flex-1 flex flex-col gap-1.5">
            <form onSubmit={handleGenerate} className="flex gap-3">
              <input
                type="text"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="A theme in English, or an Estonian idiom…"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!themeInput.trim() || loadingGenerate}
                className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap"
              >
                {loadingGenerate ? "Generating…" : "Generate"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {hasItems && (
        <SidebarLayout
          isOpen={isOpen}
          onClose={close}
          sidebar={
            <HistoryPanel
              items={items.map((it) => ({
                id: it.id,
                label: it.theme,
              }))}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                close();
              }}
              onClear={() => {
                setItems([]);
                setSelectedId(null);
                close();
              }}
            />
          }
        >
          {selectedItem && (
            <TranslationExerciseView
              header={
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Theme: </p>
                    <p className="text-sm font-medium text-gray-600">
                      {selectedItem.theme}
                    </p>
                  </div>
                  <button
                    onClick={() => generateFrom(selectedItem.theme)}
                    disabled={loadingGenerate}
                    className="text-xs text-gray-400 hover:text-blue-600 underline transition-colors disabled:opacity-40 shrink-0"
                  >
                    {loadingGenerate ? "Generating…" : "New sentence →"}
                  </button>
                </div>
              }
              targetEstonian={selectedItem.sentence}
              englishToTranslate={selectedItem.englishTranslation}
              attempts={selectedItem.attempts}
              status={selectedItem.status}
              revealed={selectedItem.revealed}
              onSubmitAttempt={handleSubmitAttempt}
              onShowAnswer={handleShowAnswer}
            />
          )}
        </SidebarLayout>
      )}
    </main>
  );
}

export default FromThemeV2Mode;
