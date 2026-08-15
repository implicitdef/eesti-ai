import { useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import { isExactMatch } from "./estonianDiff";
import { generateThemeSentence } from "./from-theme-api";
import GenerateAnotherButton from "./GenerateAnotherButton";
import GenerateForm from "./GenerateForm";
import HistoryPanel from "./HistoryPanel";
import SidebarLayout, {
  SidebarToggleButton,
  useCollapsibleSidebar,
} from "./SidebarLayout";
import {
  playCorrectSound,
  playIncorrectSound,
  playSentenceReadySound,
} from "./sound";
import TabDescription from "./TabDescription";
import TranslationExerciseView from "./TranslationExerciseView";
import type { ThemePracticeItem } from "./types";

const FROM_THEME_HISTORY_KEY = "eesti-ai-from-theme-v2-history";
const API_KEY_STORAGE = "eesti-ai-api-key";

function FromThemeMode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [items, setItems] = useState<ThemePracticeItem[]>(() => {
    try {
      const stored = localStorage.getItem(FROM_THEME_HISTORY_KEY);
      return stored ? (JSON.parse(stored) as ThemePracticeItem[]) : [];
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
    localStorage.setItem(FROM_THEME_HISTORY_KEY, JSON.stringify(items));
  }, [items]);

  function updateItem(updated: ThemePracticeItem) {
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
      const result = await generateThemeSentence(
        theme,
        apiKey,
        previousSentences,
      );
      const newItem: ThemePracticeItem = {
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
      playSentenceReadySound();
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

  function handleSubmitAttempt(userAnswer: string, wordValues: string[]) {
    const item = items.find((it) => it.id === selectedId);
    if (!item) return;
    const isCorrect = isExactMatch(item.sentence, userAnswer);
    updateItem({
      ...item,
      attempts: [...item.attempts, { userAnswer, isCorrect, wordValues }],
      status: isCorrect ? "completed" : item.status,
    });
    if (isCorrect) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
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
              The sentence to guess will be based on the little input you give.
              <br />- For example, if you type "family", you might have to find
              the sentence "Minu perekonnas on neli inimest ja üks koer".
              <br />- Or if you type "hädas olema", you might get "Ta helistas
              mulle, kuna oli suures hädas". <br />
              Generating a sentence will make some requests to Anthropic API.
            </TabDescription>
            <GenerateForm
              value={themeInput}
              onChange={setThemeInput}
              onSubmit={handleGenerate}
              placeholder="Type a theme (in English) or some words or idiom (in Estonian)"
              loading={loadingGenerate}
              error={error}
            />
            <p className="text-xs text-gray-400">
              e.g. "beach", "forest", "job interview", "at the gym", ... OR
              "tööle võtma", "rääkimata", "X-ks valmis", "ostma VS otsima", ...
            </p>
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
                <div className="flex items-end bg-red-10X0  gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Theme: </p>
                    <p className="text-sm font-medium text-gray-600">
                      {selectedItem.theme}
                    </p>
                  </div>
                  <GenerateAnotherButton
                    onClick={() => generateFrom(selectedItem.theme)}
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

export default FromThemeMode;
