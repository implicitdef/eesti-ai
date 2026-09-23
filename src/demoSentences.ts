import type { SentenceLevel } from "./types";

export interface DemoSentence {
  theme: string;
  level: SentenceLevel;
  sentence: string;
  englishTranslation: string;
}

// Add as many as you like — no need to fill in anything beyond these four
// fields, everything else (id, attempts, status, ...) is derived.
export const DEMO_SENTENCES: DemoSentence[] = [
  {
    theme: "family",
    level: "B1",
    sentence: "Minu perekonnas on neli inimest ja üks koer.",
    englishTranslation: "My family has four people and one dog.",
  },
  {
    theme: "hädas olema",
    level: "B1",
    sentence: "Ta helistas mulle, kuna oli suures hädas.",
    englishTranslation: "He called me because he was in serious trouble.",
  },
  {
    theme: "coffee",
    level: "B1",
    sentence: "Ma joon igal hommikul kohvi.",
    englishTranslation: "I drink coffee every morning.",
  },
];
