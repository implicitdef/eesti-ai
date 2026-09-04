export interface SentencePracticeAttempt {
  userAnswer: string;
  isCorrect: boolean;
  // Absent on attempts recorded before per-word inputs existed.
  wordValues?: string[];
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
  revealed: boolean;
  createdAt: number;
  level: SentenceLevel;
  // Set only when status === "error".
  errorMessage?: string;
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
