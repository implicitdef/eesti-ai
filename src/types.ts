export interface PracticeMistake {
  issue: string;
  suggestion: string;
}

export interface PracticeAttempt {
  userTranslation: string;
  isCorrect: boolean;
  isUnderstandable: boolean;
  isGrammaticallyCorrect: boolean;
  isNatural: boolean;
  mistakes: PracticeMistake[];
}

export interface CorrectVersion {
  translation: string;
  commentary: string;
}

export interface PracticeConversation {
  id: string;
  theme: string;
  englishSentence: string;
  attempts: PracticeAttempt[];
  acceptedVersions: CorrectVersion[] | null;
  correctVersions: CorrectVersion[] | null;
  status: "in_progress" | "completed";
  createdAt: number;
}

export interface SentencePracticeAttempt {
  userAnswer: string;
  isCorrect: boolean;
}

export interface SentencePracticeItem {
  id: string;
  originalEstonian: string;
  guidance: string | null;
  englishTranslation: string;
  englishVariant: string;
  variantDescription: string;
  expectedEstonian: string;
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
