import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bundle } from "@remotion/bundler";
import { getCompositions } from "@remotion/renderer";
import { content, video } from "../src/content/unchecked-exception";
import {
  audioV2,
  beats,
  contentV2,
  videoV2,
} from "../src/content/unchecked-exception-v2";
import {
  audioV3,
  audioV3Interactive,
  beatsV3,
  contentV3,
  metadataV3,
  videoV3,
  videoV3Interactive,
} from "../src/content/unchecked-exception-v3";

async function main() {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"));
  assert(
    manifest.scripts.render.includes(
      "JavaUncheckedExceptionV3 out/video_001_v3.mp4",
    ),
    "Default rendering must target V3 and preserve the V1/V2 outputs",
  );
  assert.equal(video.width, 1080);
  assert.equal(video.height, 1920);
  assert.equal(video.fps, 30);
  const seconds = video.durationInFrames / video.fps;
  assert(seconds >= 35 && seconds <= 45);
  for (const text of [
    content.id,
    content.topic,
    content.question,
    content.definition.lead,
    content.definition.emphasis,
    content.definition.action,
    content.exception,
    content.takeaway,
    ...content.hierarchy,
    ...content.examples,
    ...Object.values(content.labels),
  ])
    assert(text.trim().length > 0);
  assert(
    content.code.length > 0 &&
      content.code.some((line) => line.includes("a / b")),
  );
  assert.deepEqual(
    content.scenes.map((s) => s.id),
    ["question", "think", "definition", "code", "hierarchy", "takeaway"],
  );
  let previousEnd = 0;
  for (const scene of content.scenes) {
    assert.equal(scene.start, previousEnd, "Scenes must be contiguous");
    assert(scene.end > scene.start && scene.end <= seconds);
    assert(
      Number.isInteger(scene.start * video.fps) &&
        Number.isInteger(scene.end * video.fps),
    );
    previousEnd = scene.end;
  }
  assert.equal(previousEnd, seconds);
  let captionEnd = 0;
  for (const cue of content.captions) {
    assert(
      cue.startMs >= captionEnd &&
        cue.endMs > cue.startMs &&
        cue.endMs <= seconds * 1000,
    );
    assert(cue.text.trim().length > 0);
    if (cue.emphasis) assert(cue.text.includes(cue.emphasis));
    captionEnd = cue.endMs;
  }
  const serveUrl = await bundle({ entryPoint: "src/index.ts" });
  const compositions = await getCompositions(serveUrl);
  assert.equal(compositions.length, 4);
  for (const config of [video, videoV2, videoV3, videoV3Interactive]) {
    const registered = compositions.find(
      (composition) => composition.id === config.id,
    );
    assert(
      registered,
      "V1, V2, V3 and interactive V3 must actually be registered",
    );
    for (const key of ["width", "height", "fps", "durationInFrames"] as const)
      assert.equal(registered[key], config[key]);
  }
  assert.equal(videoV2.width, 1080);
  assert.equal(videoV2.height, 1920);
  assert.equal(videoV2.fps, 30);
  const v2Seconds = videoV2.durationInFrames / videoV2.fps;
  assert(v2Seconds >= 35 && v2Seconds <= 45);
  assert.equal(v2Seconds, 39);
  assert.deepEqual(
    contentV2.scenes.map((scene) => scene.id),
    ["challenge", "concept", "execution", "hierarchy", "rule"],
  );
  let v2End = 0;
  for (const scene of contentV2.scenes) {
    assert.equal(scene.start, v2End);
    assert(scene.end > scene.start && scene.end <= v2Seconds);
    assert(
      Number.isInteger(scene.start * videoV2.fps) &&
        Number.isInteger(scene.end * videoV2.fps),
    );
    v2End = scene.end;
  }
  assert.equal(v2End, v2Seconds);
  assert(contentV2.code.includes("int b = getValue();"));
  assert(!contentV2.code.join("").includes("10 / 0"));
  assert(contentV2.code.some((line) => line.includes("a / b")));
  for (const text of [
    contentV2.id,
    contentV2.question,
    contentV2.codeContext,
    contentV2.answer,
    contentV2.exception,
    contentV2.why,
    contentV2.concept,
    contentV2.support,
    ...contentV2.choices,
    ...contentV2.execution,
    ...contentV2.rule,
  ])
    assert(text.trim().length > 0);
  let v2CaptionEnd = 0;
  for (const cue of contentV2.captions) {
    assert(
      cue.startMs >= v2CaptionEnd &&
        cue.endMs > cue.startMs &&
        cue.endMs <= v2Seconds * 1000,
    );
    assert(cue.text.length <= 48, "V2 captions must remain short phrases");
    assert(cue.text.includes(cue.emphasis));
    v2CaptionEnd = cue.endMs;
  }
  const beatGroups = [
    [beats.options, beats.answer, beats.runtime],
    [beats.concept, beats.compiler, beats.emphasis, beats.catch, beats.throws],
    beats.execution,
    [...beats.hierarchy, ...beats.examples],
    [...beats.rule, beats.support],
  ];
  beatGroups.forEach((group, index) => {
    const scene = contentV2.scenes[index];
    group.forEach((at, i) => {
      assert(at >= 0 && at < scene.end - scene.start);
      if (i > 0) assert(at > group[i - 1]);
    });
  });
  assert.equal(audioV2.narration, "audio/narration-v2.mp3");
  assert(
    audioV2.volume.narration > audioV2.volume.sfx &&
      audioV2.volume.sfx > audioV2.volume.music,
  );
  for (const cue of audioV2.effects)
    assert(
      cue.at >= 0 && cue.duration > 0 && cue.at + cue.duration <= v2Seconds,
    );
  const v3Seconds = videoV3.durationInFrames / videoV3.fps;
  assert.equal(videoV3.width, 1080);
  assert.equal(videoV3.height, 1920);
  assert.equal(videoV3.fps, 30);
  assert(v3Seconds >= 35 && v3Seconds <= 45);
  assert.deepEqual(contentV3.code, contentV2.code);
  assert.deepEqual(contentV3.hierarchy, contentV2.hierarchy);
  assert.deepEqual(contentV3.rule, contentV2.rule);
  assert.equal(metadataV3.language, "en");
  assert.equal(metadataV3.brand, "NoSkipLearning");
  let v3End = 0;
  const v3BeatGroups = [
    [beatsV3.options, beatsV3.answer, beatsV3.but, beatsV3.runtime],
    [
      beatsV3.concept,
      beatsV3.compiler,
      beatsV3.emphasis,
      beatsV3.catch,
      beatsV3.throws,
    ],
    beatsV3.execution,
    [...beatsV3.hierarchy, ...beatsV3.examples, beatsV3.note],
    [...beatsV3.rule, beatsV3.support, beatsV3.brand],
  ];
  contentV3.scenes.forEach((scene, i) => {
    assert.equal(scene.start, v3End);
    assert(scene.end > scene.start && scene.end <= v3Seconds);
    assert(
      Number.isInteger(scene.start * videoV3.fps) &&
        Number.isInteger(scene.end * videoV3.fps),
    );
    for (const at of v3BeatGroups[i])
      assert(at >= 0 && at < scene.end - scene.start);
    v3End = scene.end;
  });
  assert.equal(v3End, v3Seconds);
  let cueEnd = 0;
  for (const cue of contentV3.captions) {
    assert(
      cue.startMs >= cueEnd &&
        cue.endMs > cue.startMs &&
        cue.endMs <= v3Seconds * 1000,
    );
    assert(cue.text.length <= 48 && cue.text.includes(cue.emphasis));
    assert(
      !/[\u0C00-\u0C7F]|\b(Mee|Mari|enduku|cheyyadu|chuddam|Ippudu|Ivanni|gurthupettukondi)\b/i.test(
        cue.text,
      ),
    );
    assert(!/\b(V[123]|prototype|experiment)\b/i.test(cue.text));
    cueEnd = cue.endMs;
  }
  assert.equal(audioV3.narration, "audio/narration-v3-en.wav");
  assert(
    audioV3.volume.narration > audioV3.volume.sfx && audioV3.volume.music === 0,
  );
  for (const cue of audioV3.effects)
    assert(
      cue.at >= 0 && cue.duration > 0 && cue.at + cue.duration <= v3Seconds,
    );
  console.log(
    `PASS: V1 (41 s), V2 (39 s), V3 (${v3Seconds} s): browser registration, 1080×1920/30 FPS, runtime example, timing, captions, audio and output guards.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
