import type { VocabPair } from "./types";

export const MAX_QUIZ_OPTIONS = 10;

export const DIFFICULTIES = ["very-easy", "easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  "very-easy": "Very easy (4 options)",
  easy: "Easy (6 options)",
  medium: "Medium (10 options)",
  hard: "Hard (20 options)",
};

const DIFFICULTY_OPTION_COUNTS: Record<Difficulty, number> = {
  "very-easy": 4,
  easy: 6,
  medium: MAX_QUIZ_OPTIONS,
  hard: 20,
};

export function optionCountForDifficulty(difficulty: Difficulty): number {
  return DIFFICULTY_OPTION_COUNTS[difficulty];
}

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
 * MCQ options for `correct`: itself plus up to `optionCount` - 1 other
 * translations drawn randomly from `pool` (e.g. the whole deck, even when
 * only a subset of it is being quizzed), all shuffled together. `field`
 * selects which side of the pair to draw distractors from — "english" for
 * the normal direction, "estonian" for reversed practice.
 */
export function buildOptions(
  correct: string,
  pool: VocabPair[],
  field: "estonian" | "english" = "english",
  optionCount: number = MAX_QUIZ_OPTIONS,
): string[] {
  const distractorPool = Array.from(
    new Set(
      pool
        .map((p) => p[field])
        .filter((value) => value.toLowerCase() !== correct.toLowerCase()),
    ),
  );
  const distractors = shuffle(distractorPool).slice(0, optionCount - 1);
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
