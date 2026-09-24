import { splitIntoSentences } from "./sentenceSplit";
import type { VocabPair } from "./types";

export const DEFAULT_CHUNK_TARGET_CHARS = 750;

/**
 * Greedily packs sentences into chunks of at most ~targetChars, joined by a
 * single space, without ever splitting a sentence across two chunks. A
 * single sentence longer than targetChars becomes its own oversized chunk
 * rather than being cut mid-sentence.
 */
export function chunkText(
  text: string,
  targetChars: number = DEFAULT_CHUNK_TARGET_CHARS,
): string[] {
  const sentences = splitIntoSentences(text);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + 1 + sentence.length > targetChars) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

/**
 * Merges vocab pairs extracted across chunks, deduping by Estonian base
 * form (trimmed, case-insensitive). First occurrence wins, so a word
 * re-extracted near a chunk boundary doesn't churn the result.
 */
export function dedupeVocabPairs(pairs: VocabPair[]): VocabPair[] {
  const seen = new Set<string>();
  const result: VocabPair[] = [];
  for (const pair of pairs) {
    const estonian = pair.estonian.trim();
    const english = pair.english.trim();
    if (!estonian || !english) continue;
    const key = estonian.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ estonian, english });
  }
  return result;
}

/** word<TAB>translation, one pair per line, for the copyable output block. */
export function toTsv(pairs: VocabPair[]): string {
  return pairs.map((p) => `${p.estonian}\t${p.english}`).join("\n");
}
