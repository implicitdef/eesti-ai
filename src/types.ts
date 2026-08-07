export interface SentencePracticeAttempt {
  userAnswer: string;
  isCorrect: boolean;
}

export interface SentencePracticeItem {
  id: string;
  originalEstonian: string;
  englishTranslation: string;
  variantEnglishTranslation: string;
  variant: string;
  attempts: SentencePracticeAttempt[];
  status: "in_progress" | "completed";
  revealed: boolean;
  createdAt: number;
}

export interface MixedSentencePracticeItem {
  id: string;
  inputSentences: string;
  sentence: string;
  englishTranslation: string;
  attempts: SentencePracticeAttempt[];
  status: "in_progress" | "completed";
  revealed: boolean;
  createdAt: number;
}

export interface ThemePracticeItem {
  id: string;
  theme: string;
  sentence: string;
  englishTranslation: string;
  attempts: SentencePracticeAttempt[];
  status: "in_progress" | "completed";
  revealed: boolean;
  createdAt: number;
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
