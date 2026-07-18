export interface WordAnalysis {
  word: string;
  wordType: string;
  baseForm: string | null;
  translation: string;
  grammaticalInfo: string | null;
}

export interface CompoundExpression {
  expression: string;
  translation: string;
  explanation: string;
}

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

export interface AnalysisEntry {
  id: string;
  originalText: string;
  fullTranslation: string;
  words: WordAnalysis[];
  compoundExpressions: CompoundExpression[];
  createdAt: number;
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}
