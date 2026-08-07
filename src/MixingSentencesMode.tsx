import { useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import { isExactMatch } from "./estonianDiff";
import GenerateAnotherButton from "./GenerateAnotherButton";
import GenerateForm from "./GenerateForm";
import HistoryPanel from "./HistoryPanel";
import { generateMixedSentence } from "./mixed-sentence-practice-api";
import SidebarLayout, {
  SidebarToggleButton,
  useCollapsibleSidebar,
} from "./SidebarLayout";
import TabDescription from "./TabDescription";
import TranslationExerciseView from "./TranslationExerciseView";
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

  function handleHideAnswer() {
    const item = items.find((it) => it.id === selectedId);
    if (!item) return;
    updateItem({ ...item, revealed: false, status: "in_progress" });
  }

  const selectedItem = items.find((it) => it.id === selectedId) ?? null;
  const hasItems = items.length > 0;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-center">
        <div className="flex flex-col md:flex-row md:items-start gap-3 w-full max-w-2xl">
          {hasItems && <SidebarToggleButton onClick={toggle} />}
          <div className="flex-1 flex flex-col gap-2">
            <TabDescription>
              Translation exercise, English to Estonian.
              <br />
              Paste several Estonian sentences (typically from a movie) in the
              first input, this will generate a sentence which is kinda of a mix
              of the vocabulary and structures of the ones you gave.
            </TabDescription>
            <GenerateForm
              value={sentencesInput}
              onChange={setSentencesInput}
              onSubmit={handleGenerate}
              placeholder="Paste several Estonian sentences…"
              loading={loadingGenerate}
              error={error}
              multiline
            />
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
                  <GenerateAnotherButton
                    onClick={() => generateFrom(selectedItem.inputSentences)}
                    loading={loadingGenerate}
                  />
                </div>
              }
              targetEstonian={selectedItem.sentence}
              englishToTranslate={selectedItem.englishTranslation}
              attempts={selectedItem.attempts}
              status={selectedItem.status}
              revealed={selectedItem.revealed}
              onSubmitAttempt={handleSubmitAttempt}
              onShowAnswer={handleShowAnswer}
              onHideAnswer={handleHideAnswer}
            />
          )}
        </SidebarLayout>
      )}
    </main>
  );
}

export default MixingSentencesMode;
