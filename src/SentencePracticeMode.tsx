import { useEffect, useState } from "react";
import { isExactMatch } from "./estonianDiff";
import HistoryPanel from "./HistoryPanel";
import { generateVariant } from "./sentence-practice-api";
import SentencePracticeItemView from "./SentencePracticeItemView";
import SidebarLayout, {
  SidebarToggleButton,
  useCollapsibleSidebar,
} from "./SidebarLayout";
import type { SentencePracticeItem } from "./types";

const SENTENCE_PRACTICE_HISTORY_KEY = "eesti-ai-sentence-practice-history";
const API_KEY_STORAGE = "eesti-ai-api-key";

function SentencePracticeMode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [items, setItems] = useState<SentencePracticeItem[]>(() => {
    try {
      const stored = localStorage.getItem(SENTENCE_PRACTICE_HISTORY_KEY);
      return stored ? (JSON.parse(stored) as SentencePracticeItem[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => items[0]?.id ?? null,
  );
  const [sentence, setSentence] = useState("");
  const [guidance, setGuidance] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, toggle, close } = useCollapsibleSidebar();

  useEffect(() => {
    localStorage.setItem(SENTENCE_PRACTICE_HISTORY_KEY, JSON.stringify(items));
  }, [items]);

  function updateItem(updated: SentencePracticeItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  async function generateFrom(originalEstonian: string, guidanceText: string) {
    if (!originalEstonian || loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);
    try {
      const result = await generateVariant(
        originalEstonian,
        guidanceText,
        apiKey,
      );
      const newItem: SentencePracticeItem = {
        id: crypto.randomUUID(),
        originalEstonian,
        guidance: guidanceText || null,
        englishTranslation: result.englishTranslation,
        englishVariant: result.englishVariant,
        expectedEstonian: result.expectedEstonian,
        attempts: [],
        status: "in_progress",
        revealed: false,
        createdAt: Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      setSentence("");
      setGuidance("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateFrom(sentence.trim(), guidance.trim());
  }

  function handleSubmitAttempt(userAnswer: string) {
    const item = items.find((it) => it.id === selectedId);
    if (!item) return;
    const isCorrect = isExactMatch(item.expectedEstonian, userAnswer);
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
            <form onSubmit={handleGenerate} className="flex flex-col gap-2">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  placeholder="Paste an Estonian sentence…"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={!sentence.trim() || loadingGenerate}
                  className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap"
                >
                  {loadingGenerate ? "Generating…" : "Practice"}
                </button>
              </div>
              <input
                type="text"
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="Optional: guide the variant, e.g. 'make it negative and past tense'"
                className="border border-gray-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                label: it.originalEstonian,
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
            <SentencePracticeItemView
              item={selectedItem}
              onSubmitAttempt={handleSubmitAttempt}
              onShowAnswer={handleShowAnswer}
              onGenerateNewVariant={() =>
                generateFrom(
                  selectedItem.originalEstonian,
                  selectedItem.guidance ?? "",
                )
              }
              generatingNewVariant={loadingGenerate}
            />
          )}
        </SidebarLayout>
      )}
    </main>
  );
}

export default SentencePracticeMode;
