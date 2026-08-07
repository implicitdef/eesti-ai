import {
  ArrowLeftRight,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  FileVideo,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import SubtitleTrail from "./SubtitleTrail";
import TabDescription from "./TabDescription";
import { parseComplexVocab } from "./complexVocab";
import {
  detectLanguageLabel,
  estonianScore,
  parseSubtitles,
} from "./subtitles";
import type { ComplexVocabEntry, SubtitleCue } from "./types";

interface SubtitleTrack {
  cues: SubtitleCue[];
  label: string;
  fileName: string;
}

const VIDEO_POSITIONS_KEY = "eesti-ai-video-positions";
const MAX_VIDEO_POSITIONS = 50;
const RESUME_END_GUARD_SECONDS = 2;

interface VideoPositions {
  [key: string]: { time: number; updatedAt: number };
}

function videoKeyFor(file: File): string {
  return `${file.name}:${file.size}`;
}

function readVideoPositions(): VideoPositions {
  try {
    const stored = localStorage.getItem(VIDEO_POSITIONS_KEY);
    return stored ? (JSON.parse(stored) as VideoPositions) : {};
  } catch {
    return {};
  }
}

function saveVideoPosition(key: string, time: number) {
  const positions = readVideoPositions();
  positions[key] = { time, updatedAt: Date.now() };
  let entries = Object.entries(positions);
  if (entries.length > MAX_VIDEO_POSITIONS) {
    entries = entries
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
      .slice(0, MAX_VIDEO_POSITIONS);
  }
  localStorage.setItem(
    VIDEO_POSITIONS_KEY,
    JSON.stringify(Object.fromEntries(entries)),
  );
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
  const lastSavedSecondRef = useRef(-1);
  const videoKey = videoFile ? videoKeyFor(videoFile) : null;

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    function flush() {
      if (videoFile && videoRef.current) {
        saveVideoPosition(videoKeyFor(videoFile), videoRef.current.currentTime);
      }
    }
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
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
      if (videoFile && videoRef.current) {
        saveVideoPosition(videoKeyFor(videoFile), videoRef.current.currentTime);
      }
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

  function handleTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const t = e.currentTarget.currentTime;
    setCurrentTime(t);
    if (!videoKey) return;
    const sec = Math.floor(t);
    if (sec !== lastSavedSecondRef.current) {
      lastSavedSecondRef.current = sec;
      saveVideoPosition(videoKey, t);
    }
  }

  function handlePause(e: React.SyntheticEvent<HTMLVideoElement>) {
    if (!videoKey) return;
    saveVideoPosition(videoKey, e.currentTarget.currentTime);
  }

  function handleLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement>) {
    lastSavedSecondRef.current = -1;
    if (!videoKey) return;
    const video = e.currentTarget;
    const saved = readVideoPositions()[videoKey];
    if (
      saved &&
      saved.time > 0 &&
      (Number.isNaN(video.duration) ||
        saved.time < video.duration - RESUME_END_GUARD_SECONDS)
    ) {
      video.currentTime = saved.time;
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
            <TabDescription>
              Watch an Estonian video with dual subtitles plus an optional
              vocabulary cheatsheet to help with tricky words.
              <br />
              This feature does not use Anthropic API at all, but you need to
              have already ready :<br />- the video file
              <br />- the subtitle files (typically Estonian + a reference one
              in French or English)
              <br />- the cheatsheet, which needs to be generated with a script
              that does use Anthropic API.
            </TabDescription>
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
              onTimeUpdate={handleTimeUpdate}
              onPause={handlePause}
              onLoadedMetadata={handleLoadedMetadata}
            />
            <button
              onClick={reset}
              className="self-start flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <RotateCcw size={12} />
              Choose different files
            </button>
          </div>

          <div className="lg:w-[416px] shrink-0 flex flex-col gap-3">
            {(secondaryTrack || vocabEntries) && (
              <div className="flex items-center gap-2 px-1 flex-wrap">
                {secondaryTrack && (
                  <>
                    <button
                      onClick={() => setShowSecondary((v) => !v)}
                      className={
                        showSecondary
                          ? "flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
                          : "flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
                      }
                    >
                      {showSecondary ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showSecondary
                        ? `Hide ${secondaryTrack.label}`
                        : `Show ${secondaryTrack.label}`}
                    </button>
                    <button
                      onClick={() => setSwapped((v) => !v)}
                      className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
                    >
                      <ArrowLeftRight size={12} />
                      Swap languages
                    </button>
                  </>
                )}
                {vocabEntries && (
                  <button
                    onClick={() => setShowCheatsheet((v) => !v)}
                    className={
                      showCheatsheet
                        ? "flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                        : "flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
                    }
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
              secondaryLabel={secondaryTrack?.label}
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
