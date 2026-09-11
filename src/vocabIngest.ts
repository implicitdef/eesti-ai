import type { VocabPair } from "./types";

export const MAX_QUIZ_OPTIONS = 10;

export const SPLIT_SUGGESTION_THRESHOLD = 20;
export const BUCKET_SIZE_OPTIONS = [10, 20, 30] as const;
export type BucketSize = (typeof BUCKET_SIZE_OPTIONS)[number];

/**
 * Parses vocabulary pasted from a Google Sheets selection: one word pair per
 * line, Estonian and English separated by a tab. Lines that don't split into
 * a non-empty pair are skipped rather than failing the whole paste.
 */
export function parseVocabPaste(raw: string): VocabPair[] | null {
  const pairs: VocabPair[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [estonian, ...rest] = trimmed.split("\t");
    const english = rest.join(" ").trim();
    if (!estonian?.trim() || !english) continue;
    pairs.push({ estonian: estonian.trim(), english });
  }
  return pairs.length > 0 ? pairs : null;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A random practice order visiting every word in the list exactly once. */
export function shuffleOrder(count: number): number[] {
  return shuffle(Array.from({ length: count }, (_, i) => i));
}

/** How many buckets `splitIntoBuckets` would produce for this total/maxSize. */
export function bucketCount(total: number, maxBucketSize: number): number {
  return Math.max(1, Math.ceil(total / maxBucketSize));
}

/**
 * Splits `pairs` into `bucketCount(pairs.length, maxBucketSize)` evenly
 * balanced buckets (sizes differ by at most 1), mixing words across buckets
 * rather than chunking the original paste order.
 */
export function splitIntoBuckets(
  pairs: VocabPair[],
  maxBucketSize: number,
): VocabPair[][] {
  const count = bucketCount(pairs.length, maxBucketSize);
  const buckets: VocabPair[][] = Array.from({ length: count }, () => []);
  shuffle(pairs).forEach((pair, i) => buckets[i % count].push(pair));
  return buckets;
}

/**
 * A split member is just labeled by its position ("1/4") since the shared
 * name lives on its VocabListGroup instead; a lone list keeps the typed name.
 */
export function buildListName(
  name: string,
  index: number,
  total: number,
): string {
  if (total > 1) return `${index + 1}/${total}`;
  return name.trim() || "New list";
}

/**
 * MCQ options for `correct`: itself plus up to MAX_QUIZ_OPTIONS - 1 other
 * translations drawn randomly from `pool` (e.g. the whole deck, even when
 * only a subset of it is being quizzed), all shuffled together. `field`
 * selects which side of the pair to draw distractors from — "english" for
 * the normal direction, "estonian" for reversed practice.
 */
export function buildOptions(
  correct: string,
  pool: VocabPair[],
  field: "estonian" | "english" = "english",
): string[] {
  const distractorPool = Array.from(
    new Set(
      pool
        .map((p) => p[field])
        .filter((value) => value.toLowerCase() !== correct.toLowerCase()),
    ),
  );
  const distractors = shuffle(distractorPool).slice(0, MAX_QUIZ_OPTIONS - 1);
  return shuffle([correct, ...distractors]);
}

/**
 * Reversed practice (guess the Estonian word from its English translation)
 * only makes sense if each English translation maps back to a single
 * Estonian word — otherwise the prompt would be ambiguous.
 */
export function hasAmbiguousEnglish(pairs: VocabPair[]): boolean {
  const seen = new Set<string>();
  for (const pair of pairs) {
    const key = pair.english.trim().toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}
