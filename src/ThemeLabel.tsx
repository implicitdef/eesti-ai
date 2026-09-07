import { SENTENCE_LEVEL_LABELS, type SentenceLevel } from "./types";

export function formatLevel(level: SentenceLevel) {
  return SENTENCE_LEVEL_LABELS[level].toLowerCase();
}

function ThemeLabel({ level, theme }: { theme: string; level: SentenceLevel }) {
  return (
    <div>
      <span className="text-gray-500">Theme : </span>
      <>
        "<span className="font-mono">{theme}</span>"{" "}
        <span className="text-sm text-gray-500 italic">
          ({formatLevel(level)})
        </span>
      </>
    </div>
  );
}

export default ThemeLabel;
