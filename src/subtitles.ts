import type { SubtitleCue } from "./types";

function parseTimestamp(raw: string): number {
  const match = raw.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})$/);
  if (!match) return 0;
  const [, hours, minutes, seconds, millis] = match;
  return (
    Number(hours ?? 0) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(millis) / 1000
  );
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Parses WebVTT and SRT subtitle files. The two formats are structurally
 * identical for our purposes (a "-->" timing line per cue, comma or dot as
 * the millisecond separator) — this never requires the WEBVTT header, so
 * both parse the same way.
 */
export function parseSubtitles(raw: string): SubtitleCue[] {
  const normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;

    const timingLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingLineIndex === -1) continue; // WEBVTT header, NOTE/STYLE block, or SRT sequence number

    const [startRaw, endRawWithSettings] = lines[timingLineIndex].split("-->");
    const endRaw = endRawWithSettings.trim().split(/\s+/)[0];
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);

    const text = stripTags(lines.slice(timingLineIndex + 1).join("\n")).trim();
    if (text) {
      cues.push({ start, end, text });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
}
