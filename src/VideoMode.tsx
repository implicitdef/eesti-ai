import { useEffect, useRef, useState } from "react";
import {
  FileVideo,
  FileText,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowLeftRight,
  BookOpen,
} from "lucide-react";
import SubtitleTrail from "./SubtitleTrail";
import {
  parseSubtitles,
  estonianScore,
  detectLanguageLabel,
} from "./subtitles";
import { parseComplexVocab } from "./complexVocab";
import type { ComplexVocabEntry, SubtitleCue } from "./types";

interface SubtitleTrack {
  cues: SubtitleCue[];
  label: string;
  fileName: string;
}

function VideoMode() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tracks, setTracks] = useState<SubtitleTrack[] | null>(null);
  const [swapped, setSwapped] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [vocabError, setVocabError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [vocabEntries, setVocabEntries] = useState<ComplexVocabEntry[] | null>(
    null,
  );
  const [vocabFileName, setVocabFileName] = useState<string | null>(null);
  const [showCheatsheet, setShowCheatsheet] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const subtitleFiles = files
      .filter((f) => /\.(vtt|srt)$/i.test(f.name))
      .slice(0, 2);
    const vocabFile = files.find((f) => /\.json$/i.test(f.name));
    const videoCandidate = files.find(
      (f) => !subtitleFiles.includes(f) && f !== vocabFile,
    );

    if (videoCandidate) {
      setVideoFile(videoCandidate);
    }

    if (vocabFile) {
      const vocab = parseComplexVocab(await vocabFile.text());
      if (vocab) {
        setVocabEntries(vocab);
        setVocabFileName(vocabFile.name);
        setVocabError(null);
      } else {
        setVocabEntries(null);
        setVocabFileName(null);
        setVocabError("Couldn't read that cheatsheet JSON file.");
      }
    }

    if (subtitleFiles.length === 0) return;

    try {
      const parsed = await Promise.all(
        subtitleFiles.map(async (f) => ({
          cues: parseSubtitles(await f.text()),
          fileName: f.name,
        })),
      );
      const nonEmpty = parsed.filter((p) => p.cues.length > 0);

      if (nonEmpty.length === 0) {
        setSubtitleError("No subtitle cues found in these files.");
        setTracks(null);
      } else if (nonEmpty.length === 1) {
        setSubtitleError(null);
        setTracks([
          { ...nonEmpty[0], label: detectLanguageLabel(nonEmpty[0].cues) },
        ]);
      } else {
        // Two files: whichever scores higher as Estonian becomes the
        // always-on primary track; the other is the toggle-able original.
        const ordered = [...nonEmpty].sort(
          (a, b) => estonianScore(b.cues) - estonianScore(a.cues),
        );
        setSubtitleError(null);
        setTracks([
          { ...ordered[0], label: "Estonian" },
          { ...ordered[1], label: detectLanguageLabel(ordered[1].cues) },
        ]);
      }
      setSwapped(false);
      setShowSecondary(false);
    } catch {
      setSubtitleError("Couldn't read those subtitle files.");
      setTracks(null);
    }
  }

  function reset() {
    setVideoFile(null);
    setTracks(null);
    setSubtitleError(null);
    setCurrentTime(0);
    setSwapped(false);
    setShowSecondary(false);
    setVocabEntries(null);
    setVocabFileName(null);
    setVocabError(null);
    setShowCheatsheet(true);
  }

  const primaryTrack = tracks
    ? swapped
      ? (tracks[1] ?? tracks[0])
      : tracks[0]
    : null;
  const secondaryTrack =
    tracks && tracks.length > 1 ? (swapped ? tracks[0] : tracks[1]) : null;

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {!videoFile || !primaryTrack ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md flex flex-col gap-4">
            <label className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <FileVideo size={20} className="text-blue-700 shrink-0" />
              <span className="text-sm text-gray-700">
                Choose video + subtitle files…
              </span>
              <input
                type="file"
                accept="video/*,.vtt,.srt,.json"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>
            <div className="flex flex-col gap-1 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FileVideo size={14} className="shrink-0" />
                <span className="truncate">
                  {videoFile ? videoFile.name : "No video selected yet"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText size={14} className="shrink-0" />
                <span className="truncate">
                  {tracks
                    ? tracks
                        .map((t) => `${t.label} (${t.cues.length} cues)`)
                        .join(" · ")
                    : "No subtitles selected yet"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="shrink-0" />
                <span className="truncate">
                  {vocabFileName
                    ? `${vocabFileName} (${vocabEntries?.length ?? 0} entries)`
                    : "No cheatsheet selected (optional)"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Select a video plus one or two subtitle files (.srt/.vtt) at once.
              With two files, the Estonian track is detected automatically — use
              "Swap languages" after loading if it guessed wrong. Optionally add
              a complex-vocabulary cheatsheet JSON file to enable the word-list
              toggle.
            </p>
            {subtitleError && (
              <p className="text-sm text-red-500">{subtitleError}</p>
            )}
            {vocabError && <p className="text-sm text-red-500">{vocabError}</p>}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-auto px-6 py-6">
          <div className="lg:flex-1 flex flex-col gap-3 min-w-0">
            <video
              ref={videoRef}
              src={videoUrl ?? undefined}
              controls
              className="w-full rounded-lg bg-black max-h-[75vh]"
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
            <button
              onClick={reset}
              className="self-start flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <RotateCcw size={12} />
              Choose different files
            </button>
          </div>

          <div className="lg:w-96 shrink-0 flex flex-col gap-2">
            {(secondaryTrack || vocabEntries) && (
              <div className="flex items-center gap-3 px-2 flex-wrap">
                {secondaryTrack && (
                  <>
                    <button
                      onClick={() => setShowSecondary((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {showSecondary ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showSecondary
                        ? `Hide ${secondaryTrack.label}`
                        : `Show ${secondaryTrack.label}`}
                    </button>
                    <button
                      onClick={() => setSwapped((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <ArrowLeftRight size={12} />
                      Swap languages
                    </button>
                  </>
                )}
                {vocabEntries && (
                  <button
                    onClick={() => setShowCheatsheet((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <BookOpen size={12} />
                    {showCheatsheet ? "Hide cheatsheet" : "Show cheatsheet"}
                  </button>
                )}
              </div>
            )}
            <SubtitleTrail
              primaryCues={primaryTrack.cues}
              secondaryCues={secondaryTrack?.cues ?? null}
              showSecondary={showSecondary}
              currentTime={currentTime}
              vocabEntries={vocabEntries}
              showCheatsheet={showCheatsheet}
            />
          </div>
        </div>
      )}
    </main>
  );
}

export default VideoMode;
