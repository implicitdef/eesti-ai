import { BookOpen, Database, FileSearch, Languages, Video } from "lucide-react";
import type { ComponentType } from "react";

export interface Feature {
  label: string;
  to: string;
  pageTitle: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  isActive: (pathname: string) => boolean;
  /** Hidden unless owner mode is on (not ready, or only useful to the owner). */
  ownerOnly?: boolean;
}

export const FEATURES: Feature[] = [
  {
    label: "Translation exercise",
    to: "/translation-exercise",
    pageTitle: "Translation exercise",
    description:
      "Translate English sentences into Estonian. Pick a demo sentence, generate new ones from a theme or a few words, or write your own — then check your answer word by word.",
    icon: Languages,
    isActive: (path) =>
      path.startsWith("/translation-exercise") ||
      path.startsWith("/sentence") ||
      path.startsWith("/generate"),
  },
  {
    label: "Vocab practice",
    to: "/vocab-practice",
    pageTitle: "Vocab practice",
    description:
      "Paste vocabulary lists copied from a spreadsheet and drill them with multiple-choice quizzes. Track which words you've missed and practice them again.",
    icon: BookOpen,
    isActive: (path) => path.startsWith("/vocab-practice"),
  },
  {
    label: "Video",
    to: "/video",
    pageTitle: "Watch video with vocab",
    description:
      "Watch an Estonian video with dual subtitles plus an optional vocabulary cheatsheet, so tricky words are explained right when you hear them.",
    icon: Video,
    isActive: (path) => path.startsWith("/video"),
    ownerOnly: true,
  },
  {
    label: "Vocab extract",
    to: "/vocab-extract",
    pageTitle: "Vocab extract",
    description:
      "Paste an Estonian text and extract the vocabulary that isn't obvious for a B1 learner, with English translations, ready to paste into a spreadsheet.",
    icon: FileSearch,
    isActive: (path) => path.startsWith("/vocab-extract"),
  },
  {
    label: "Add vocab to Baserow",
    to: "/baserow-vocab",
    pageTitle: "Add vocab to Baserow",
    description:
      "Paste new vocabulary and add it to your Baserow vocabulary table, choosing which translation to keep for words that are already there.",
    icon: Database,
    isActive: (path) => path.startsWith("/baserow-vocab"),
    ownerOnly: true,
  },
];

export function visibleFeatures(ownerMode: boolean): Feature[] {
  return ownerMode ? FEATURES : FEATURES.filter((f) => !f.ownerOnly);
}
