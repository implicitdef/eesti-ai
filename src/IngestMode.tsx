import { BookOpen, Pencil, Plus, Redo2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import IngestPractice from "./IngestPractice";
import TabDescription from "./TabDescription";
import {
  BUCKET_SIZE_OPTIONS,
  SPLIT_SUGGESTION_THRESHOLD,
  bucketCount,
  buildListName,
  parseVocabPaste,
  splitIntoBuckets,
  type BucketSize,
} from "./vocabIngest";
import type { VocabList, VocabListGroup, VocabPair } from "./types";

interface ListDraft {
  name: string;
  pairs: VocabPair[];
}

const fieldClassName =
  "border-2 border-black rounded-md px-4 py-2.5 text-sm bg-slate-100 text-blue-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const selectClassName =
  "border-2 border-black rounded-md px-2 py-2.5 text-sm bg-slate-100 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const INGEST_LISTS_KEY = "eesti-ai-ingest-lists";
const INGEST_GROUPS_KEY = "eesti-ai-ingest-groups";
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

function readStoredGroups(): VocabListGroup[] {
  try {
    const stored = localStorage.getItem(INGEST_GROUPS_KEY);
    if (stored) return JSON.parse(stored) as VocabListGroup[];
  } catch {
    return [];
  }
  return [];
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

/**
 * The "split this into smaller lists?" form: bucket-size picker, live
 * preview, and the split/secondary/cancel actions. Shared by the paste flow
 * (splitting brand-new pasted pairs) and by an existing standalone list's
 * "Split into smaller lists" action, so both look and behave identically.
 */
function SplitOfferPanel({
  totalWords,
  bucketSize,
  onBucketSizeChange,
  message,
  onSplit,
  secondaryAction,
  onCancel,
  cancelLabel = "Cancel",
}: {
  totalWords: number;
  bucketSize: BucketSize;
  onBucketSizeChange: (size: BucketSize) => void;
  message?: string;
  onSplit: () => void;
  secondaryAction?: { label: string; onClick: () => void };
  onCancel: () => void;
  cancelLabel?: string;
}) {
  const splitCount = bucketCount(totalWords, bucketSize);
  return (
    <div className="flex flex-col gap-3 border border-gray-300 rounded-lg bg-gray-50 p-4 max-w-xl">
      {message && <p className="text-sm text-gray-700">{message}</p>}
      <div className="flex items-center gap-2">
        <label htmlFor="bucket-size" className="text-sm text-gray-600">
          Max words per list
        </label>
        <select
          id="bucket-size"
          value={bucketSize}
          onChange={(e) =>
            onBucketSizeChange(Number(e.target.value) as BucketSize)
          }
          className={selectClassName}
        >
          {BUCKET_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500">
        {splitCount > 1
          ? `→ ${splitCount} lists of about ${Math.round(totalWords / splitCount)} words each`
          : "This size won't actually split your list — try a smaller max."}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={splitCount <= 1}
          onClick={onSplit}
          className="flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <BookOpen size={16} />
          Split into {splitCount} lists
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="border border-amber-300 bg-amber-50 text-amber-700 rounded-lg px-5 py-2 text-sm font-semibold hover:bg-amber-100 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

function IngestPasteForm({
  onLoad,
  onCancel,
}: {
  onLoad: (drafts: ListDraft[]) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedPairs, setParsedPairs] = useState<VocabPair[] | null>(null);
  const [bucketSize, setBucketSize] = useState<BucketSize>(
    BUCKET_SIZE_OPTIONS[0],
  );

  function commit(drafts: ListDraft[]) {
    onLoad(drafts);
    setName("");
    setText("");
    setParsedPairs(null);
    setBucketSize(BUCKET_SIZE_OPTIONS[0]);
  }

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
    if (pairs.length > SPLIT_SUGGESTION_THRESHOLD) {
      setParsedPairs(pairs);
    } else {
      commit([{ name, pairs }]);
    }
  }

  if (parsedPairs) {
    return (
      <SplitOfferPanel
        totalWords={parsedPairs.length}
        bucketSize={bucketSize}
        onBucketSizeChange={setBucketSize}
        message={`${parsedPairs.length} words is a lot to tackle in one go — want to split it into smaller lists?`}
        onSplit={() =>
          commit(
            splitIntoBuckets(parsedPairs, bucketSize).map((pairs) => ({
              name,
              pairs,
            })),
          )
        }
        secondaryAction={{
          label: "Keep as one list",
          onClick: () => commit([{ name, pairs: parsedPairs }]),
        }}
        onCancel={() => setParsedPairs(null)}
        cancelLabel="← Back"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xl">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New list"
        className={fieldClassName}
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"sool\tsalt\njõulud\tChristmas\nköha\tcough"}
        rows={10}
        className={`${fieldClassName} font-mono resize-y`}
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
  nameEditable,
  canSplit,
  onRename,
  onRemove,
  onPractice,
  onSplit,
}: {
  list: VocabList;
  nameEditable: boolean;
  canSplit: boolean;
  onRename: (name: string) => void;
  onRemove: () => void;
  onPractice: (indices: number[]) => void;
  onSplit: (bucketSize: BucketSize) => void;
}) {
  const hasStats = list.correctIndices.length + list.failedIndices.length > 0;
  const [splitting, setSplitting] = useState(false);
  const [bucketSize, setBucketSize] = useState<BucketSize>(
    BUCKET_SIZE_OPTIONS[0],
  );

  return (
    <div className="flex flex-col gap-4 border border-gray-300 rounded-lg px-5 py-4 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {nameEditable ? (
            <EditableListName name={list.name} onRename={onRename} />
          ) : (
            <span className="text-lg font-bold text-gray-900">{list.name}</span>
          )}
          <p className="text-sm text-gray-500">
            {list.pairs.length} word{list.pairs.length === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {previewWords(list.pairs)}
          </p>
          {canSplit && !splitting && (
            <button
              onClick={() => setSplitting(true)}
              className="text-xs text-blue-700 hover:text-blue-800 underline mt-1"
            >
              Split into smaller lists
            </button>
          )}
          {canSplit && splitting && (
            <div className="mt-2">
              <SplitOfferPanel
                totalWords={list.pairs.length}
                bucketSize={bucketSize}
                onBucketSizeChange={setBucketSize}
                onSplit={() => {
                  onSplit(bucketSize);
                  setSplitting(false);
                }}
                onCancel={() => setSplitting(false)}
              />
            </div>
          )}
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

type DisplayBlock =
  | { kind: "solo"; list: VocabList }
  | { kind: "group"; groupId: string; lists: VocabList[] };

/** Groups a flat list array into solo/group blocks, preserving array order. */
function buildDisplayBlocks(lists: VocabList[]): DisplayBlock[] {
  const blocks: DisplayBlock[] = [];
  const seenGroups = new Set<string>();
  for (const list of lists) {
    if (!list.groupId) {
      blocks.push({ kind: "solo", list });
      continue;
    }
    if (seenGroups.has(list.groupId)) continue;
    seenGroups.add(list.groupId);
    blocks.push({
      kind: "group",
      groupId: list.groupId,
      lists: lists.filter((l) => l.groupId === list.groupId),
    });
  }
  return blocks;
}

function IngestMode() {
  const [lists, setLists] = useState<VocabList[]>(() => readStoredLists());
  const [groups, setGroups] = useState<VocabListGroup[]>(() =>
    readStoredGroups(),
  );
  const [practicing, setPracticing] = useState<PracticeSession | null>(null);
  const [showPasteForm, setShowPasteForm] = useState(false);

  useEffect(() => {
    localStorage.setItem(INGEST_LISTS_KEY, JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem(INGEST_GROUPS_KEY, JSON.stringify(groups));
  }, [groups]);

  function addLists(drafts: ListDraft[]) {
    const total = drafts.length;
    const createdAt = Date.now();
    const groupId = total > 1 ? crypto.randomUUID() : undefined;
    const next: VocabList[] = drafts.map((draft, i) => ({
      id: crypto.randomUUID(),
      name: buildListName(draft.name, i, total),
      createdAt: createdAt + i,
      pairs: draft.pairs,
      correctIndices: [],
      failedIndices: [],
      groupId,
    }));
    if (groupId) {
      setGroups((prev) => [
        { id: groupId, name: drafts[0].name.trim() || "New list" },
        ...prev,
      ]);
    }
    setLists((prev) => [...next, ...prev]);
    setShowPasteForm(false);
  }

  function splitExistingList(id: string, bucketSize: BucketSize) {
    const target = lists.find((l) => l.id === id);
    if (!target) return;
    const buckets = splitIntoBuckets(target.pairs, bucketSize);
    if (buckets.length <= 1) return;
    const groupId = crypto.randomUUID();
    const now = Date.now();
    const members: VocabList[] = buckets.map((pairs, i) => ({
      id: crypto.randomUUID(),
      name: buildListName("", i, buckets.length),
      createdAt: now + i,
      pairs,
      correctIndices: [],
      failedIndices: [],
      groupId,
    }));
    setGroups((prev) => [{ id: groupId, name: target.name }, ...prev]);
    setLists((prev) => prev.flatMap((l) => (l.id === id ? members : l)));
  }

  function mergeGroup(groupId: string) {
    const members = lists.filter((l) => l.groupId === groupId);
    if (members.length === 0) return;
    const group = groups.find((g) => g.id === groupId);
    const merged: VocabList = {
      id: crypto.randomUUID(),
      name: group?.name ?? "Merged list",
      createdAt: Date.now(),
      pairs: members.flatMap((l) => l.pairs),
      correctIndices: [],
      failedIndices: [],
    };
    setLists((prev) => {
      const firstIndex = prev.findIndex((l) => l.groupId === groupId);
      return prev.flatMap((l, i) => {
        if (l.groupId !== groupId) return [l];
        return i === firstIndex ? [merged] : [];
      });
    });
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
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
            onLoad={addLists}
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
            {buildDisplayBlocks(lists).map((block) =>
              block.kind === "solo" ? (
                <IngestListCard
                  key={block.list.id}
                  list={block.list}
                  nameEditable
                  canSplit={
                    block.list.pairs.length > SPLIT_SUGGESTION_THRESHOLD
                  }
                  onRename={(name) => renameList(block.list.id, name)}
                  onRemove={() => removeList(block.list.id)}
                  onPractice={(indices) =>
                    setPracticing({ listId: block.list.id, indices })
                  }
                  onSplit={(bucketSize) =>
                    splitExistingList(block.list.id, bucketSize)
                  }
                />
              ) : (
                <div
                  key={block.groupId}
                  className="flex flex-col gap-3 bg-gray-100 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-600">
                      {groups.find((g) => g.id === block.groupId)?.name ??
                        "Group"}
                    </span>
                    <button
                      onClick={() => mergeGroup(block.groupId)}
                      className="text-xs text-blue-700 hover:text-blue-800 underline"
                    >
                      Merge into one list
                    </button>
                  </div>
                  {block.lists.map((list) => (
                    <IngestListCard
                      key={list.id}
                      list={list}
                      nameEditable={false}
                      canSplit={false}
                      onRename={(name) => renameList(list.id, name)}
                      onRemove={() => removeList(list.id)}
                      onPractice={(indices) =>
                        setPracticing({ listId: list.id, indices })
                      }
                      onSplit={() => {}}
                    />
                  ))}
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default IngestMode;
