import { SENTENCE_LEVEL_LABELS, type SentenceLevel } from "./types";

export function formatLevel(level: SentenceLevel | undefined) {
  return level ? SENTENCE_LEVEL_LABELS[level].toLowerCase() : undefined;
}

function ThemeLabel({
  level,
  theme,
}: {
  theme: string;
  level: SentenceLevel | undefined;
}) {
  const formattedLevel = formatLevel(level);
  return (
    <div>
      <span className="text-gray-500">Theme : </span>
      <>
        "<span className="font-mono">{theme}</span>"{" "}
        {formattedLevel && (
          <span className="text-sm text-gray-500 italic">
            ({formattedLevel})
          </span>
        )}
      </>
    </div>
  );
}

export default ThemeLabel;
