import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import { isExactMatch } from "./estonianDiff";
import { generateThemeSentence } from "./from-theme-api";
import GenerateAnotherButton from "./GenerateAnotherButton";
import GenerateForm from "./GenerateForm";
import HistoryPanel, { type HistoryItemStatus } from "./HistoryPanel";
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

function historyItemStatus(item: ThemePracticeItem): HistoryItemStatus {
  if (item.status === "generating") return "generating";
  if (item.status === "error") return "error";
  if (item.revealed) return "revealed";
  if (item.status === "completed") return "solved";
  if (item.attempts.length > 0) return "in_progress";
  return "not_started";
}

function GeneratingDetailView({ theme }: { theme: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-gray-400">Theme: </p>
        <p className="text-sm font-medium text-gray-600">{theme}</p>
      </div>
      <div className="flex items-center gap-2 text-gray-500">
        <RefreshCcw size={18} className="animate-spin" />
        <p className="text-sm">Generating sentence…</p>
      </div>
    </div>
  );
}

function GenerationErrorDetailView({
  theme,
  errorMessage,
  onRetry,
  loading,
}: {
  theme: string;
  errorMessage: string | undefined;
  onRetry: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-gray-400">Theme: </p>
        <p className="text-sm font-medium text-gray-600">{theme}</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex flex-col gap-2">
        <p className="text-red-700 font-semibold text-sm">
          Couldn't generate a sentence for this theme.
        </p>
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
        <button
          onClick={onRetry}
          disabled={loading}
          className="self-start flex items-center gap-1.5 bg-blue-700 text-white rounded-md px-4 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition-colors"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );
}

function FromThemeMode() {
  const apiKey = localStorage.getItem(API_KEY_STORAGE)!;

  const [items, setItems] = useState<ThemePracticeItem[]>(() => {
    try {
      const stored = localStorage.getItem(FROM_THEME_HISTORY_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as ThemePracticeItem[];
      return parsed.map((it) =>
        it.status === "generating"
          ? {
              ...it,
              status: "error" as const,
              errorMessage: "Generation was interrupted (page reload).",
            }
          : it,
      );
    } catch {
      return [];
    }
  });
  const [selectedId, setSelectedId] = useState<string | null>(
    () => items[0]?.id ?? null,
  );
  const [themeInput, setThemeInput] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const { isOpen, toggle, close } = useCollapsibleSidebar();

  useEffect(() => {
    localStorage.setItem(FROM_THEME_HISTORY_KEY, JSON.stringify(items));
  }, [items]);

  function updateItem(updated: ThemePracticeItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  async function generateSentenceForItem(
    item: ThemePracticeItem,
    previousSentences: string[],
  ): Promise<ThemePracticeItem> {
    try {
      const result = await generateThemeSentence(
        item.theme,
        apiKey,
        previousSentences,
      );
      return {
        ...item,
        sentence: result.sentence,
        englishTranslation: result.englishTranslation,
        status: "in_progress",
        errorMessage: undefined,
      };
    } catch (err) {
      return {
        ...item,
        status: "error",
        errorMessage:
          err instanceof Error ? err.message : "Something went wrong",
      };
    }
  }

  async function generateBatch(theme: string, count: number) {
    if (!theme || loadingGenerate) return;
    setLoadingGenerate(true);

    const existingForTheme = items
      .filter((it) => it.theme === theme && it.sentence)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((it) => it.sentence);

    const now = Date.now();
    const placeholders: ThemePracticeItem[] = Array.from(
      { length: count },
      (_, i) => ({
        id: crypto.randomUUID(),
        theme,
        sentence: "",
        englishTranslation: "",
        attempts: [],
        status: "generating",
        revealed: false,
        createdAt: now + i,
      }),
    );

    setItems((prev) => [...[...placeholders].reverse(), ...prev]);
    setThemeInput("");
    setSelectedId(placeholders[0].id);

    const generatedThisBatch: string[] = [];

    for (let i = 0; i < placeholders.length; i++) {
      const previousSentences = [
        ...generatedThisBatch,
        ...existingForTheme,
      ].slice(0, MAX_PREVIOUS_SENTENCES);
      const resolved = await generateSentenceForItem(
        placeholders[i],
        previousSentences,
      );
      updateItem(resolved);
      if (resolved.status === "in_progress") {
        generatedThisBatch.unshift(resolved.sentence);
        playSentenceReadySound();
      }
    }

    setLoadingGenerate(false);
  }

  async function retryItem(item: ThemePracticeItem) {
    if (loadingGenerate) return;
    setLoadingGenerate(true);
    updateItem({ ...item, status: "generating", errorMessage: undefined });

    const previousSentences = items
      .filter(
        (it) => it.theme === item.theme && it.id !== item.id && it.sentence,
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_PREVIOUS_SENTENCES)
      .map((it) => it.sentence);

    const resolved = await generateSentenceForItem(item, previousSentences);
    updateItem(resolved);
    if (resolved.status === "in_progress") playSentenceReadySound();
    setLoadingGenerate(false);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generateBatch(themeInput.trim(), 1);
  }

  async function handleGenerateBatch() {
    await generateBatch(themeInput.trim(), 3);
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
              onGenerateBatch={handleGenerateBatch}
              placeholder="Type a theme (in English) or some words or idiom (in Estonian)"
              loading={loadingGenerate}
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
                status: historyItemStatus(it),
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
          {selectedItem?.status === "generating" && (
            <GeneratingDetailView theme={selectedItem.theme} />
          )}
          {selectedItem?.status === "error" && (
            <GenerationErrorDetailView
              theme={selectedItem.theme}
              errorMessage={selectedItem.errorMessage}
              onRetry={() => retryItem(selectedItem)}
              loading={loadingGenerate}
            />
          )}
          {selectedItem &&
            (selectedItem.status === "in_progress" ||
              selectedItem.status === "completed") && (
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
                      onClick={() => generateBatch(selectedItem.theme, 1)}
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
