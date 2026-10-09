import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { join, relative } from "node:path";
import { hash, LowConfidenceAlignmentError, parseScript, resolveBeats, type AlignmentResult } from "./alignment";
import { estimateTiming, reviewProposal, writeEstimatedTiming, PREVIEW_FILE } from "./preview-timing";
import { approveTiming } from "./manual-timing";
import { resolvePackageTiming, resolveTiming } from "./timing";
import { validatePublishingAssets, validateShortDefinition } from "../src/engine/validateShort";
import { writePublishingAssets } from "./production/publishing";
import type { ShortDefinition } from "../src/engine/types";
import { bundleShorts, stageAssets, loadChannel, cleanupStage, root } from "./project";
import { openBrowser, selectComposition, renderMedia } from "@remotion/renderer";

const script = "[HOOK] One clear idea. [RULE] Another useful rule.";
const audio = Buffer.from("unit-test audio, never real narration");
const evidence = { script, audio: "audio/narration.mp3", audioHash: hash(audio) };
const parsed = parseScript(script);
const measured: AlignmentResult = { version: 1, audio: evidence.audio, audioHash: evidence.audioHash,
  scriptHash: parsed.scriptHash, duration: 8, language: "en",
  words: parsed.text.split(" ").map((text,i) => ({ text, start: i + 0.1, end: i + 0.6, confidence: 0.95 })) };
