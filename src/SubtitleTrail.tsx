import type { ReactNode } from "react";
import { Captions, BookOpen, Languages } from "lucide-react";
import type { ComplexVocabEntry, SubtitleCue } from "./types";
import { vocabForCues } from "./complexVocab";

interface Props {
  primaryCues: SubtitleCue[];
  secondaryCues?: SubtitleCue[] | null;
  secondaryLabel?: string | null;
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

function CardHeader({
  icon,
  label,
  className,
}: {
  icon: ReactNode;
  label: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-3 ${className}`}
    >
      {icon}
      {label}
    </div>
  );
}

function SubtitleTrail({
  primaryCues,
  secondaryCues,
  secondaryLabel,
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
    <div className="flex flex-col gap-3 px-2 py-2">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <CardHeader
          icon={<Captions size={14} />}
          label="Subtitles"
          className="text-blue-600"
        />
        <div className="flex flex-col gap-2">
          {primaryLines.map((cue, i) => {
            const isCurrent = i === primaryLines.length - 1;
            return (
              <p
                key={i}
                className={
                  isCurrent
                    ? "text-2xl font-semibold text-gray-900"
                    : "text-lg text-gray-400"
                }
              >
                {cue.text}
              </p>
            );
          })}
        </div>
      </div>

      {cheatsheetEntries.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 shadow-sm p-4">
          <CardHeader
            icon={<BookOpen size={14} />}
            label="Cheatsheet"
            className="text-amber-700"
          />
          <div className="flex flex-col gap-1.5">
            {cheatsheetEntries.map(({ entry, isPast }, i) => (
              <div
                key={i}
                className={
                  "flex items-baseline gap-2 text-sm rounded-md px-2 py-1" +
                  (isPast ? " opacity-50" : " bg-white/70")
                }
              >
                <span className="font-medium text-gray-800">
                  {entry.baseForm}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 shrink-0">
                  {entry.type}
                </span>
                <span className="text-gray-500 truncate">
                  {entry.translations.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {secondaryLines.length > 0 && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/50 shadow-sm p-4">
          <CardHeader
            icon={<Languages size={14} />}
            label={secondaryLabel ?? "Other language"}
            className="text-sky-600"
          />
          <div className="flex flex-col gap-1">
            {secondaryLines.map((cue, i) => {
              const isCurrent = i === secondaryLines.length - 1;
              return (
                <p
                  key={i}
                  className={
                    isCurrent
                      ? "text-base font-medium text-sky-700"
                      : "text-base text-sky-300"
                  }
                >
                  {cue.text}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubtitleTrail;
