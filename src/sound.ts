let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  peakGain: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function playSentenceReadySound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 660, now, 0.12, 0.12);
  playTone(ctx, 880, now + 0.08, 0.14, 0.12);
}

export function playCorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 523.25, now, 0.12, 0.15); // C5
  playTone(ctx, 659.25, now + 0.09, 0.12, 0.15); // E5
  playTone(ctx, 783.99, now + 0.18, 0.22, 0.15); // G5
}

export function playIncorrectSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 220, now, 0.16, 0.15);
  playTone(ctx, 174.61, now + 0.12, 0.22, 0.15);
}
