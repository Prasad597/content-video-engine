import type { ShortDefinition } from "./types";

// Reserved staging-only namespace, outside the authored content/public paths.
export const musicFiles = (id: string) => ({ bed: `__prepared_music/${id}/bed.wav`, mix: `__prepared_music/${id}/mix.json` });
const smooth = (x: number) => (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, x)))) / 2;
export function musicGain(short: ShortDefinition, time: number, duration: number) {
  const music = short.audio?.music;
  if (!music || time < 0 || time >= duration) return 0;
  let gain = music.volume ?? (short.audio?.narrationVolume ?? 1) * 10 ** (-22 / 20);
  for (const change of music.changes ?? []) {
    const start = short.scenes.find((s) => s.id === change.sceneId)!.start;
    if (time < start) break;
    const blend = smooth((time - start) / (change.transitionSeconds ?? 0.5));
    gain += (change.volume - gain) * blend;
    if (blend < 1) break;
  }
  return gain * smooth(time / (music.fadeInSeconds ?? 0.5)) *
    smooth((duration - time) / (music.fadeOutSeconds ?? 0.8));
}
