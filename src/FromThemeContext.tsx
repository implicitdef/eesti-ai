import { Outlet, useNavigate } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState } from "react";
import { MAX_PREVIOUS_SENTENCES } from "./anthropic-response";
import ApiKeyModal from "./ApiKeyModal";
import { useApiKey } from "./CredentialsContext";
import { DEMO_SENTENCES } from "./demoSentences";
import { generateThemeSentence } from "./from-theme-api";
import { assertSentenceCountsMatch } from "./sentenceSplit";
import { shuffle } from "./shuffle";
import { translateToEnglish } from "./translation-api";
import type { SentenceLevel, ThemePracticeItem } from "./types";

const USER_HISTORY_KEY = "opimasin-from-theme-v2-history";
const DEMO_STATE_KEY = "opimasin-from-theme-demo-state";
const LEVEL_KEY = "opimasin-from-theme-level";

const DEMO_ITEMS: ThemePracticeItem[] = DEMO_SENTENCES.map((demo, i) => ({
  id: `demo-${i}`,
  theme: demo.theme,
  sentence: demo.sentence,
  englishTranslation: demo.englishTranslation,
  level: demo.level,
  attempts: [],
  status: "in_progress",
  createdAt: DEMO_SENTENCES.length - i,
}));

type GeneratingSource = "single" | "batch" | "another" | "retry" | null;

interface FromThemeContextValue {
  userItems: ThemePracticeItem[];
  demoItems: ThemePracticeItem[];
  level: SentenceLevel;
  setLevel: (level: SentenceLevel) => void;
  generatingSource: GeneratingSource;
  isGenerating: boolean;
  findItem: (id: string) => ThemePracticeItem | undefined;
  siblingsFor: (id: string) => ThemePracticeItem[];
  generateNew: (theme: string, count: 1 | 3, itemLevel: SentenceLevel) => void;
  generateFromList: (
    themes: string[],
    count: 1 | 3,
    itemLevel: SentenceLevel,
  ) => void;
  generateAnother: (item: ThemePracticeItem) => void;
  insertManual: (text: string) => void;
  retry: (item: ThemePracticeItem) => void;
  updateItem: (updated: ThemePracticeItem) => void;
  clearUserItems: () => void;
  resetDemoItems: () => void;
}

const FromThemeContext = createContext<FromThemeContextValue | null>(null);

