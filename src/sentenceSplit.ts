import type { SentencePracticeAttempt } from "./types";

// A text is a "long text" (practised sentence by sentence) when it has at
// least this many characters and at least 2 sentences.
const LONG_TEXT_MIN_CHARS = 150;

// Fragments with fewer letters than this ("1.", "Oh.") are not treated as
// sentences of their own and get merged into a neighbour.
const MIN_SENTENCE_LETTERS = 4;

// Abbreviations (Estonian and English) that are commonly followed by a
// capitalised name, so a "." after them is not a sentence boundary.
const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "st",
  "jr",
  "sr",
  "prof",
  "hr",
  "pr",
  "lp",
]);

// A boundary is sentence-ending punctuation (optionally followed by closing
// quotes/brackets), then whitespace, then something that looks like the
// start of a sentence: an uppercase letter or a digit, optionally preceded
// by an opening quote/bracket. Blank lines are boundaries too, since pasted
// text commonly uses them as unpunctuated paragraph breaks.
const BOUNDARY_RE = /(?<=[.!?…]["'”’»)]*)\s+(?=["'„“«(]?[\p{Lu}\d])|\n\s*\n+/u;

function letterCount(fragment: string): number {
  return fragment.match(/\p{L}/gu)?.length ?? 0;
}

function endsWithAbbreviation(fragment: string): boolean {
  const match = fragment.match(/(?:^|[\s(])(\p{L}+)\.$/u);
  if (!match) return false;
  const word = match[1];
  // Single letters are initials ("J. K. Rowling").
  return word.length === 1 || ABBREVIATIONS.has(word.toLowerCase());
}

/**
 * Splits Estonian or English text into sentences. A pragmatic regex plus a
 * few heuristics, not a full tokenizer: lowercase-starting continuations
 * (most abbreviations) never split, known abbreviations and initials before
 * a capitalised word are merged back, and tiny fragments (list numbers,
 * interjections) are merged into a neighbouring sentence.
 */
export function splitIntoSentences(text: string): string[] {
  const collapsed = text.trim().replace(/\n\s*\n+/g, "\n\n");
  if (!collapsed) return [];
  const fragments = collapsed
    .split(BOUNDARY_RE)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const sentences: string[] = [];
  let pending = "";
  for (const fragment of fragments) {
    const current = pending ? `${pending} ${fragment}` : fragment;
    if (
      endsWithAbbreviation(current) ||
      letterCount(current) < MIN_SENTENCE_LETTERS
    ) {
      pending = current;
      continue;
    }
    sentences.push(current);
    pending = "";
  }
  if (pending) {
    if (sentences.length > 0) {
      sentences[sentences.length - 1] += ` ${pending}`;
    } else {
      sentences.push(pending);
    }
  }
  return sentences;
}

export function isLongText(estonian: string): boolean {
  return (
    estonian.length >= LONG_TEXT_MIN_CHARS &&
    splitIntoSentences(estonian).length >= 2
  );
}

export interface SentencePair {
  estonian: string;
  english: string;
}

/**
 * The sentence-by-sentence pairs of a long text, or null when the text is
 * not long or (for items stored before this was validated at generation
 * time) the English doesn't have the same number of sentences.
 */
export function longTextPairs(
  estonian: string,
  english: string,
): SentencePair[] | null {
  if (!isLongText(estonian)) return null;
  const estonianSentences = splitIntoSentences(estonian);
  const englishSentences = splitIntoSentences(english);
  if (estonianSentences.length !== englishSentences.length) return null;
  return estonianSentences.map((sentence, i) => ({
    estonian: sentence,
    english: englishSentences[i],
  }));
}

/** Throws when a long text's English translation can't be paired up. */
export function assertSentenceCountsMatch(estonian: string, english: string) {
  if (!isLongText(estonian)) return;
  const estonianCount = splitIntoSentences(estonian).length;
  const englishCount = splitIntoSentences(english).length;
  if (estonianCount !== englishCount) {
    throw new Error(
      `The English translation has ${englishCount} sentences but the Estonian text has ${estonianCount}.`,
    );
  }
}

/** Which sentences of a long text have been solved. */
export function solvedSentences(
  pairs: SentencePair[],
  attempts: SentencePracticeAttempt[],
  isCompleted: boolean,
): boolean[] {
  return pairs.map(
    (_, i) =>
      isCompleted || attempts.some((a) => a.sentenceIndex === i && a.isCorrect),
  );
}
