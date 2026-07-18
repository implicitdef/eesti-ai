import { useEffect, useRef, useState } from "react";
import { FileVideo, FileText, RotateCcw } from "lucide-react";
import SubtitleTrail from "./SubtitleTrail";
import { parseSubtitles } from "./subtitles";
import type { SubtitleCue } from "./types";

function VideoMode() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [cues, setCues] = useState<SubtitleCue[] | null>(null);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

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
    const subtitleFile = files.find((f) => /\.(vtt|srt)$/i.test(f.name));
    const videoCandidate = files.find((f) => f !== subtitleFile);

    if (videoCandidate) {
      setVideoFile(videoCandidate);
    }

    if (subtitleFile) {
      try {
        const text = await subtitleFile.text();
        const parsed = parseSubtitles(text);
        if (parsed.length === 0) {
          setSubtitleError("No subtitle cues found in this file.");
          setCues(null);
        } else {
          setSubtitleError(null);
          setCues(parsed);
        }
      } catch {
        setSubtitleError("Couldn't read that subtitle file.");
        setCues(null);
      }
    }
  }

  function reset() {
    setVideoFile(null);
    setCues(null);
    setSubtitleError(null);
    setCurrentTime(0);
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {!videoFile || !cues ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-md flex flex-col gap-4">
            <label className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <FileVideo size={20} className="text-blue-700 shrink-0" />
              <span className="text-sm text-gray-700">
                Choose video + subtitle files…
              </span>
              <input
                type="file"
                accept="video/*,.vtt,.srt"
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
                  {cues
                    ? `${cues.length} subtitle cues loaded`
                    : "No subtitles selected yet"}
                </span>
              </div>
            </div>
            {subtitleError && (
              <p className="text-sm text-red-500">{subtitleError}</p>
            )}
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

          <SubtitleTrail cues={cues} currentTime={currentTime} />
        </div>
      )}
    </main>
  );
}

export default VideoMode;
