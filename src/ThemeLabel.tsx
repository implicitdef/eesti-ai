import { SENTENCE_LEVEL_LABELS, type SentenceLevel } from "./types";

export function formatLevel(level: SentenceLevel | undefined) {
  return level ? SENTENCE_LEVEL_LABELS[level].toLowerCase() : undefined;
}

export function themeDisplayText(theme: string, hideTheme: boolean) {
  return hideTheme ? "<hidden>" : `"${theme}"`;
}

function ThemeLabel({
  level,
  theme,
  hideTheme,
}: {
  theme: string;
  level: SentenceLevel | undefined;
  hideTheme?: boolean;
}) {
  const formattedLevel = formatLevel(level);
  return (
    <div>
      <span className="text-gray-500">Theme : </span>
      <>
        {hideTheme ? (
          <span className="font-mono text-gray-400 italic">&lt;hidden&gt;</span>
        ) : (
          <>
            "<span className="font-mono">{theme}</span>"
          </>
        )}{" "}
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
