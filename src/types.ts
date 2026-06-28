export interface WordAnalysis {
  word: string;
  baseForm: string | null;
  translation: string;
  grammaticalInfo: string | null;
}

export interface CompoundExpression {
  expression: string;
  translation: string;
  explanation: string;
}

export interface AnalysisEntry {
  id: string;
  originalText: string;
  fullTranslation: string;
  words: WordAnalysis[];
  compoundExpressions: CompoundExpression[];
  createdAt: number;
}
