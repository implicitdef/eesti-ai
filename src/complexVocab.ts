import type { ComplexVocabEntry, SubtitleCue } from "./types";

/**
 * Parses a "complex vocabulary cheatsheet" JSON file: a list of complicated
 * words/idioms found in a subtitle track, with the timestamps they occur at.
 * Returns null if the shape doesn't match, so callers can show an error
 * without throwing mid-upload.
 */
export function parseComplexVocab(raw: string): ComplexVocabEntry[] | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof data !== "object" || data === null || !("entries" in data)) {
    return null;
  }
  const entries = (data as { entries: unknown }).entries;
  if (!Array.isArray(entries)) return null;

  const parsed: ComplexVocabEntry[] = [];
  for (const e of entries) {
    if (
      typeof e !== "object" ||
      e === null ||
      typeof (e as Record<string, unknown>).startMs !== "number" ||
      typeof (e as Record<string, unknown>).endMs !== "number" ||
      typeof (e as Record<string, unknown>).baseForm !== "string" ||
      typeof (e as Record<string, unknown>).surfaceForm !== "string" ||
      typeof (e as Record<string, unknown>).type !== "string" ||
      !Array.isArray((e as Record<string, unknown>).translations)
    ) {
      return null;
    }
    const entry = e as Record<string, unknown>;
    parsed.push({
      startMs: entry.startMs as number,
      endMs: entry.endMs as number,
      surfaceForm: entry.surfaceForm as string,
      baseForm: entry.baseForm as string,
      type: entry.type as string,
      translations: (entry.translations as unknown[]).filter(
        (t): t is string => typeof t === "string",
      ),
    });
  }

  return parsed;
}

export interface VocabTrailEntry {
  entry: ComplexVocabEntry;
  isPast: boolean;
}

/**
 * Vocab entries whose time window overlaps any of the given subtitle cues
 * (e.g. the lines currently shown in the trail), deduplicated by base form
 * in order of first appearance. Each entry is tagged with whether it came
 * from the last cue (the current line) or an earlier one (a past line).
 */
export function vocabForCues(
  vocab: ComplexVocabEntry[],
  cues: SubtitleCue[],
): VocabTrailEntry[] {
  const seen = new Set<string>();
  const result: VocabTrailEntry[] = [];
  const currentCue = cues[cues.length - 1];

  for (const cue of cues) {
    const cueStartMs = cue.start * 1000;
    const cueEndMs = cue.end * 1000;
    for (const entry of vocab) {
      if (entry.startMs >= cueEndMs || entry.endMs <= cueStartMs) continue;
      const key = entry.baseForm.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ entry, isPast: cue !== currentCue });
    }
  }

  return result;
}
