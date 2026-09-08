import { BookOpen, Redo2, RotateCcw } from "lucide-react";
import { useState } from "react";
import IngestPractice from "./IngestPractice";
import TabDescription from "./TabDescription";
import { parseVocabPaste } from "./vocabIngest";
import type { VocabList } from "./types";

const INGEST_LIST_KEY = "eesti-ai-ingest-list";
const PREVIEW_WORD_COUNT = 6;

interface DeckStats {
  correct: Set<number>;
  failed: Set<number>;
}

function readStoredList(): VocabList | null {
  try {
    const stored = localStorage.getItem(INGEST_LIST_KEY);
    return stored ? (JSON.parse(stored) as VocabList) : null;
  } catch {
    return null;
  }
}

function IngestPasteForm({
  onLoad,
}: {
  onLoad: (pairs: VocabList["pairs"]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pairs = parseVocabPaste(text);
    if (!pairs) {
      setError(
        "Couldn't find any word pairs. Paste rows of Estonian + English, separated by a tab, one per line.",
      );
      return;
    }
    setError(null);
    onLoad(pairs);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xl">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"sool\tsalt\njõulud\tChristmas\nköha\tcough"}
        rows={10}
        className="border-2 border-black rounded-md px-4 py-2.5 text-sm font-mono bg-slate-100 text-blue-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!text.trim()}
        className="self-start flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <BookOpen size={16} />
        Load list
      </button>
    </form>
  );
}

function IngestMode() {
  const [list, setList] = useState<VocabList | null>(() => readStoredList());
  // Indices into list.pairs currently being quizzed; null when showing the card.
  const [practiceIndices, setPracticeIndices] = useState<number[] | null>(null);
  const [deckStats, setDeckStats] = useState<DeckStats | null>(null);

  function loadList(pairs: VocabList["pairs"]) {
    const next: VocabList = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      pairs,
    };
    localStorage.setItem(INGEST_LIST_KEY, JSON.stringify(next));
    setList(next);
    setDeckStats(null);
    setPracticeIndices(null);
  }

  function clearList() {
    localStorage.removeItem(INGEST_LIST_KEY);
    setList(null);
    setDeckStats(null);
    setPracticeIndices(null);
  }

  function startPractice(indices: number[]) {
    setPracticeIndices(indices);
  }

  function handlePracticeComplete(correctness: boolean[]) {
    if (!practiceIndices) return;
    const nextCorrect = new Set(deckStats?.correct);
    const nextFailed = new Set(deckStats?.failed);
    practiceIndices.forEach((originalIndex, i) => {
      if (correctness[i]) {
        nextCorrect.add(originalIndex);
        nextFailed.delete(originalIndex);
      } else {
        nextFailed.add(originalIndex);
        nextCorrect.delete(originalIndex);
      }
    });
    setDeckStats({ correct: nextCorrect, failed: nextFailed });
    setPracticeIndices(null);
  }

  if (list && practiceIndices) {
    return (
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <IngestPractice
            quizPairs={practiceIndices.map((i) => list.pairs[i])}
            optionPool={list.pairs}
            onExit={() => setPracticeIndices(null)}
            onComplete={handlePracticeComplete}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <TabDescription>
          Paste a vocabulary list copied from a spreadsheet (Estonian word, tab,
          English translation, one pair per line) and practice guessing the
          translations.
        </TabDescription>

        {list ? (
          <div className="flex flex-col gap-4 border border-gray-300 rounded-lg px-5 py-4">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {list.pairs.length} word
                {list.pairs.length === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {list.pairs
                  .slice(0, PREVIEW_WORD_COUNT)
                  .map((p) => p.estonian)
                  .join(", ")}
                {list.pairs.length > PREVIEW_WORD_COUNT ? ", …" : ""}
              </p>
              {deckStats && (
                <p className="text-sm mt-2">
                  <span className="text-green-600 font-semibold">
                    {deckStats.correct.size} correct
                  </span>
                  {" · "}
                  <span className="text-red-500 font-semibold">
                    {deckStats.failed.size} wrong
                  </span>
                  <span className="text-gray-400">
                    {" "}
                    (out of {list.pairs.length})
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => startPractice(list.pairs.map((_, i) => i))}
                className="flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                <BookOpen size={16} />
                {deckStats ? "Practice again" : "Practice"}
              </button>
              {deckStats && deckStats.failed.size > 0 && (
                <button
                  onClick={() => startPractice([...deckStats.failed])}
                  className="flex items-center gap-1.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg px-5 py-2 text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Redo2 size={16} />
                  Practice the {deckStats.failed.size} missed word
                  {deckStats.failed.size === 1 ? "" : "s"}
                </button>
              )}
              <button
                onClick={clearList}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                <RotateCcw size={12} />
                Paste a different list
              </button>
            </div>
          </div>
        ) : (
          <IngestPasteForm onLoad={loadList} />
        )}
      </div>
    </main>
  );
}

export default IngestMode;
