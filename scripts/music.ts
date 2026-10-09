import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ShortDefinition } from "../src/engine/types";
import { musicFiles, musicGain } from "../src/engine/music";
import { durationFrames, FPS } from "../src/engine/timeline";

const RATE = 48000;
export function pcmWav(samples: Int16Array) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write("RIFF"); data.writeUInt32LE(data.length - 8, 4); data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(2, 22);
  data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 4, 28);
  data.writeUInt16LE(4, 32); data.writeUInt16LE(16, 34); data.write("data", 36); data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => data.writeInt16LE(s, 44 + i * 2));
  return data;
}
function readPcm(wav: Buffer) {
  if (wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE") throw new Error("Music decoder did not return WAV");
  for (let offset = 12; offset + 8 <= wav.length;) {
    const size = wav.readUInt32LE(offset + 4);
    if (wav.toString("ascii", offset, offset + 4) === "data") {
      const bytes = Math.min(size, wav.length - offset - 8), samples = new Int16Array(Math.floor(bytes / 2));
      for (let i = 0; i < samples.length; i++) samples[i] = wav.readInt16LE(offset + 8 + i * 2);
      return samples;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("Music WAV has no sample data");
}
export function loopMusic(source: Int16Array, frames: number, overlap: number) {
  const length = source.length / 2;
  if (!Number.isInteger(length) || length < 2 || !Number.isInteger(overlap) || overlap < 1 || overlap * 2 > length)
    throw new Error("Music crossfade must fit within half the decoded track duration");
  const output = new Float32Array(frames * 2), step = length - overlap;
  for (let start = 0; start < frames; start += step) {
    for (let i = 0; i < length && start + i < frames; i++) {
      // Complementary linear overlaps preserve level even for correlated loops.
      const weight = (start > 0 && i < overlap ? i / overlap : 1) *
        (i >= step && start + length < frames ? (length - i) / overlap : 1);
      output[2 * (start + i)] += source[2 * i] / 32768 * weight;
      output[2 * (start + i) + 1] += source[2 * i + 1] / 32768 * weight;
    }
    if (start + length >= frames) break;
  }
  return output;
}

// Extend the existing local staging step; the source files are read-only.
export function stageMusic(short: ShortDefinition, stage: string, root: string, resolveAudio: (name: string) => string) {
  const music = short.audio?.music;
  if (!music) return;
  const source = resolveAudio(music.file);
  if (!existsSync(source)) { console.warn(`Music omitted: missing optional local asset ${music.file}`); return; }
  const ffmpeg = process.platform === "win32" ? join(root, "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe") : "ffmpeg";
  const duration = durationFrames(short) / FPS;
  const decoded = spawnSync(ffmpeg, ["-v", "error", "-i", source, "-t", String(duration), "-vn", "-ar", String(RATE), "-ac", "2", "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"], { maxBuffer: 128 * 1024 * 1024 });
  if (decoded.status !== 0) throw new Error(`Cannot decode music ${music.file}: ${decoded.stderr?.toString() || decoded.error}`);
  const pcm = readPcm(decoded.stdout);
  const crossfade = music.crossfadeSeconds ?? Math.min(0.25, pcm.length / 2 / RATE / 4);
  const frames = Math.round(duration * RATE);
  const bed = loopMusic(pcm, frames, Math.round(crossfade * RATE));
  const samples = new Int16Array(bed.length);
  for (let i = 0; i < frames; i++) {
    const gain = musicGain(short, i / RATE, duration);
    for (let c = 0; c < 2; c++) {
      const value = bed[2 * i + c] * gain;
      samples[2 * i + c] = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
    }
  }
  const peak = (path: string) => {
    if (!existsSync(path)) return 0;
    const result = spawnSync(ffmpeg, ["-hide_banner", "-i", path, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1024 * 1024 });
    const db = result.stderr?.match(/"input_tp"\s*:\s*"([^"]+)"/)?.[1];
    if (result.status !== 0 || db === undefined || (db !== "-inf" && !Number.isFinite(Number(db))))
      throw new Error(`Cannot measure audio peak for music mix: ${path}`);
    return db === "-inf" ? 0 : 10 ** (Number(db) / 20);
  };
  const files = musicFiles(short.id);
  mkdirSync(dirname(join(stage, files.bed)), { recursive: true });
  writeFileSync(join(stage, files.bed), pcmWav(samples));
  const maximum = peak(resolveAudio(short.narration)) * (short.audio?.narrationVolume ?? 1) + peak(join(stage, files.bed)) +
    (short.audio?.effects ?? []).reduce((total, effect) => total + peak(resolveAudio(effect.file)) * effect.volume, 0);
  // A conservative summed-peak bound with 1 dB encoder headroom; never boost voice.
  const gain = Math.min(1, 10 ** (-1 / 20) / Math.max(maximum, Number.EPSILON));
  writeFileSync(join(stage, files.mix), JSON.stringify({ gain }));
}
