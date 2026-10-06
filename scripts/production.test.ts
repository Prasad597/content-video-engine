import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { hash, parseScript } from "./alignment";
import { loadContentPackage, root } from "./project";
import { checkExistingNarration, generateNarration, metadataPath, narrationPackage, speechScript, verifyMp3, type NarrationPackage } from "./production/narration";
import { elevenLabsSpeech, ttsConfig } from "./production/elevenlabs";
import { prepareShort, produceShort, regenerationFlag, type Runner } from "./production/workflow";

// No test may accidentally reach a real endpoint, even if the shell has credentials.
globalThis.fetch = async () => { throw new Error("REAL NETWORK FORBIDDEN IN TESTS"); };
const env = { ELEVENLABS_API_KEY: "test-secret", ELEVENLABS_VOICE_ID: "test-voice" };
const source = "[HOOK]\nHello wonderful world.\n[REVEAL]\nThis is Java.";
const quiet = () => {};
let calls = 0;
const success: typeof fetch = async (_url, options) => {
  calls++;
  assert.equal(JSON.parse(String(options?.body)).text.includes("[HOOK]"), false);
  return new Response("mock-mp3", { headers: { "content-type": "audio/mpeg" } });
};
const settings = { env, request: success, verify: quiet, log: quiet };
async function fixture(run: (p: NarrationPackage) => Promise<void>) {
  mkdirSync(join(root, ".tmp"), { recursive: true });
  const directory = mkdtempSync(join(root, ".tmp", "production-test-"));
  const template = await narrationPackage("short-006");
  const p = { ...template, directory, audio: join(directory, "audio/narration.mp3"), script: join(directory, "script.txt"), generated: join(directory, "generated") };
  mkdirSync(join(directory, "audio")); mkdirSync(p.generated);
  writeFileSync(p.script, source);
  try { await run(p); }
  finally {
    assert.ok(!relative(join(root, ".tmp"), directory).startsWith(".."));
    rmSync(directory, { recursive: true, force: true });
  }
}
test("script cleaning reuses sections and preserves spoken text", () => {
  assert.equal(speechScript("[HOOK]\nHello world.\n\n[REVEAL]\nThis is Java.").text, "Hello world.\n\nThis is Java.");
  assert.equal(speechScript("[HOOK]\n[curious]Is equals() TRUE?").text, "Is equals() TRUE?");
  for (const bad of ["", "[HOOK]", "[curious]", "Hello world", "[HOOK]\nHello [BROKEN", "[HOOK]\nOne two three\n[HOOK]\nFour five six", "[Bad_Tag]\nHello world"])
    assert.throws(() => speechScript(bad));
  assert.throws(() => parseScript("[HOOK] Hello world."), /at least 3/);
});
test("existing audio refuses without credentials or a request", async () => fixture(async (p) => {
  writeFileSync(p.audio, "old"); const before = calls;
  await assert.rejects(generateNarration(p, false, { ...settings, env: {} }), /No credits were consumed/);
  assert.equal(calls, before); assert.equal(readFileSync(p.audio, "utf8"), "old");
}));
test("explicit regeneration validates then replaces audio and metadata", async () => fixture(async (p) => {
  writeFileSync(p.audio, "old");
  let verified = false;
  await generateNarration(p, regenerationFlag("true"), { ...settings, verify: () => { assert.equal(readFileSync(p.audio, "utf8"), "old"); verified = true; } });
  assert.ok(verified); assert.equal(readFileSync(p.audio, "utf8"), "mock-mp3");
  const metadata = readFileSync(metadataPath(p), "utf8");
  assert.ok(!metadata.includes(env.ELEVENLABS_API_KEY));
  assert.equal(JSON.parse(metadata).audioHash, hash("mock-mp3"));
  assert.equal(checkExistingNarration(p), "reused");
  assert.equal(existsSync(join(p.generated, "narration.lock")), false);
  assert.throws(() => regenerationFlag("yes")); assert.equal(regenerationFlag(), false);
}));
test("failed regeneration preserves old audio and metadata", async () => fixture(async (p) => {
  await generateNarration(p, false, settings);
  const oldMeta = readFileSync(metadataPath(p), "utf8");
  await assert.rejects(generateNarration(p, true, { ...settings, request: async () => { throw new Error("test-secret"); } }), /network/);
  assert.equal(readFileSync(p.audio, "utf8"), "mock-mp3"); assert.equal(readFileSync(metadataPath(p), "utf8"), oldMeta);
  await assert.rejects(generateNarration(p, true, { ...settings, verify: () => { throw new Error("Invalid MP3"); } }), /Invalid MP3/);
  assert.equal(readFileSync(metadataPath(p), "utf8"), oldMeta);
}));
test("missing credentials fail before requests", async () => fixture(async (p) => {
  const before = calls;
  for (const config of [{}, { ELEVENLABS_API_KEY: "test-secret" }])
    await assert.rejects(generateNarration(p, false, { ...settings, env: config }), /ELEVENLABS_/);
  assert.equal(calls, before); assert.equal(existsSync(p.audio), false);
}));
test("provider failures are actionable and never echo response secrets", async () => {
  for (const [status, expected] of [[401, /Authentication/], [402, /credits/], [429, /limit/], [500, /provider/]] as const) {
    await assert.rejects(elevenLabsSpeech("Hello", ttsConfig(env), async () => new Response("test-secret", { status })), (e: Error) => expected.test(e.message) && !e.message.includes("test-secret"));
  }
  await assert.rejects(elevenLabsSpeech("Hello", ttsConfig(env), async () => new Response(JSON.stringify({ detail: { status: "quota_exceeded" } }), { status: 401 })), /credits/);
  await assert.rejects(elevenLabsSpeech("Hello", ttsConfig(env), async () => new Response("oops")), /non-MP3/);
  await assert.rejects(elevenLabsSpeech("Hello", ttsConfig(env), async () => new Response("", { headers: { "content-type": "audio/mpeg" } })), /empty/);
});
test("stale script or audio refuses preparation before alignment", async () => fixture(async (p) => {
  await generateNarration(p, false, settings);
  let aligned = false; const run: Runner = () => { aligned = true; };
  // Punctuation-only edits are invisible to alignment normalization but matter to TTS.
  writeFileSync(p.script, source.replace("world.", "world!"));
  await assert.rejects(prepareShort(p, run), /stale audio/); assert.equal(aligned, false);
  writeFileSync(p.script, source); writeFileSync(p.audio, "changed");
  await assert.rejects(prepareShort(p, run), /stale audio/); assert.equal(aligned, false);
}));
test("script changes during request cannot replace narration", async () => fixture(async (p) => {
  writeFileSync(p.audio, "old");
  await assert.rejects(generateNarration(p, true, { ...settings, request: async (...args) => { writeFileSync(p.script, source + " Changed."); return success(...args); } }), /Script changed/);
  assert.equal(readFileSync(p.audio, "utf8"), "old");
}));
test("commit filesystem failure preserves old audio and blocks incomplete state", async () => fixture(async (p) => {
  writeFileSync(p.audio, "old");
  await assert.rejects(generateNarration(p, true, { ...settings, request: async (...args) => {
    mkdirSync(metadataPath(p)); // Simulate another process blocking metadata commit.
    return success(...args);
  } }));
  assert.equal(readFileSync(p.audio, "utf8"), "old");
  assert.throws(() => checkExistingNarration(p), /Incomplete narration transaction/);
}));
test("concurrent generation cannot send a second request", async () => fixture(async (p) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  let started!: () => void;
  const inRequest = new Promise<void>((resolve) => { started = resolve; });
  const first = generateNarration(p, false, { ...settings, request: async (...args) => { started(); await waiting; return success(...args); } });
  await inRequest;
  try { await assert.rejects(generateNarration(p, false, settings), /locked/); }
  finally { release(); await first; }
}));
test("prepare stops on generation failure; manual audio needs no provider metadata", async () => fixture(async (p) => {
  const steps: string[] = []; const run: Runner = (step) => { steps.push(step); };
  await assert.rejects(prepareShort(p, run, async () => { throw new Error("generation failed"); }), /generation failed/);
  assert.deepEqual(steps, []);
  writeFileSync(p.audio, "manual");
  assert.match(await prepareShort(p, run), /manual/); assert.deepEqual(steps, ["align-short"]);
  writeFileSync(join(p.generated, "alignment.json"), JSON.stringify({ scriptHash: parseScript(source).scriptHash, audioHash: hash("manual") }));
  await prepareShort(p, run);
  writeFileSync(p.script, source + " Changed.");
  await assert.rejects(prepareShort(p, run), /Manual narration/);
}));
test("prepare generates before invoking existing alignment", async () => fixture(async (p) => {
  const events: string[] = [];
  await prepareShort(p, (step) => { assert.ok(existsSync(p.audio)); events.push(step); }, async (pkg) => { events.push("generate"); return generateNarration(pkg, false, settings); });
  assert.deepEqual(events, ["generate", "align-short"]);
}));
test("produce stops at failed typecheck/validation and preserves error", () => {
  for (const fail of ["typecheck", "validate", "none"]) {
    const steps: string[] = []; const error = new Error("original failure");
    const run: Runner = (step) => { steps.push(step); if (step === fail) throw error; };
    if (fail === "none") produceShort("short-006", run);
    else assert.throws(() => produceShort("short-006", run), (e) => e === error);
    assert.deepEqual(steps, fail === "typecheck" ? ["typecheck"] : fail === "validate" ? ["typecheck", "validate"] : ["typecheck", "validate", "render-short"]);
  }
});
test("lock/filesystem failures happen before any request", async () => fixture(async (p) => {
  const before = calls;
  writeFileSync(join(p.generated, "narration.lock"), "");
  await assert.rejects(generateNarration(p, false, settings), /locked/);
  assert.equal(calls, before);
  rmSync(join(p.generated, "narration.lock"));
  mkdirSync(metadataPath(p)); // Cannot read metadata as a file: lock must still be released.
  await assert.rejects(generateNarration(p, false, settings));
  assert.equal(calls, before); assert.equal(existsSync(join(p.generated, "narration.lock")), false);
}));
test("existing Short 006 resolves unchanged without TTS metadata; MP3 validation works", async () => {
  const p = await narrationPackage("short-006");
  assert.equal(existsSync(metadataPath(p)), false);
  assert.match(checkExistingNarration(p), /manual/);
  assert.ok((await loadContentPackage("short-006")).short.scenes.length > 0);
  verifyMp3(p.audio);
  await fixture(async (p) => { writeFileSync(p.audio, "not audio"); assert.throws(() => verifyMp3(p.audio), /validation/); });
  await assert.rejects(narrationPackage("../outside"));
  await assert.rejects(narrationPackage("short-does-not-exist"));
});
