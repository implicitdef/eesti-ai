import { RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import ApiKeyModal from "./ApiKeyModal";
import { useApiKey } from "./ApiKeyContext";
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

const DEMO_ITEMS: ThemePracticeItem[] = [
  {
    id: "demo-family",
    theme: "family",
    sentence: "Minu perekonnas on neli inimest ja üks koer.",
    englishTranslation: "My family has four people and one dog.",
    attempts: [],
    status: "in_progress",
    revealed: false,
    createdAt: 3,
    isDemo: true,
  },
  {
    id: "demo-hädas-olema",
    theme: "hädas olema",
    sentence: "Ta helistas mulle, kuna oli suures hädas.",
    englishTranslation: "He called me because he was in serious trouble.",
    attempts: [],
    status: "in_progress",
    revealed: false,
    createdAt: 2,
    isDemo: true,
  },
  {
    id: "demo-coffee",
    theme: "coffee",
    sentence: "Ma joon igal hommikul kohvi.",
    englishTranslation: "I drink coffee every morning.",
    attempts: [],
    status: "in_progress",
    revealed: false,
    createdAt: 1,
    isDemo: true,
  },
];

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
  spinning,
  disabled,
}: {
  theme: string;
  errorMessage: string | undefined;
  onRetry: () => void;
  spinning: boolean;
  disabled: boolean;
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
          disabled={disabled}
          className={`self-start flex items-center gap-1.5 bg-blue-700 text-white rounded-md px-4 py-1.5 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:cursor-not-allowed ${spinning ? "btn-shimmer" : ""}`}
        >
          <RefreshCcw size={16} className={spinning ? "animate-spin" : ""} />
          {spinning ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );
}

function FromThemeMode() {
  const { apiKey, setApiKey } = useApiKey();

  const [items, setItems] = useState<ThemePracticeItem[]>(() => {
    const stored = localStorage.getItem(FROM_THEME_HISTORY_KEY);
    if (!stored) return apiKey ? [] : DEMO_ITEMS;
    try {
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
  const [generatingSource, setGeneratingSource] = useState<
    "single" | "batch" | "another" | "retry" | null
  >(null);
  const isGenerating = generatingSource !== null;
  const { isOpen, toggle, close } = useCollapsibleSidebar();
  const [pendingGeneration, setPendingGeneration] = useState<
    ((key: string) => void) | null
  >(null);

  useEffect(() => {
    localStorage.setItem(FROM_THEME_HISTORY_KEY, JSON.stringify(items));
  }, [items]);

  function updateItem(updated: ThemePracticeItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  }

  function withApiKey(action: (key: string) => void) {
    if (apiKey) {
      action(apiKey);
    } else {
      setPendingGeneration(() => action);
    }
  }

  function handleApiKeySubmit(key: string) {
    setApiKey(key);
    const action = pendingGeneration;
    setPendingGeneration(null);
    action?.(key);
  }

  async function generateSentenceForItem(
    item: ThemePracticeItem,
    previousSentences: string[],
    key: string,
  ): Promise<ThemePracticeItem> {
    try {
      const result = await generateThemeSentence(
        item.theme,
        key,
        previousSentences,
      );
      return {
        ...item,
        sentence: result.sentence,
        englishTranslation: result.englishTranslation,
        status: "in_progress",
        errorMessage: undefined,
        isDemo: false,
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

  async function generateBatch(
    theme: string,
    count: number,
    source: "single" | "batch" | "another",
    key: string,
  ) {
    if (!theme || isGenerating) return;
    setGeneratingSource(source);

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
        key,
      );
      updateItem(resolved);
      if (resolved.status === "in_progress") {
        generatedThisBatch.unshift(resolved.sentence);
        playSentenceReadySound();
      }
    }

    setGeneratingSource(null);
  }

  async function retryItem(item: ThemePracticeItem, key: string) {
    if (isGenerating) return;
    setGeneratingSource("retry");
    updateItem({ ...item, status: "generating", errorMessage: undefined });

    const previousSentences = items
      .filter(
        (it) => it.theme === item.theme && it.id !== item.id && it.sentence,
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_PREVIOUS_SENTENCES)
      .map((it) => it.sentence);

    const resolved = await generateSentenceForItem(
      item,
      previousSentences,
      key,
    );
    updateItem(resolved);
    if (resolved.status === "in_progress") playSentenceReadySound();
    setGeneratingSource(null);
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const theme = themeInput.trim();
    if (!theme) return;
    withApiKey((key) => generateBatch(theme, 1, "single", key));
  }

  function handleGenerateBatch() {
    const theme = themeInput.trim();
    if (!theme) return;
    withApiKey((key) => generateBatch(theme, 3, "batch", key));
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
              {!apiKey && (
                <>
                  {" "}
                  Try the pregenerated examples in the history for free — you'll
                  be asked for an API key only when you generate your own.
                </>
              )}
            </TabDescription>
            <GenerateForm
              value={themeInput}
              onChange={setThemeInput}
              onSubmit={handleGenerate}
              onGenerateBatch={handleGenerateBatch}
              placeholder="Type a theme (in English) or some words or idiom (in Estonian)"
              submitLoading={generatingSource === "single"}
              batchLoading={generatingSource === "batch"}
              disabled={isGenerating}
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
              onRetry={() => withApiKey((key) => retryItem(selectedItem, key))}
              spinning={generatingSource === "retry"}
              disabled={isGenerating}
            />
          )}
          {selectedItem &&
            (selectedItem.status === "in_progress" ||
              selectedItem.status === "completed") && (
              <TranslationExerciseView
                header={
                  <div className="flex flex-col gap-3">
                    {selectedItem.isDemo && !apiKey && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 w-fit">
                        This is a pregenerated example. Generating your own
                        sentences needs an Anthropic API key.
                      </p>
                    )}
                    <div className="flex items-end bg-red-10X0  gap-3">
                      <div>
                        <p className="text-xs text-gray-400">Theme: </p>
                        <p className="text-sm font-medium text-gray-600">
                          {selectedItem.theme}
                        </p>
                      </div>
                      <GenerateAnotherButton
                        onClick={() =>
                          withApiKey((key) =>
                            generateBatch(
                              selectedItem.theme,
                              1,
                              "another",
                              key,
                            ),
                          )
                        }
                        spinning={generatingSource === "another"}
                        disabled={isGenerating}
                      />
                    </div>
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

      {pendingGeneration && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onCancel={() => setPendingGeneration(null)}
        />
      )}
    </main>
  );
}

export default FromThemeMode;
