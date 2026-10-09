import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { hash, parseScript } from "./alignment";
import { approveTiming, verifyTimingApproval, type TimingProposal } from "./manual-timing";
import { resolvePackageTiming } from "./timing";
import type { AuthoredShortDefinition } from "../src/engine/types";

const script = "[FIRST] One clear idea. [SECOND] Another useful rule.";
const audio = Buffer.from("synthetic unit test, not narration");
const evidence = { script, audio: "audio/narration.mp3", audioHash: hash(audio) };
const proposal: TimingProposal = { version: 1, source: "manual-proposal", scriptFileHash: hash(script),
  timing: { version: 1, audio: evidence.audio, audioHash: evidence.audioHash,
    scriptHash: parseScript(script).scriptHash, duration: 8, language: "en",
    beats: { FIRST: { start: 0.14, end: 4 }, SECOND: { start: 4, end: 8 } } } };
const consent = { approved: true, reviewer: "unit-test-fixture", at: "2026-10-08T00:00:00Z" };

test("manual proposal requires explicit approval; no ASR confidence is fabricated", () => {
  assert.throws(() => approveTiming(proposal, evidence, 8, { ...consent, approved: false }), /Explicit/);
  assert.throws(() => approveTiming(proposal, evidence, 8, { ...consent, reviewer: " " }), /Explicit/);
  const approved = approveTiming(proposal, evidence, 8, consent);
  assert.equal(approved.source, "human-reviewed");
  assert.equal(proposal.source, "manual-proposal");
  assert.deepEqual(verifyTimingApproval(approved, proposal.timing, evidence), proposal.timing);
  assert.throws(() => verifyTimingApproval(proposal as never, proposal.timing, evidence), /approval record/);
});
test("manual approval rejects stale audio, raw/normalized script, paths and changed beats", () => {
  const approved = approveTiming(proposal, evidence, 8, consent);
  for (const altered of [{ ...evidence, audioHash: hash("different") },
    { ...evidence, script: script + " " }, { ...evidence, script: script.replace("clear", "new") },
    { ...evidence, audio: "audio/other.mp3" }])
    assert.throws(() => verifyTimingApproval(approved, proposal.timing, altered), /Stale/);
  const changed = structuredClone(proposal.timing); changed.beats.FIRST.start = 0.2;
  assert.throws(() => verifyTimingApproval(approved, changed, evidence), /differ/);
  assert.throws(() => approveTiming(proposal, evidence, 7.99, consent), /measured/);
});
test("manual boundaries enforce exact marker correspondence, order, positive durations and bounds", () => {
  const mutations: ((p: TimingProposal) => void)[] = [
    (p) => { p.timing.beats.FIRST.start = -1; },
    (p) => { p.timing.beats.FIRST.start = NaN; },
    (p) => { p.timing.beats.FIRST.end = 0.14; },
    (p) => { p.timing.beats.FIRST.end = 4.1; },
    (p) => { p.timing.beats.SECOND.end = 9; },
    (p) => { p.timing.beats.SECOND.end = 7; },
    (p) => { p.timing.beats.SECOND.start = 0; },
    (p) => { delete p.timing.beats.SECOND; },
    (p) => { p.timing.beats.EXTRA = { start: 6, end: 8 }; },
    (p) => { p.timing.beats = { SECOND: p.timing.beats.SECOND, FIRST: p.timing.beats.FIRST }; },
    (p) => { p.timing.beats.FIRST.confidence = 1; },
  ];
  for (const mutate of mutations) {
    const p = structuredClone(proposal); mutate(p);
    assert.throws(() => approveTiming(p, evidence, 8, consent), /Invalid manual beat|semantic markers/);
  }
});
test("package loader uses approved timing; missing approval cannot bypass automatic alignment", async () => {
  const workspace = process.cwd(), root = mkdtempSync(join(workspace, ".tmp/manual-timing-test-"));
  const fixture = join(root, "content/manual-test");
  try {
    mkdirSync(join(fixture, "audio"), { recursive: true }); mkdirSync(join(fixture, "generated"));
    writeFileSync(join(fixture, "audio/narration.mp3"), audio);
    writeFileSync(join(fixture, "script.txt"), script);
    writeFileSync(join(fixture, "generated/beats.json"), JSON.stringify(proposal.timing));
    const short: AuthoredShortDefinition = { id: "manual-test", channel: "noskip-learning", title: "Test", topic: "Test",
      narration: relative(root, join(fixture, "audio/narration.mp3")).replaceAll("\\", "/"), scenes: [
        { id: "first", type: "explanation", timing: { from: "FIRST", until: "SECOND" }, title: "First", reveals: [] },
        { id: "second", type: "explanation", timing: { from: "SECOND" }, title: "Second", reveals: [] },
      ] };
    assert.throws(() => resolvePackageTiming(short, fixture, root), /Missing alignment/);
    writeFileSync(join(fixture, "generated/manual-timing.json"), JSON.stringify(approveTiming(proposal, evidence, 8, consent)));
    const resolved = resolvePackageTiming(short, fixture, root);
    assert.equal(resolved.scenes[0].start, 0); assert.equal(resolved.scenes[1].start, 3.8);
    assert.equal(resolved.scenes[1].end, 8);
    writeFileSync(join(fixture, "script.txt"), script + " ");
    assert.throws(() => resolvePackageTiming(short, fixture, root), /Stale manual/);
  } finally {
    assert(relative(join(workspace, ".tmp"), root).startsWith("manual-timing-test-"));
    rmSync(root, { recursive: true, force: true });
  }
});
