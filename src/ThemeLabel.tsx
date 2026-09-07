import { SENTENCE_LEVEL_LABELS, type SentenceLevel } from "./types";

export function formatThemeLevel(theme: string, level: SentenceLevel) {
  return (
    <>
      "{theme}"{" "}
      <span className="text-gray-500 italic text-xs">
        {SENTENCE_LEVEL_LABELS[level].toLowerCase()}
      </span>
    </>
  );
}

function ThemeLabel({ theme, level }: { theme: string; level: SentenceLevel }) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        Theme ({SENTENCE_LEVEL_LABELS[level].toLowerCase()}):{" "}
      </p>
      <p className="text-sm font-medium text-gray-600">{theme}</p>
    </div>
  );
}

export default ThemeLabel;
