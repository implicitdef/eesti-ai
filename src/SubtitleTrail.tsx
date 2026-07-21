import type { ComplexVocabEntry, SubtitleCue } from "./types";
import { vocabForCues } from "./complexVocab";

interface Props {
  primaryCues: SubtitleCue[];
  secondaryCues?: SubtitleCue[] | null;
  showSecondary: boolean;
  currentTime: number;
  vocabEntries?: ComplexVocabEntry[] | null;
  showCheatsheet: boolean;
}

function trailLines(cues: SubtitleCue[], currentTime: number): SubtitleCue[] {
  let activeIndex = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].start <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return [activeIndex - 2, activeIndex - 1, activeIndex]
    .filter((i) => i >= 0)
    .map((i) => cues[i]);
}

function SubtitleTrail({
  primaryCues,
  secondaryCues,
  showSecondary,
  currentTime,
  vocabEntries,
  showCheatsheet,
}: Props) {
  const primaryLines = trailLines(primaryCues, currentTime);
  const secondaryLines =
    showSecondary && secondaryCues
      ? trailLines(secondaryCues, currentTime)
      : [];
  const cheatsheetEntries =
    showCheatsheet && vocabEntries
      ? vocabForCues(vocabEntries, primaryLines)
      : [];

  return (
    <div className="flex flex-col gap-4 px-2 py-2">
      <div className="flex flex-col gap-2">
        {primaryLines.map((cue, i) => {
          const isCurrent = i === primaryLines.length - 1;
          return (
            <p
              key={i}
              className={
                isCurrent
                  ? "text-2xl font-medium text-gray-800"
                  : "text-2xl text-gray-400"
              }
            >
              {cue.text}
            </p>
          );
        })}
      </div>

      {cheatsheetEntries.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
          {cheatsheetEntries.map(({ entry, isPast }, i) => (
            <div
              key={i}
              className={
                "flex items-baseline gap-2 text-sm" +
                (isPast ? " opacity-50" : "")
              }
            >
              <span className="font-medium text-gray-800">
                {entry.baseForm}
              </span>
              <span className="text-xs text-gray-400 shrink-0">
                {entry.type}
              </span>
              <span className="text-gray-500 truncate">
                {entry.translations.join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {secondaryLines.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-3">
          {secondaryLines.map((cue, i) => {
            const isCurrent = i === secondaryLines.length - 1;
            return (
              <p
                key={i}
                className={
                  isCurrent
                    ? "text-base font-medium text-blue-500"
                    : "text-base text-blue-300"
                }
              >
                {cue.text}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SubtitleTrail;
