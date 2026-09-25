import { BookOpen, Database, FileSearch, Languages, Video } from "lucide-react";
import type { ComponentType } from "react";

export type FeatureId =
  | "translation"
  | "vocabPractice"
  | "video"
  | "vocabExtract"
  | "baserow";

export interface Feature {
  id: FeatureId;
  /** Title of the feature's card on the welcome page. */
  welcomeCardLabel: string;
  /** Link in the header nav ("other features: ..."). */
  navLabel: string;
  /** Subtitle next to "Õpimasin" in the header, on the feature's pages. */
  headerTitle: string;
  /** Link text when another feature's description mentions this one. */
  inTextLabel: string;
  to: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  isActive: (pathname: string) => boolean;
  /** Hidden unless owner mode is on (not ready, or only useful to the owner). */
  ownerOnly?: boolean;
}

export const FEATURES: Feature[] = [
  {
    id: "translation",
    welcomeCardLabel: "Translation exercise",
    navLabel: "Translation exercise",
    headerTitle: "Translation exercise",
    inTextLabel: "Translation exercise",
    to: "/translation-exercise",
    description:
      "Translate English sentences into Estonian. Pick a demo sentence, generate new ones from a theme or a few words, or write your own — then check your answer word by word.",
    icon: Languages,
    isActive: (path) =>
      path.startsWith("/translation-exercise") ||
      path.startsWith("/sentence") ||
      path.startsWith("/generate"),
  },
  {
    id: "vocabPractice",
    welcomeCardLabel: "Vocabulary practice",
    navLabel: "Vocab practice",
    headerTitle: "Vocabulary practice",
    inTextLabel: "Vocabulary practice",
    to: "/vocab-practice",
    description:
      "Paste vocabulary lists copied from a spreadsheet and drill them with multiple-choice quizzes.",
    icon: BookOpen,
    isActive: (path) => path.startsWith("/vocab-practice"),
  },
  {
    id: "video",
    welcomeCardLabel: "Video",
    navLabel: "Video",
    headerTitle: "Watch video with vocab",
    inTextLabel: "Video",
    to: "/video",
    description:
      "Watch an Estonian video with dual subtitles plus an optional vocabulary cheatsheet, so tricky words are explained right when you hear them.",
    icon: Video,
    isActive: (path) => path.startsWith("/video"),
    ownerOnly: true,
  },
  {
    id: "vocabExtract",
    welcomeCardLabel: "Vocabulary extraction",
    navLabel: "Vocab extract",
    headerTitle: "Vocabulary extraction",
    inTextLabel: "Vocabulary extraction",
    to: "/vocab-extract",
    description:
      "Paste an Estonian text and extract the vocabulary that isn't obvious for a B1 learner, with English translations, ready to paste into a spreadsheet.",
    icon: FileSearch,
    isActive: (path) => path.startsWith("/vocab-extract"),
  },
  {
    id: "baserow",
    welcomeCardLabel: "Add vocab to Baserow",
    navLabel: "Add vocab to Baserow",
    headerTitle: "Add vocab to Baserow",
    inTextLabel: "Add vocab to Baserow",
    to: "/baserow-vocab",
    description:
      "Paste new vocabulary and add it to your Baserow vocabulary table, choosing which translation to keep for words that are already there.",
    icon: Database,
    isActive: (path) => path.startsWith("/baserow-vocab"),
    ownerOnly: true,
  },
];

export function getFeature(id: FeatureId): Feature {
  return FEATURES.find((f) => f.id === id)!;
}

export function visibleFeatures(ownerMode: boolean): Feature[] {
  return ownerMode ? FEATURES : FEATURES.filter((f) => !f.ownerOnly);
}