function FromThemeProvider() {
  const { apiKey, setApiKey } = useApiKey();
  const navigate = useNavigate();

  const [userItems, setUserItems] = useState<ThemePracticeItem[]>(() => {
    const stored = localStorage.getItem(USER_HISTORY_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as ThemePracticeItem[];
      return parsed
        .filter((it) => !it.id.startsWith("demo-"))
        .map((it) => ({
          ...it,
          ...(it.status === "generating"
            ? {
                status: "error" as const,
                errorMessage: "Generation was interrupted (page reload).",
              }
            : {}),
        }));
    } catch {
      return [];
    }
  });
  const [demoItems, setDemoItems] = useState<ThemePracticeItem[]>(() => {
    const stored = localStorage.getItem(DEMO_STATE_KEY);
    if (!stored) return DEMO_ITEMS;
    try {
      const parsed = JSON.parse(stored) as ThemePracticeItem[];
      if (parsed.length !== DEMO_ITEMS.length) return DEMO_ITEMS;
      return parsed;
    } catch {
      return DEMO_ITEMS;
    }
  });
  const [level, setLevel] = useState<SentenceLevel>(() => {
    const stored = localStorage.getItem(LEVEL_KEY);
    return stored === "A1" || stored === "B1" ? stored : "B1";
  });
  const [generatingSource, setGeneratingSource] =
    useState<GeneratingSource>(null);
  const isGenerating = generatingSource !== null;
  const [pendingGeneration, setPendingGeneration] = useState<
    ((key: string) => void) | null
  >(null);

  useEffect(() => {
    localStorage.setItem(USER_HISTORY_KEY, JSON.stringify(userItems));
  }, [userItems]);

  useEffect(() => {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(demoItems));
  }, [demoItems]);

  useEffect(() => {
    localStorage.setItem(LEVEL_KEY, level);
  }, [level]);

  function findItem(id: string) {
    return (
      userItems.find((it) => it.id === id) ??
      demoItems.find((it) => it.id === id)
    );
  }

  function siblingsFor(id: string) {
    return id.startsWith("demo-") ? demoItems : userItems;
  }

  function updateItem(updated: ThemePracticeItem) {
    if (updated.id.startsWith("demo-")) {
      setDemoItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );
    } else {
      setUserItems((prev) =>
        prev.map((it) => (it.id === updated.id ? updated : it)),
      );
    }
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
      if (item.manual) {
        const englishTranslation = await translateToEnglish(item.sentence, key);
        assertSentenceCountsMatch(item.sentence, englishTranslation);
        return {
          ...item,
          englishTranslation,
          status: "in_progress",
          errorMessage: undefined,
        };
      }
      const result = await generateThemeSentence(
        item.theme,
        key,
        previousSentences,
        item.level,
      );
      assertSentenceCountsMatch(result.sentence, result.englishTranslation);
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

  async function runGenerate(
    theme: string,
    count: number,
    source: "single" | "batch" | "another",
    key: string,
    itemLevel: SentenceLevel,
  ) {
    setGeneratingSource(source);

    const existingForTheme = userItems
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
        createdAt: now + i,
        level: itemLevel,
      }),
    );

    setUserItems((prev) => [...[...placeholders].reverse(), ...prev]);
    navigate({ to: "/sentence/$id", params: { id: placeholders[0].id } });

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
      }
    }

    setGeneratingSource(null);
  }

  function generateNew(theme: string, count: 1 | 3, itemLevel: SentenceLevel) {
    if (!theme || isGenerating) return;
    withApiKey((key) =>
      runGenerate(
        theme,
        count,
        count === 1 ? "single" : "batch",
        key,
        itemLevel,
      ),
    );
  }

  async function runGenerateList(
    themes: string[],
    count: number,
    source: "single" | "batch",
    key: string,
    itemLevel: SentenceLevel,
  ) {
    setGeneratingSource(source);

    const existingByTheme = new Map<string, string[]>();
    for (const theme of themes) {
      if (existingByTheme.has(theme)) continue;
      existingByTheme.set(
        theme,
        userItems
          .filter((it) => it.theme === theme && it.sentence)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((it) => it.sentence),
      );
    }

    const now = Date.now();
    const placeholders: ThemePracticeItem[] = [];
    themes.forEach((theme) => {
      for (let i = 0; i < count; i++) {
        placeholders.push({
          id: crypto.randomUUID(),
          theme,
          sentence: "",
          englishTranslation: "",
          attempts: [],
          status: "generating",
          createdAt: now + placeholders.length,
          level: itemLevel,
        });
      }
    });

    setUserItems((prev) => [...[...placeholders].reverse(), ...prev]);
    navigate({ to: "/sentence/$id", params: { id: placeholders[0].id } });

    const generatedByTheme = new Map<string, string[]>();

    for (const placeholder of placeholders) {
      const generatedThisTheme = generatedByTheme.get(placeholder.theme) ?? [];
      const existingForTheme = existingByTheme.get(placeholder.theme) ?? [];
      const previousSentences = [
        ...generatedThisTheme,
        ...existingForTheme,
      ].slice(0, MAX_PREVIOUS_SENTENCES);
      const resolved = await generateSentenceForItem(
        placeholder,
        previousSentences,
        key,
      );
      updateItem(resolved);
      if (resolved.status === "in_progress") {
        generatedThisTheme.unshift(resolved.sentence);
        generatedByTheme.set(placeholder.theme, generatedThisTheme);
      }
    }

    setGeneratingSource(null);
  }

  function generateFromList(
    themes: string[],
    count: 1 | 3,
    itemLevel: SentenceLevel,
  ) {
    if (themes.length === 0 || isGenerating) return;
    withApiKey((key) =>
      runGenerateList(
        shuffle(themes),
        count,
        count === 1 ? "single" : "batch",
        key,
        itemLevel,
      ),
    );
  }

  function generateAnother(item: ThemePracticeItem) {
    if (isGenerating) return;
    withApiKey((key) =>
      runGenerate(item.theme, 1, "another", key, item.level ?? "B1"),
    );
  }

  async function runInsertManual(text: string, key: string) {
    setGeneratingSource("single");

    const placeholder: ThemePracticeItem = {
      id: crypto.randomUUID(),
      theme: "(manual entry)",
      sentence: text,
      englishTranslation: "",
      attempts: [],
      status: "generating",
      createdAt: Date.now(),
      level: undefined,
      manual: true,
    };

    setUserItems((prev) => [placeholder, ...prev]);
    navigate({ to: "/sentence/$id", params: { id: placeholder.id } });

    const resolved = await generateSentenceForItem(placeholder, [], key);
    updateItem(resolved);

    setGeneratingSource(null);
  }

  function insertManual(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;
    withApiKey((key) => runInsertManual(trimmed, key));
  }

  async function runRetry(item: ThemePracticeItem, key: string) {
    setGeneratingSource("retry");
    updateItem({
      ...item,
      status: "generating",
      errorMessage: undefined,
    });

    const previousSentences = userItems
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
    setGeneratingSource(null);
  }

  function retry(item: ThemePracticeItem) {
    if (isGenerating) return;
    withApiKey((key) => runRetry(item, key));
  }

  function clearUserItems() {
    setUserItems([]);
  }

  function resetDemoItems() {
    setDemoItems(DEMO_ITEMS);
  }

  return (
    <FromThemeContext.Provider
      value={{
        userItems,
        demoItems,
        level,
        setLevel,
        generatingSource,
        isGenerating,
        findItem,
        siblingsFor,
        generateNew,
        generateFromList,
        generateAnother,
        insertManual,
        retry,
        updateItem,
        clearUserItems,
        resetDemoItems,
      }}
    >
      <Outlet />
      {pendingGeneration && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onCancel={() => setPendingGeneration(null)}
        />
      )}
    </FromThemeContext.Provider>
  );
}

export function useFromTheme() {
  const ctx = useContext(FromThemeContext);
  if (!ctx)
    throw new Error("useFromTheme must be used within FromThemeProvider");
  return ctx;
}

export default FromThemeProvider;
