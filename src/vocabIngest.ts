import type { VocabPair } from "./types";

export const MAX_QUIZ_OPTIONS = 10;

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

/**
 * MCQ options for `correct`: itself plus up to MAX_QUIZ_OPTIONS - 1 other
 * translations drawn randomly from `pool` (e.g. the whole deck, even when
 * only a subset of it is being quizzed), all shuffled together.
 */
export function buildOptions(correct: string, pool: VocabPair[]): string[] {
  const distractorPool = Array.from(
    new Set(
      pool
        .map((p) => p.english)
        .filter((english) => english.toLowerCase() !== correct.toLowerCase()),
    ),
  );
  const distractors = shuffle(distractorPool).slice(0, MAX_QUIZ_OPTIONS - 1);
  return shuffle([correct, ...distractors]);
}
