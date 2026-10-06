import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { hash, parseScript, resolveBeats, validateAlignment, type AlignmentResult } from "./alignment";
import { resolveTiming, resolvePackageTiming, assertFresh } from "./timing";
import type { AuthoredShortDefinition } from "../src/engine/types";

export function validateAlignmentPipeline(root: string) {
  const script = parseScript("[FIRST] [curious] One clear idea. [SECOND] [slowly] Another useful rule.");
  assert.equal(script.text, "one clear idea another useful rule");
  assert.equal(script.scriptHash, parseScript("[FIRST] [confident] One clear idea! [SECOND] Another useful rule.").scriptHash);
  assert.notEqual(script.scriptHash, parseScript("[FIRST] One changed idea. [SECOND] Another useful rule.").scriptHash);
  assert.notEqual(script.scriptHash, parseScript("[DIFFERENT] One clear idea. [SECOND] Another useful rule.").scriptHash);
  assert.throws(() => parseScript("[FIRST] one two three [FIRST] four five six"), /Duplicate/);
  const audio = Buffer.from("test fixture, never production narration");
  const alignment: AlignmentResult = { version: 1, audio: "audio/narration.mp3", audioHash: hash(audio),
    scriptHash: script.scriptHash, duration: 8, language: "en",
    words: script.text.split(" ").map((text, i) => ({ text, start: i + 0.5, end: i + 0.9, confidence: 0.95 })) };
  const beats = resolveBeats(script, alignment);
  assert.equal(beats.beats.SECOND.start, 3.5);
  assert.equal(beats.beats.SECOND.end, 8);
  const noConfidence = structuredClone(alignment);
  noConfidence.words.forEach((w) => delete w.confidence);
  assert.equal(resolveBeats(script, noConfidence).beats.FIRST.confidence, undefined);
  const badWord = structuredClone(alignment);
  badWord.words[0].end = NaN;
  assert.throws(() => validateAlignment(badWord), /Invalid word/);
  const wrong = structuredClone(alignment);
  wrong.words[3].text = "unrelated";
  assert.throws(() => resolveBeats(script, wrong), /Could not reliably align semantic beat SECOND/);
  const weak = structuredClone(alignment);
  weak.words.forEach((w) => w.confidence = 0.1);
  assert.throws(() => resolveBeats(script, weak), /Could not reliably align/);
  assert.throws(() => assertFresh(alignment, beats, hash("different audio"), script.scriptHash), /changed/);
  assert.throws(() => assertFresh(alignment, beats, hash(audio), hash("different script")), /changed/);
  const authored: AuthoredShortDefinition = {
    id: "alignment-test", channel: "test-channel", title: "Test", topic: "Test",
    narration: "content/alignment-test/audio/narration.mp3",
    scenes: [
      { id: "first", type: "hook", title: "First", timing: { from: "FIRST", until: "SECOND" } },
      { id: "second", type: "rule", title: "Second", rows: ["Rule"], timing: { from: "SECOND" } },
    ],
    captions: [{ text: "First", timing: { from: "FIRST" } }, { text: "Second", timing: { from: "SECOND" } }],
  };
  const numeric = resolveTiming(authored, beats);
  assert.equal(numeric.scenes[0].start, 0);
  assert.equal(numeric.scenes[0].end, 3.3);
  assert.equal(numeric.scenes[1].start, 3.3);
  assert.equal(numeric.scenes[1].end, 8);
  assert.equal(numeric.captions![0].startMs, 500);
  assert.equal(numeric.captions![0].endMs, 3500);
  assert(!JSON.stringify(numeric).includes('"timing"'));
  assert.deepEqual(resolveTiming(numeric), numeric); // Legacy contract remains valid.
  for (const timing of [
    { from: "MISSING" }, { from: "SECOND", until: "FIRST" },
    { from: "FIRST", leadMs: NaN }, { from: "FIRST", tailMs: 900 },
  ]) {
    const bad = structuredClone(authored);
    Object.assign(bad.scenes[0], { timing });
    assert.throws(() => resolveTiming(bad, beats));
  }
  const offsets = structuredClone(authored);
  Object.assign(offsets.scenes[0], { timing: { from: "FIRST", until: "SECOND", tailMs: 100 } });
  Object.assign(offsets.scenes[1], { timing: { from: "SECOND", leadMs: 250 } });
  const adjusted = resolveTiming(offsets, beats);
  assert.equal(adjusted.scenes[1].start, 3.35);
  assert.equal(adjusted.scenes[0].end, 3.35);
  const pastEnd = structuredClone(authored);
  Object.assign(pastEnd.scenes[1], { timing: { from: "SECOND", tailMs: 100 } });
  assert.throws(() => resolveTiming(pastEnd, beats), /narration bounds/);
  const broken = structuredClone(beats);
  broken.beats.FIRST.start = -1;
  assert.throws(() => resolveTiming(authored, broken), /Invalid semantic beat/);
  assert.throws(() => resolveTiming(authored), /Missing/);

  // Exercise filesystem stale detection with disposable copies, never the real audio/script.
  mkdirSync(join(root, ".tmp"), { recursive: true });
  const temp = mkdtempSync(join(root, ".tmp", "alignment-test-"));
  try {
    const directory = join(temp, "content/alignment-test");
    mkdirSync(join(directory, "audio"), { recursive: true });
    mkdirSync(join(directory, "generated"));
    writeFileSync(join(directory, "audio/narration.mp3"), audio);
    const scriptText = "[FIRST] One clear idea. [SECOND] Another useful rule.";
    writeFileSync(join(directory, "script.txt"), scriptText);
    assert.throws(() => resolvePackageTiming(authored, directory, temp), /Missing.*Run: npm.cmd run align-short/);
    writeFileSync(join(directory, "generated/alignment.json"), JSON.stringify(alignment));
    writeFileSync(join(directory, "generated/beats.json"), JSON.stringify(beats));
    assert.deepEqual(resolvePackageTiming(authored, directory, temp), numeric);
    writeFileSync(join(directory, "audio/narration.mp3"), "changed fixture");
    assert.throws(() => resolvePackageTiming(authored, directory, temp), /changed since alignment.*align-short/);
    writeFileSync(join(directory, "audio/narration.mp3"), audio);
    writeFileSync(join(directory, "script.txt"), scriptText.replace("clear", "changed"));
    assert.throws(() => resolvePackageTiming(authored, directory, temp), /changed since alignment.*align-short/);
    writeFileSync(join(directory, "script.txt"), scriptText);
    const editedBeats = structuredClone(beats);
    editedBeats.beats.FIRST.end += 0.1;
    writeFileSync(join(directory, "generated/beats.json"), JSON.stringify(editedBeats));
    assert.throws(() => resolvePackageTiming(authored, directory, temp), /do not match/);
  } finally {
    if (resolve(temp, "..") !== resolve(root, ".tmp") || realpathSync(temp) !== temp)
      throw new Error("Unsafe temporary test cleanup path");
    rmSync(temp, { recursive: true, force: true });
  }
  console.log("PASS: semantic anchors, confidence failure, captions, offsets, bounds, legacy numeric timing, missing/stale audio/script alignment, beat integrity.");
}
