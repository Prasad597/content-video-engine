import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  getCompositions,
  renderStill,
  renderMedia,
  openBrowser,
} from "@remotion/renderer";
import {
  listContent,
  loadShort,
  loadContentPackage,
  prepareOutput,
  loadChannel,
  root,
  stageAssets,
  bundleShorts,
  resolveAudio,
} from "./project";
import { cleanupStage } from "./project";
import {
  validateShortDefinition,
  validateAssetPath,
  validateChannel,
} from "../src/engine/validateShort";
import {
  secondsToFrames,
  sceneDuration,
  sceneStart,
  sceneEnd,
  durationFrames,
} from "../src/engine/timeline";
import type { ShortDefinition } from "../src/engine/types";

async function main() {
  const ids = listContent();
  const packages = await Promise.all(ids.map(loadContentPackage));
  const shorts = packages.map((content) => content.short);
  packages.forEach((content, index) => {
    assert.equal(content.directory, join(root, "content", ids[index]));
    assert.equal(prepareOutput(content), join(content.directory, "output", `${content.short.id}.mp4`));
    assert(statSync(join(content.directory, "output")).isDirectory());
  });
  for (const short of shorts) {
    validateShortDefinition(short);
    await loadChannel(short.channel);
    resolveAudio(short.narration);
  }
  const template = await loadShort("_template");
  for (const mutate of [
    (s: ShortDefinition) => {
      s.scenes[0].start = -1;
    },
    (s: ShortDefinition) => {
      s.scenes[0].end = NaN;
    },
    (s: ShortDefinition) => {
      s.scenes[1].start = s.scenes[0].end - 1;
    },
    (s: ShortDefinition) => {
      s.scenes[1].id = s.scenes[0].id;
    },
    (s: ShortDefinition) => {
      s.captions = [{ startMs: 1, endMs: 0, text: "bad" }];
    },
    (s: ShortDefinition) => {
      s.narration = "../private.wav";
    },
    (s: ShortDefinition) => {
      s.scenes[0] = {
        id: "bad",
        type: "code",
        start: 0,
        end: 7,
        code: ["x"],
        activeLine: 5,
      };
    },
  ]) {
    const bad = structuredClone(template);
    mutate(bad);
    assert.throws(() => validateShortDefinition(bad));
  }
  for (const path of [
    "../x.wav",
    "https://example.com/a.wav",
    "C:/audio.wav",
    "content/x/../y.wav",
    "content/x/audio/narration.txt",
  ])
    assert.throws(() => validateAssetPath(path));
  assert.equal(secondsToFrames(1.5), 45);
  const fractional = { start: 0.016, end: 0.05 };
  assert.equal(
    sceneStart(fractional) + sceneDuration(fractional),
    sceneEnd(fractional),
  );
  assert.equal(sceneDuration(fractional), 2);
  assert.throws(() => validateChannel({ id: "bad" } as never));
  mkdirSync(join(root, ".tmp"), { recursive: true });
  const stage = mkdtempSync(join(root, ".tmp", "validate-assets-"));
  const browser = await openBrowser("chrome");
  try {
    // A differently named package/channel must use the resolved directory, not its ID or channel.
    const packageDirectory = join(stage, "resolved-package");
    assert(!existsSync(join(packageDirectory, "output")));
    const output = prepareOutput({
      directory: packageDirectory,
      short: { ...template, id: "gate-short-001", channel: "another-channel" },
    });
    assert.equal(output, join(packageDirectory, "output", "gate-short-001.mp4"));
    assert(statSync(join(packageDirectory, "output")).isDirectory());
    const silentTemplate = { ...template, narration: "content/_template/audio/validation-missing.wav", audio: undefined };
    assert(!existsSync(resolveAudio(silentTemplate.narration)));
    stageAssets([silentTemplate], stage);
    assert(!existsSync(join(stage, silentTemplate.narration)));
    const serveUrl = await bundleShorts(stageAssets(shorts, stage));
    const compositions = await getCompositions(serveUrl, {
      puppeteerInstance: browser,
    });
    assert.equal(compositions.length, shorts.length);
    for (const short of shorts) {
      const composition = compositions.find((c) => c.id === short.id);
      assert(composition);
      assert.equal(composition.width, 1080);
      assert.equal(composition.height, 1920);
      assert.equal(composition.fps, 30);
      assert.equal(composition.durationInFrames, durationFrames(short));
    }
    // Representative previews cover every content definition, even without narration.
    for (const short of shorts) {
      const composition = compositions.find((c) => c.id === short.id)!;
      for (const scene of short.scenes) {
        const frame = sceneEnd(scene) - Math.min(10, sceneDuration(scene));
        await renderStill({
          serveUrl,
          composition,
          frame,
          scale: 0.5,
          puppeteerInstance: browser,
          output: join(root, ".tmp", `${short.id}-${scene.id}.png`),
        });
      }
    }
    const composition = compositions.find((c) => c.id === template.id)!;
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      scale: 0.25,
      frameRange: [0, 29],
      inputProps: { short: silentTemplate, channel: await loadChannel(template.channel) },
      outputLocation: join(root, ".tmp", "template-smoke.mp4"),
    });
    console.log(
      `PASS: ${shorts.length} discovered definitions, package/output resolution and creation, channel resolution, malformed content/path rejection, fractional-frame boundaries, browser compositions, all scene stills, and missing-narration template MP4 smoke render.`,
    );
  } finally {
    await browser.close({ silent: true });
    cleanupStage(stage);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
