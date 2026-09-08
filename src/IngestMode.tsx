import { BookOpen, Pencil, Plus, Redo2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import IngestPractice from "./IngestPractice";
import TabDescription from "./TabDescription";
import { parseVocabPaste } from "./vocabIngest";
import type { VocabList, VocabPair } from "./types";

const INGEST_LISTS_KEY = "eesti-ai-ingest-lists";
// Superseded by INGEST_LISTS_KEY once multiple lists were supported; read
// once to migrate anyone's single in-progress list rather than lose it.
const LEGACY_INGEST_LIST_KEY = "eesti-ai-ingest-list";
const PREVIEW_HEAD_COUNT = 3;
const PREVIEW_TAIL_COUNT = 2;

function migrateLegacyList(): VocabList[] {
  try {
    const legacy = localStorage.getItem(LEGACY_INGEST_LIST_KEY);
    localStorage.removeItem(LEGACY_INGEST_LIST_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy) as {
      id: string;
      createdAt: number;
      pairs: VocabPair[];
    };
    return [
      {
        id: parsed.id,
        name: "My list",
        createdAt: parsed.createdAt,
        pairs: parsed.pairs,
        correctIndices: [],
        failedIndices: [],
      },
    ];
  } catch {
    return [];
  }
}

function readStoredLists(): VocabList[] {
  try {
    const stored = localStorage.getItem(INGEST_LISTS_KEY);
    if (stored) return JSON.parse(stored) as VocabList[];
  } catch {
    return [];
  }
  return migrateLegacyList();
}

function previewWords(pairs: VocabPair[]): string {
  const words = pairs.map((p) => p.estonian);
  if (words.length <= PREVIEW_HEAD_COUNT + PREVIEW_TAIL_COUNT) {
    return words.join(", ");
  }
  const head = words.slice(0, PREVIEW_HEAD_COUNT).join(", ");
  const tail = words.slice(-PREVIEW_TAIL_COUNT).join(", ");
  return `${head}, ..., ${tail}`;
}

function IngestPasteForm({
  onLoad,
  onCancel,
}: {
  onLoad: (pairs: VocabPair[]) => void;
  onCancel?: () => void;
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
    setText("");
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
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!text.trim()}
          className="self-start flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <BookOpen size={16} />
          Load list
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function EditableListName({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  if (editing) {
    function commit() {
      const trimmed = value.trim();
      setEditing(false);
      if (trimmed && trimmed !== name) onRename(trimmed);
    }

    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="text-lg font-bold text-gray-900 border-b-2 border-blue-400 bg-transparent focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setValue(name);
        setEditing(true);
      }}
      title="Rename this list"
      className="flex items-center gap-1.5 text-left group"
    >
      <span className="text-lg font-bold text-gray-900">{name}</span>
      <Pencil
        size={13}
        className="text-gray-300 group-hover:text-gray-500 transition-colors"
      />
    </button>
  );
}

function IngestListCard({
  list,
  onRename,
  onRemove,
  onPractice,
}: {
  list: VocabList;
  onRename: (name: string) => void;
  onRemove: () => void;
  onPractice: (indices: number[]) => void;
}) {
  const hasStats = list.correctIndices.length + list.failedIndices.length > 0;

  return (
    <div className="flex flex-col gap-4 border border-gray-300 rounded-lg px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <EditableListName name={list.name} onRename={onRename} />
          <p className="text-sm text-gray-500">
            {list.pairs.length} word{list.pairs.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {previewWords(list.pairs)}
          </p>
          {hasStats && (
            <p className="text-sm mt-2">
              <span className="text-green-600 font-semibold">
                {list.correctIndices.length} correct
              </span>
              {" · "}
              <span className="text-red-500 font-semibold">
                {list.failedIndices.length} wrong
              </span>
              <span className="text-gray-400">
                {" "}
                (out of {list.pairs.length})
              </span>
            </p>
          )}
        </div>
        <button
          onClick={onRemove}
          title="Remove this list"
          className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => onPractice(list.pairs.map((_, i) => i))}
          className="flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors"
        >
          <BookOpen size={16} />
          {hasStats ? "Practice again" : "Practice"}
        </button>
        {list.failedIndices.length > 0 && (
          <button
            onClick={() => onPractice(list.failedIndices)}
            className="flex items-center gap-1.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg px-5 py-2 text-sm font-semibold hover:bg-amber-100 transition-colors"
          >
            <Redo2 size={16} />
            Practice the {list.failedIndices.length} missed word
            {list.failedIndices.length === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </div>
  );
}

interface PracticeSession {
  listId: string;
  indices: number[];
}

function IngestMode() {
  const [lists, setLists] = useState<VocabList[]>(() => readStoredLists());
  const [practicing, setPracticing] = useState<PracticeSession | null>(null);
  const [showPasteForm, setShowPasteForm] = useState(false);

  useEffect(() => {
    localStorage.setItem(INGEST_LISTS_KEY, JSON.stringify(lists));
  }, [lists]);

  function addList(pairs: VocabPair[]) {
    const next: VocabList = {
      id: crypto.randomUUID(),
      name: "New list",
      createdAt: Date.now(),
      pairs,
      correctIndices: [],
      failedIndices: [],
    };
    setLists((prev) => [next, ...prev]);
    setShowPasteForm(false);
  }

  function renameList(id: string, name: string) {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }

  function removeList(id: string) {
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  function handlePracticeComplete(correctness: boolean[]) {
    if (!practicing) return;
    setLists((prev) =>
      prev.map((l) => {
        if (l.id !== practicing.listId) return l;
        const nextCorrect = new Set(l.correctIndices);
        const nextFailed = new Set(l.failedIndices);
        practicing.indices.forEach((originalIndex, i) => {
          if (correctness[i]) {
            nextCorrect.add(originalIndex);
            nextFailed.delete(originalIndex);
          } else {
            nextFailed.add(originalIndex);
            nextCorrect.delete(originalIndex);
          }
        });
        return {
          ...l,
          correctIndices: [...nextCorrect],
          failedIndices: [...nextFailed],
        };
      }),
    );
    setPracticing(null);
  }

  const activeList = practicing
    ? lists.find((l) => l.id === practicing.listId)
    : undefined;

  if (practicing && activeList) {
    return (
      <main className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <IngestPractice
            quizPairs={practicing.indices.map((i) => activeList.pairs[i])}
            optionPool={activeList.pairs}
            onExit={() => setPracticing(null)}
            onComplete={handlePracticeComplete}
          />
        </div>
      </main>
    );
  }

  const pasteFormVisible = showPasteForm || lists.length === 0;

  return (
    <main className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <TabDescription>
          Paste vocabulary lists copied from a spreadsheet (Estonian word, tab,
          English translation, one pair per line) and practice guessing the
          translations.
        </TabDescription>

        {pasteFormVisible ? (
          <IngestPasteForm
            onLoad={addList}
            onCancel={
              lists.length > 0 ? () => setShowPasteForm(false) : undefined
            }
          />
        ) : (
          <button
            onClick={() => setShowPasteForm(true)}
            className="self-start flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 underline"
          >
            <Plus size={16} />
            Add a new list
          </button>
        )}

        {lists.length > 0 && (
          <div className="flex flex-col gap-4">
            {lists.map((list) => (
              <IngestListCard
                key={list.id}
                list={list}
                onRename={(name) => renameList(list.id, name)}
                onRemove={() => removeList(list.id)}
                onPractice={(indices) =>
                  setPracticing({ listId: list.id, indices })
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default IngestMode;
