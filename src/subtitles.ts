import type { SubtitleCue } from "./types";

function parseTimestamp(raw: string): number {
  const match = raw.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})$/);
  if (!match) return 0;
  const [, hours, minutes, seconds, millis] = match;
  return (
    Number(hours ?? 0) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(millis) / 1000
  );
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Parses WebVTT and SRT subtitle files. The two formats are structurally
 * identical for our purposes (a "-->" timing line per cue, comma or dot as
 * the millisecond separator) — this never requires the WEBVTT header, so
 * both parse the same way.
 */
export function parseSubtitles(raw: string): SubtitleCue[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;

    const timingLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingLineIndex === -1) continue; // WEBVTT header, NOTE/STYLE block, or SRT sequence number

    const [startRaw, endRawWithSettings] = lines[timingLineIndex].split("-->");
    const endRaw = endRawWithSettings.trim().split(/\s+/)[0];
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);

    const text = stripTags(lines.slice(timingLineIndex + 1).join("\n")).trim();
    if (text) {
      cues.push({ start, end, text });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
}

// Common function words, used to guess a subtitle track's language from its
// text. These are short, high-frequency words that show up regardless of the
// movie's subject matter (unlike nouns/verbs, which are topic-dependent).
const ESTONIAN_WORDS = new Set([
  "ja",
  "ei",
  "on",
  "et",
  "ma",
  "sa",
  "ta",
  "me",
  "te",
  "nad",
  "kas",
  "aga",
  "see",
  "oli",
  "ning",
  "väga",
  "mida",
  "kes",
  "kus",
  "miks",
  "kui",
  "siis",
  "ka",
  "või",
  "seda",
  "selle",
  "need",
  "olen",
  "oled",
  "pole",
  "mis",
  "nii",
  "juba",
  "veel",
  "ainult",
  "ise",
  "oma",
  "seal",
  "praegu",
  "üks",
  "kaks",
  "kolm",
  "hea",
  "suur",
  "väike",
  "sina",
  "mina",
]);

const ENGLISH_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "and",
  "you",
  "to",
  "of",
  "in",
  "that",
  "it",
  "was",
  "he",
  "she",
  "they",
  "we",
  "this",
  "have",
  "with",
  "for",
  "on",
  "not",
  "but",
  "what",
  "your",
  "my",
  "me",
  "do",
  "did",
  "will",
  "would",
  "can",
  "could",
  "there",
  "all",
  "just",
  "know",
  "get",
]);

const FRENCH_WORDS = new Set([
  "le",
  "la",
  "les",
  "de",
  "des",
  "un",
  "une",
  "je",
  "tu",
  "il",
  "elle",
  "vous",
  "nous",
  "est",
  "sont",
  "que",
  "qui",
  "pas",
  "avec",
  "pour",
  "dans",
  "ce",
  "cette",
  "mais",
  "ne",
  "se",
  "et",
  "à",
  "du",
  "au",
  "aux",
  "moi",
  "toi",
  "ça",
  "être",
  "avoir",
]);

function tokenize(cues: SubtitleCue[]): string[] {
  const text = cues
    .slice(0, 300)
    .map((c) => c.text)
    .join(" ")
    .toLowerCase();
  return text.match(/[a-zà-öø-ÿ]+/g) ?? [];
}

/**
 * Rough likelihood (higher = more Estonian) that a subtitle track is
 * Estonian, based on common function-word hits plus Estonian-only letters
 * (õ, š, ž — unlike ä/ö/ü, these essentially never occur in English/French
 * subtitle text). Used to pick the Estonian track when two files are loaded
 * together, by comparing scores rather than relying on a fixed threshold.
 */
export function estonianScore(cues: SubtitleCue[]): number {
  const tokens = tokenize(cues);
  if (tokens.length === 0) return 0;
  const wordHits = tokens.filter((t) => ESTONIAN_WORDS.has(t)).length;
  const letterHits = (
    cues
      .map((c) => c.text)
      .join("")
      .match(/[õšž]/gi) ?? []
  ).length;
  return (wordHits + letterHits) / tokens.length;
}

export type DetectedLanguage = "Estonian" | "English" | "French" | "Original";

/** Best-guess language label for display purposes. */
export function detectLanguageLabel(cues: SubtitleCue[]): DetectedLanguage {
  const tokens = tokenize(cues);
  if (tokens.length === 0) return "Original";

  const score = (words: Set<string>) =>
    tokens.filter((t) => words.has(t)).length;

  const scores: [DetectedLanguage, number][] = [
    ["Estonian", score(ESTONIAN_WORDS)],
    ["English", score(ENGLISH_WORDS)],
    ["French", score(FRENCH_WORDS)],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "Original";
}
