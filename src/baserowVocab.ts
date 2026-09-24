import type { BaserowVocabRow } from "./baserow-api";
import type { VocabPair } from "./types";

export interface VocabConflict {
  rowId: number;
  estonian: string;
  existingEnglish: string;
  newEnglish: string;
}

export interface VocabClassification {
  toAdd: VocabPair[];
  // Already in the table with the same translation: nothing to do.
  identical: VocabPair[];
  conflicts: VocabConflict[];
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Splits pasted pairs against the table's rows. Duplicates are matched on
 * the Estonian word only, ignoring case. A word repeated within the paste
 * keeps its first occurrence; a word present in several table rows is
 * matched against the first one.
 */
export function classifyVocab(
  pairs: VocabPair[],
  rows: BaserowVocabRow[],
): VocabClassification {
  const rowsByEstonian = new Map<string, BaserowVocabRow>();
  for (const row of rows) {
    const key = normalize(row.estonian);
    if (key && !rowsByEstonian.has(key)) rowsByEstonian.set(key, row);
  }

  const result: VocabClassification = {
    toAdd: [],
    identical: [],
    conflicts: [],
  };
  const seen = new Set<string>();
  for (const pair of pairs) {
    const key = normalize(pair.estonian);
    if (seen.has(key)) continue;
    seen.add(key);

    const row = rowsByEstonian.get(key);
    if (!row) {
      result.toAdd.push(pair);
    } else if (normalize(row.english) === normalize(pair.english)) {
      result.identical.push(pair);
    } else {
      result.conflicts.push({
        rowId: row.id,
        estonian: row.estonian,
        existingEnglish: row.english,
        newEnglish: pair.english,
      });
    }
  }
  return result;
}
