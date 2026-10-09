import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { openBrowser, selectComposition, renderMedia } from "@remotion/renderer";
import { loopMusic, pcmWav } from "./music";
import { musicGain, musicFiles } from "../src/engine/music";
import { validateShortDefinition } from "../src/engine/validateShort";
import type { ShortDefinition } from "../src/engine/types";
import { root, stageAssets, cleanupStage, bundleShorts, loadChannel, loadContentPackage } from "./project";
import { hash } from "./alignment";

const base: ShortDefinition = { id: "music-fixture", channel: "noskip-learning", title: "Music fixture", topic: "Testing",
  narration: "public/audio/missing-narration.wav", scenes: [
    { id: "hook", type: "explanation", title: "Question", start: 0, end: 2 },
    { id: "reveal", type: "explanation", title: "Answer", start: 2, end: 4 },
  ] };
const configured = (): ShortDefinition => ({ ...base, audio: { music: { file: "public/audio/music.wav" } } });
test("optional music and valid levels/fades; no-music gain unchanged", () => {
  validateShortDefinition(base); validateShortDefinition(configured());
  assert.equal(musicGain(base, 1, 4), 0);
  const short = configured();
  assert(Math.abs(musicGain(short, 1, 4) - 10 ** (-22 / 20)) < 1e-8);
  assert.equal(musicGain(short, 0, 4), 0); assert.equal(musicGain(short, 4, 4), 0);
  short.audio!.music!.changes = [{ sceneId: "reveal", volume: 0.02, transitionSeconds: 0.5 }];
  validateShortDefinition(short);
  assert.equal(musicGain(short, 2, 4), musicGain(short, 1, 4));
  assert(Math.abs(musicGain(short, 2.5, 4) - 0.02) < 1e-8);
});
test("invalid paths, formats, volumes, fades and scene adjustments fail", () => {
  for (const file of ["../x.mp3", "https://host/a.mp3", "public/audio/a.flac", "public/audio/a.mp4"])
    assert.throws(() => validateShortDefinition({ ...base, audio: { music: { file } } }), /audio path/);
  for (const patch of [{ volume: NaN }, { volume: 1.1 }, { volume: -1 }, { fadeInSeconds: 0 },
    { fadeOutSeconds: 5 }, { crossfadeSeconds: -1 }, { crossfadeSeconds: 3 },
    { changes: [{ sceneId: "missing", volume: 0.1 }] },
    { changes: [{ sceneId: "reveal", volume: 0.1, transitionSeconds: 0 }] },
    { changes: [{ sceneId: "reveal", volume: 0.1 }, { sceneId: "hook", volume: 0.1 }] }])
    assert.throws(() => validateShortDefinition({ ...base, audio: { music: { file: "public/audio/music.wav", ...patch } } }));
});
test("short tracks overlap without gaps or gain doubling; long tracks trim", () => {
  const tone = new Int16Array(200).fill(8192);
  const long = loopMusic(tone, 437, 25);
  assert.equal(long.length, 874); assert(long.every((v) => Math.abs(v - 0.25) < 1e-7));
  assert(loopMusic(tone, 50, 25).every((v) => v === 0.25));
  const ramp = new Int16Array(200);
  for (let i = 0; i < 100; i++) ramp[2 * i] = ramp[2 * i + 1] = -16000 + i * 320;
  const smooth = loopMusic(ramp, 437, 25);
  for (let i = 2; i < smooth.length; i += 2) assert(Math.abs(smooth[i] - smooth[i - 2]) < 0.04, "No hard wrap discontinuity");
  assert.throws(() => loopMusic(tone, 437, 60), /crossfade/);
});
test("missing optional asset stages normally and legacy Shorts resolve unchanged", async () => {
  const stage = mkdtempSync(join(root, ".tmp/validate-assets-"));
  try {
    stageAssets([configured()], stage);
    assert(!existsSync(join(stage, musicFiles(base.id).bed)));
    for (let n = 1; n <= 11; n++) {
      const { short } = await loadContentPackage(`short-${String(n).padStart(3, "0")}`);
      assert.equal(short.audio?.music, undefined);
    }
  } finally { cleanupStage(stage); }
});
test("real staged loop and Remotion render cover duration, preserve sources, reserve peak headroom", async () => {
  mkdirSync(join(root, "public/audio"), { recursive: true });
  const sources = mkdtempSync(join(root, "public/audio/music-test-"));
  const stage = mkdtempSync(join(root, ".tmp/validate-assets-"));
  const output = join(stage, "music-smoke.mp4");
  const tone = (seconds: number, frequency: number) => {
    const values = new Int16Array(seconds * 48000 * 2);
    for (let i = 0; i < values.length / 2; i++) values[i * 2] = values[i * 2 + 1] = Math.round(30000 * Math.sin(2 * Math.PI * frequency * i / 48000));
    return pcmWav(values);
  };
  const music = join(sources, "music.wav"), voice = join(sources, "voice.wav");
  writeFileSync(music, tone(1, 330)); writeFileSync(voice, tone(4, 220));
  const before = [hash(readFileSync(music)), hash(readFileSync(voice))];
  const short: ShortDefinition = { ...base, narration: relative(root, voice).replaceAll("\\", "/"),
    audio: { music: { file: relative(root, music).replaceAll("\\", "/"), volume: 0.08,
      fadeInSeconds: 0.4, fadeOutSeconds: 0.5, crossfadeSeconds: 0.1,
      changes: [{ sceneId: "reveal", volume: 0.04 }] } } };
  let browser: Awaited<ReturnType<typeof openBrowser>> | undefined;
  try {
    validateShortDefinition(short); stageAssets([short], stage);
    const bed = readFileSync(join(stage, musicFiles(short.id).bed));
    assert.equal((bed.length - 44) / 4 / 48000, 4);
    assert.equal(bed.readInt16LE(44), 0);
    assert(Math.abs(bed.readInt16LE(bed.length - 2)) <= 1);
    for (const boundary of [0.9, 1.8, 2.7, 3.6]) {
      let energy = 0;
      for (let i = Math.round((boundary - 0.01) * 48000); i < Math.round((boundary + 0.01) * 48000); i++) energy += bed.readInt16LE(44 + i * 4) ** 2;
      assert(energy > 0, "No inserted silence at a loop join");
    }
    const mix = JSON.parse(readFileSync(join(stage, musicFiles(short.id).mix), "utf8"));
    assert(mix.gain > 0 && mix.gain < 1);
    const serveUrl = await bundleShorts(stage);
    browser = await openBrowser("chrome");
    const inputProps = { short, channel: await loadChannel(short.channel) };
    const { short: template } = await loadContentPackage("_template");
    const composition = await selectComposition({ serveUrl, id: template.id, inputProps, puppeteerInstance: browser });
    assert.equal(composition.durationInFrames, 120);
    await renderMedia({ serveUrl, composition, inputProps, outputLocation: output, codec: "h264", concurrency: 2, puppeteerInstance: browser });
    const ffmpeg = join(root, "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
    const result = spawnSync(ffmpeg, ["-hide_banner", "-i", output, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr); const peak = Number(result.stderr.match(/"input_tp"\s*:\s*"([^"]+)"/)?.[1]);
    assert(Number.isFinite(peak) && peak < 0, `Encoded true peak must remain below clipping: ${peak}`);
    console.log(`Music smoke: 1080x1920, 30 FPS, 4s; encoded true peak ${peak} dBTP`);
    assert.deepEqual([hash(readFileSync(music)), hash(readFileSync(voice))], before);
  } finally {
    if (browser) await browser.close({ silent: true });
    cleanupStage(stage);
    assert(relative(join(root, "public/audio"), sources).startsWith("music-test-"));
    rmSync(sources, { recursive: true, force: true });
  }
});
