export interface SentencePracticeAttempt {
  userAnswer: string;
  isCorrect: boolean;
  // Absent on attempts recorded before per-word inputs existed.
  wordValues?: string[];
  // Set only for attempts on one sentence of a long text (see sentenceSplit).
  sentenceIndex?: number;
}

export type SentenceLevel = "A1" | "B1";

export const SENTENCE_LEVEL_LABELS: Record<SentenceLevel, string> = {
  A1: "Easy",
  B1: "Difficult",
};

export interface ThemePracticeItem {
  id: string;
  theme: string;
  sentence: string;
  englishTranslation: string;
  attempts: SentencePracticeAttempt[];
  status: "generating" | "error" | "in_progress" | "completed";
  createdAt: number;
  level?: SentenceLevel;
  // Set only when status === "error".
  errorMessage?: string;
  // Set only for items inserted as-is via "Insert a manually generated
  // Estonian sentence" (no AI sentence generation, only translation).
  manual?: boolean;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export interface ComplexVocabEntry {
  startMs: number;
  endMs: number;
  surfaceForm: string;
  baseForm: string;
  type: string;
  translations: string[];
}

export interface VocabPair {
  estonian: string;
  english: string;
}

export interface VocabList {
  id: string;
  name: string;
  createdAt: number;
  pairs: VocabPair[];
  // Indices into `pairs` answered right / wrong, updated live as each word
  // is answered during a practice session (see IngestMode). Reset to empty
  // when a fresh "Practice" run starts, but left untouched when resuming
  // "Practice the missed words". An index absent from both arrays has not
  // been answered yet in the current run.
  correctIndices: number[];
  failedIndices: number[];
}