test("strict confidence is unchanged; estimates are deterministic bounded suggestions", () => {
  assert.equal(resolveBeats(parsed, measured).beats.HOOK.start, 0.1);
  const weak = structuredClone(measured); weak.words.forEach(w => w.confidence = 0.1);
  assert.throws(() => resolveBeats(parsed, weak), (error) =>
    error instanceof LowConfidenceAlignmentError && /Could not reliably align/.test(error.message));
  const a = estimateTiming(evidence, 8, "low confidence");
  assert.deepEqual(a, estimateTiming(evidence, 8, "low confidence"));
  assert.deepEqual(a.timing.beats, { HOOK: { start: 0, end: 4 }, RULE: { start: 4, end: 8 } });
  assert.equal(a.publishable, false); assert.equal(a.timing.publishable, false);
  assert.throws(() => estimateTiming(evidence, NaN, "failure"), /duration/);
});
test("ambiguous, malformed and insufficient recognition evidence is never fallback-eligible", () => {
  const ambiguousScript = parseScript("[HOOK] One clear idea.");
  const phrase = ambiguousScript.text.split(" ");
  const duplicate: AlignmentResult = { ...measured, scriptHash: ambiguousScript.scriptHash,
    words: [...phrase, ...phrase].map((text, i) => ({ text, start: i * 0.2, end: i * 0.2 + 0.1, confidence: 0.2 })) };
  assert.throws(() => resolveBeats(ambiguousScript, duplicate), (error) =>
    !(error instanceof LowConfidenceAlignmentError) && /Ambiguous semantic beat/.test((error as Error).message));

  const malformed = structuredClone(measured);
  malformed.words[0].start = Number.NaN;
  assert.throws(() => resolveBeats(parsed, malformed), (error) =>
    !(error instanceof LowConfidenceAlignmentError) && /Invalid word timestamp/.test((error as Error).message));

  const insufficient = structuredClone(measured);
  insufficient.words[0].text = "unrelated";
  insufficient.words.forEach((word) => { word.confidence = 0.1; });
  assert.throws(() => resolveBeats(parsed, insufficient), (error) =>
    !(error instanceof LowConfidenceAlignmentError) && /Could not reliably align/.test((error as Error).message));
});
test("missing/invalid provenance, stale evidence and invalid intervals cannot be previewed", () => {
  const a = estimateTiming(evidence, 8, "failure");
  for (const mutate of [(x:any) => delete x.mode, (x:any) => x.publishable=true,
    (x:any) => delete x.timing.publishable, (x:any) => x.timing.beats.HOOK.end=5,
    (x:any) => x.timing.beats.RULE.end=9, (x:any) => x.scriptFileHash=hash("changed")]) {
    const bad = structuredClone(a); mutate(bad);
    assert.throws(() => reviewProposal(bad, evidence));
  }
  assert.throws(() => reviewProposal(a, { ...evidence, audioHash: hash("new") }), /Stale/);
  assert.throws(() => reviewProposal(a, { ...evidence, script: script + " " }), /Stale/);
  assert.throws(() => approveTiming(a as never, evidence, 8, { approved: true, reviewer: "test" }), /unapproved manual proposal/);
  assert.throws(() => approveTiming(reviewProposal(a,evidence), evidence, 8, { approved: false, reviewer: "test" }), /Explicit/);
});
test("preview provenance fails centralized publishing validation and artifact generation", async () => {
  const short = { id: "test", timingProvenance: { mode: "preview-estimated", publishable: false } } as unknown as ShortDefinition;
  assert.throws(() => validatePublishingAssets(short), /not publishable/);
  assert.throws(() => validateShortDefinition({ ...short, title: "Test", topic: "test", channel: "noskip-learning", narration: "public/audio/test.wav" }), /not publishable/);
  await assert.rejects(writePublishingAssets(short, {} as never, "unused"), /not publishable/);
});
test("semantic scenes/captions resolve for preview, and labelled preview composition renders", async () => {
  const estimated=estimateTiming(evidence, 1, "unit fixture failure");
  const resolved=resolveTiming({ id:"preview-test",channel:"noskip-learning",title:"Preview test",topic:"test",narration:"public/audio/missing-preview-test.wav",
    scenes:[{id:"hook",type:"explanation",title:"Estimated hook",timing:{from:"HOOK",until:"RULE"}},
      {id:"rule",type:"explanation",title:"Estimated rule",timing:{from:"RULE"}}],
    captions:[{timing:{from:"RULE"},text:"Review this rule",emphasis:"rule"}],
  },reviewProposal(estimated,evidence).timing);
  assert.equal(resolved.captions![0].startMs,500);
  const short={...resolved,timingProvenance:{mode:"preview-estimated",publishable:false}};
  assert.throws(()=>validateShortDefinition(short),/not publishable/);
  const stage=mkdtempSync(join(root,".tmp/validate-assets-"));
  const browser=await openBrowser("chrome");
  try {
    const serveUrl=await bundleShorts(stageAssets([short],stage),true);
    const inputProps={short,channel:await loadChannel(short.channel)};
    const composition=await selectComposition({serveUrl,id:"preview-estimated",inputProps,puppeteerInstance:browser});
    assert.equal(composition.durationInFrames,30);assert.equal(composition.width,1080);assert.equal(composition.height,1920);
    await renderMedia({serveUrl,composition,inputProps,codec:"h264",concurrency:2,puppeteerInstance:browser,outputLocation:join(stage,"preview-only.mp4")});
    assert(readFileSync(join(stage,"preview-only.mp4")).length>1000);
  } finally {await browser.close({silent:true});cleanupStage(stage);}
});
test("separate preview writes preserve approved artifacts; renamed/stripped previews cannot enter production; explicit approval works", () => {
  const workspace=process.cwd(), root=mkdtempSync(join(workspace,".tmp/preview-timing-test-")), dir=join(root,"content/test");
  const generated=join(dir,"generated");mkdirSync(generated,{recursive:true});mkdirSync(join(dir,"audio"));
  const short: ShortDefinition = { id:"test",channel:"noskip-learning",title:"Test",topic:"test",narration:"content/test/audio/narration.mp3",
    scenes:[{id:"scene",type:"explanation",title:"Test",start:0,end:8}] };
  try {
    writeFileSync(join(dir,"script.txt"),script);writeFileSync(join(dir,"audio/narration.mp3"),audio);
    writeFileSync(join(generated,"beats.json"),"sentinel measured beats");writeFileSync(join(generated,"manual-timing.json"),"sentinel approval");
    const a=estimateTiming(evidence,8,"failure");writeEstimatedTiming(generated,a);
    assert.equal(readFileSync(join(generated,"beats.json"),"utf8"),"sentinel measured beats");
    assert.equal(readFileSync(join(generated,"manual-timing.json"),"utf8"),"sentinel approval");
    unlinkSync(join(generated,"manual-timing.json"));unlinkSync(join(generated,"beats.json"));
    assert.throws(()=>resolvePackageTiming(short,dir,root),/not publishable/);
    const weak=structuredClone(measured);weak.words.forEach(w=>w.confidence=0.1);
    writeFileSync(join(generated,"alignment.json"),JSON.stringify(weak));
    for(const renamed of [a,a.timing,reviewProposal(a,evidence).timing]) {
      writeFileSync(join(generated,"beats.json"),JSON.stringify(renamed));
      assert.throws(()=>resolvePackageTiming(short,dir,root));
    }
    unlinkSync(join(generated,PREVIEW_FILE)); // Renaming must not evade the gate.
    assert.throws(()=>resolvePackageTiming(short,dir,root),/Could not reliably align/);
    const approval=approveTiming(reviewProposal(a,evidence),evidence,8,{approved:true,reviewer:"unit-test fixture"});
    writeFileSync(join(generated,"manual-timing.json"),JSON.stringify(approval));
    writeFileSync(join(generated,"beats.json"),JSON.stringify(approval.timing));
    assert.equal(resolvePackageTiming(short,dir,root).scenes[0].end,8);
  } finally { assert(relative(join(workspace,".tmp"),root).startsWith("preview-timing-test-"));rmSync(root,{recursive:true,force:true}); }
});
