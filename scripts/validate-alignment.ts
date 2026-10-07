import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { hash, parseScript, recoverWordTimestamps, resolveBeats, validateAlignment, type AlignmentResult } from "./alignment";
import { resolveTiming, resolvePackageTiming, assertFresh } from "./timing";
import type { AuthoredShortDefinition } from "../src/engine/types";

export function validateAlignmentPipeline(root: string) {
  validateTimestampRecovery();
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
  // An exact phrase spoken twice has two equally good boundaries. Never pick
  // the first solely because the LCS traversal happens to encounter it first.
  const repeatedScript = parseScript("[FIRST] One clear idea.");
  const repeated = { ...alignment, scriptHash: repeatedScript.scriptHash,
    words: [...alignment.words.slice(0, 3), ...alignment.words.slice(0, 3).map((w) => ({ ...w, start: w.start + 3, end: w.end + 3 }))] };
  assert.throws(() => resolveBeats(repeatedScript, repeated), /Ambiguous semantic beat FIRST.*0.500s.*3.500s/);
  const contextualScript = parseScript("[FIRST] One clear idea. [SECOND] One useful rule.");
  const contextual = { ...alignment, scriptHash: contextualScript.scriptHash,
    words: alignment.words.map((w, i) => ({ ...w, text: contextualScript.text.split(" ")[i] })) };
  assert.equal(resolveBeats(contextualScript, contextual).beats.SECOND.start, 3.5);
  // Real HOOK probabilities: perfect lexical coverage must not bypass 0.6.
  const hookScript = parseScript("[HOOK] We modify two Java lists.");
  const probabilities = [0.12196845561265945, 0.16885587573051453, 0.8122745156288147, 0.0687926709651947, 0.972908079624176];
  const hook = { ...alignment, scriptHash: hookScript.scriptHash,
    words: hookScript.text.split(" ").map((text, i) => ({ text, start: i * 0.2, end: i * 0.2 + 0.1, confidence: probabilities[i] })) };
  assert.throws(() => resolveBeats(hookScript, hook), /coverage 1.000.*confidence 0.428960 \(minimum 0.6\)/);
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

export function validateTimestampRecovery() {
  const script = parseScript("[CHECK] the iterator works over a snapshot of the array");
  const base: AlignmentResult = { version: 1, audio: "audio/narration.mp3", audioHash: hash("fixture"), scriptHash: script.scriptHash,
    duration: 3, language: "en", words: script.text.split(" ").map((text, i) => ({ text, start: i * 0.2, end: i * 0.2 + 0.1, confidence: 0.95 })) };
  const original = structuredClone(base);
  const logs: string[] = [];
  assert.equal(recoverWordTimestamps(base, (s) => logs.push(s)), base);
  assert.deepEqual(base, original); assert.equal(logs.length, 0);
  for (const value of [NaN, Infinity, undefined, null, -1, 10]) {
    const broken = structuredClone(base);
    // Model the untrusted JSON boundary, including missing/null timestamps.
    broken.words[1].start = value as number;
    const recovered = recoverWordTimestamps(broken, (s) => logs.push(s));
    assert.equal(recovered.words[1].start, base.words[0].end);
    assert.equal(recovered.words[1].end, base.words[2].start);
    assert.deepEqual(recovered.words.filter((_, i) => i !== 1), base.words.filter((_, i) => i !== 1));
    assert.equal(broken.words[1].start, value); // Input is not mutated.
    validateAlignment(recovered); resolveBeats(script, recovered);
  }
  assert.ok(logs.every((s) => s.includes("iterator (index 1)")));
  const run = structuredClone(base);
  for (const i of [3, 4, 5]) run.words[i].end = NaN;
  const recoveredRun = recoverWordTimestamps(run, () => {});
  assert.deepEqual(recoveredRun, recoverWordTimestamps(run, () => {}));
  assert.equal(recoveredRun.words[3].start, base.words[2].end);
  assert.equal(recoveredRun.words[5].end, base.words[6].start);
  for (const i of [3, 4]) assert.equal(recoveredRun.words[i].end, recoveredRun.words[i + 1].start);
  validateAlignment(recoveredRun);
  const backwards = structuredClone(base);
  backwards.words[1].end = NaN; backwards.words[2].start = 0.05;
  assert.throws(() => recoverWordTimestamps(backwards), /non-monotonic valid neighbors/);
  for (const i of [0, base.words.length - 1]) {
    const edge = structuredClone(base); edge.words[i].end = NaN;
    assert.throws(() => recoverWordTimestamps(edge), /missing valid previous\/following/);
  }
  const extensive = structuredClone(base);
  for (const i of [1, 2, 3, 4]) extensive.words[i].end = NaN;
  assert.throws(() => recoverWordTimestamps(extensive), /too many invalid words/);
  const pause = structuredClone(base);
  pause.words[1].end = NaN;
  pause.words.slice(2).forEach((w) => { w.start += 1; w.end += 1; });
  assert.throws(() => recoverWordTimestamps(pause), /at most 1 second/);
  // Actual Generation 1 neighborhood: retain the point without inventing duration.
  const actual = { ...base, duration: 49.711, words: [
    { text: "the", start: 29.92, end: 30.24, confidence: 0.2997682988643646 },
    { text: "iterator", start: 30.24, end: 30.24, confidence: 0.21810570359230042 },
    { text: "was", start: 30.24, end: 30.54, confidence: 0.9855942130088806 },
  ] };
  assert.equal(recoverWordTimestamps(actual, () => {}), actual);
  const pointScript = parseScript("[CHECK] the iterator was");
  assert.throws(() => resolveBeats(pointScript, { ...actual, scriptHash: pointScript.scriptHash }), /Could not reliably align semantic beat CHECK/);
  // Generation 2 class: point-only repetition preceding the measured phrase.
  const duplicate = structuredClone(base);
  duplicate.words.splice(4, 0, ...["a", "snapshot", "of", "the", "array"].map((text) => ({ text, start: 0.8, end: 0.8, confidence: 0.01 })));
  assert.deepEqual(resolveBeats(script, recoverWordTimestamps(duplicate, () => {})), resolveBeats(script, base));
  assert.deepEqual(duplicate.words.slice(4, 9).map((w) => w.start), [0.8, 0.8, 0.8, 0.8, 0.8]);
  const missingBoundary = structuredClone(base); missingBoundary.words[1].end = missingBoundary.words[1].start;
  const boundaryScript = parseScript("[BEFORE] the iterator works [AFTER] over a snapshot of the array");
  missingBoundary.scriptHash = boundaryScript.scriptHash;
  assert.throws(() => resolveBeats(boundaryScript, missingBoundary), /Could not reliably align semantic beat BEFORE/);
  const obscuredBoundary = structuredClone(base);
  obscuredBoundary.scriptHash = boundaryScript.scriptHash;
  obscuredBoundary.words[3].end = obscuredBoundary.words[3].start;
  assert.throws(() => resolveBeats(boundaryScript, obscuredBoundary), /Could not reliably align semantic beat AFTER.*opening word unavailable/);
  const pointEdge = structuredClone(base); pointEdge.words[0].end = pointEdge.words[0].start;
  assert.throws(() => recoverWordTimestamps(pointEdge), /zero-duration region/);
  const longPoints = structuredClone(duplicate); longPoints.words.slice(9).forEach((w) => { w.start += 1; w.end += 1; });
  assert.throws(() => recoverWordTimestamps(longPoints), /zero-duration region/);
  const pointRegression = structuredClone(base); pointRegression.words[1].start = pointRegression.words[1].end = 0.05;
  assert.throws(() => recoverWordTimestamps(pointRegression), /non-monotonic/);
  const weak = structuredClone(base);
  weak.words[1].end = NaN; weak.words.forEach((w) => w.confidence = 0.1);
  assert.throws(() => resolveBeats(script, recoverWordTimestamps(weak, () => {})), /Could not reliably align semantic beat CHECK/);
  const wrong = structuredClone(base);
  wrong.words[1].end = NaN; wrong.words[0].text = "unrelated";
  assert.throws(() => resolveBeats(script, recoverWordTimestamps(wrong, () => {})), /Could not reliably align semantic beat CHECK/);
  const badConfidence = structuredClone(base); badConfidence.words[1].confidence = NaN;
  assert.throws(() => recoverWordTimestamps(badConfidence), /confidence/);
  console.log("PASS: bounded timestamp recovery, unchanged valid words, invalid runs, fatal bounds/budget/confidence, actual zero-width iterator fixture.");
}
