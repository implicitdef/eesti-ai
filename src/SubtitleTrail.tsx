import type { SubtitleCue } from "./types";

interface Props {
  cues: SubtitleCue[];
  currentTime: number;
}

function SubtitleTrail({ cues, currentTime }: Props) {
  let activeIndex = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].start <= currentTime) {
      activeIndex = i;
    } else {
      break;
    }
  }

  const lines = [activeIndex - 2, activeIndex - 1, activeIndex]
    .filter((i) => i >= 0)
    .map((i) => cues[i]);

  return (
    <div className="lg:w-96 shrink-0 flex flex-col gap-2 px-2 py-4">
      {lines.map((cue, i) => {
        const isCurrent = i === lines.length - 1;
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
  );
}

export default SubtitleTrail;
