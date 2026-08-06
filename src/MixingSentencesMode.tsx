import { useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import { isExactMatch } from "./estonianDiff";
import HistoryPanel from "./HistoryPanel";
import { generateMixedSentence } from "./mixed-sentence-practice-api";
import TranslationExerciseView from "./TranslationExerciseView";
import SidebarLayout, {
  SidebarToggleButton,
  useCollapsibleSidebar,
} from "./SidebarLayout";
import type { MixedSentencePracticeItem } from "./types";

const MIXING_SENTENCES_HISTORY_KEY = "eesti-ai-mixing-sentences-history";
const API_KEY_STORAGE = "eesti-ai-api-key";

function MixingSentencesMode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [items, setItems] = useState<MixedSentencePracticeItem[]>(() => {
    try {
      const stored = localStorage.getItem(MIXING_SENTENCES_HISTORY_KEY);
      return stored ? (JSON.parse(stored) as MixedSentencePracticeItem[]) : [];
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => items[0]?.id ?? null,
  );
  const [sentencesInput, setSentencesInput] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, toggle, close } = useCollapsibleSidebar();

  useEffect(() => {
    localStorage.setItem(MIXING_SENTENCES_HISTORY_KEY, JSON.stringify(items));
  }, [items]);

  function updateItem(updated: MixedSentencePracticeItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  async function generateFrom(inputSentences: string) {
    if (!inputSentences || loadingGenerate) return;
    setLoadingGenerate(true);
    setError(null);
    try {
      const previousSentences = items
        .filter((it) => it.inputSentences === inputSentences)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_PREVIOUS_SENTENCES)
        .map((it) => it.sentence);
      const result = await generateMixedSentence(
        inputSentences,
        apiKey,
        previousSentences,
      );
      const newItem: MixedSentencePracticeItem = {
        id: crypto.randomUUID(),
        inputSentences,
        sentence: result.sentence,
        englishTranslation: result.englishTranslation,
        attempts: [],
        status: "in_progress",
        revealed: false,
        createdAt: Date.now(),
      };
      setItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      setSentencesInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateFrom(sentencesInput.trim());
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
              <textarea
                value={sentencesInput}
                onChange={(e) => setSentencesInput(e.target.value)}
                placeholder="Paste several Estonian sentences…"
                rows={3}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!sentencesInput.trim() || loadingGenerate}
                className="bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors whitespace-nowrap self-start"
              >
                {loadingGenerate ? "Generating…" : "Mix"}
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
                label: it.inputSentences,
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
                    <p className="text-xs text-gray-400">Input sentences: </p>
                    <p className="text-sm font-medium text-gray-600 whitespace-pre-wrap">
                      {selectedItem.inputSentences}
                    </p>
                  </div>
                  <button
                    onClick={() => generateFrom(selectedItem.inputSentences)}
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

export default MixingSentencesMode;
