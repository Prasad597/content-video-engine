import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { loadChannel, loadContentPackage, root } from "./project";
import { assertThumbnailPng, writePublishingAssets } from "./production/publishing";
import { produceShort } from "./production/workflow";
import { validatePublishingAssets } from "../src/engine/validateShort";

const quiet = () => {};
async function fixture(run: (output: string) => Promise<void>) {
  mkdirSync(join(root, ".tmp"), { recursive: true });
  const output = mkdtempSync(join(root, ".tmp/publishing-test-"));
  try { await run(output); }
  finally {
    assert.ok(!relative(join(root, ".tmp"), output).startsWith(".."));
    rmSync(output, { recursive: true, force: true });
  }
}
test("authored UTF-8 publishing text round-trips exactly", async () => fixture(async (output) => {
  const { short } = await loadContentPackage("short-007");
  const files = await writePublishingAssets({ ...short, thumbnail: undefined }, await loadChannel(short.channel), output, undefined, quiet);
  assert.equal(files.length, 3);
  assert.equal(readFileSync(join(output, "youtube-title.txt"), "utf8"), short.publishing!.youtube.title);
  assert.equal(readFileSync(join(output, "youtube-description.txt"), "utf8"), short.publishing!.youtube.description);
  const caption = readFileSync(join(output, "instagram-caption.txt"), "utf8");
  assert.equal(caption, short.publishing!.instagram.caption);
  assert.ok(caption.includes("☕🧠") && caption.includes("≠") && caption.includes("That’s"));
}));
test("legacy Shorts 001–006 skip unconfigured artifacts", async () => fixture(async (output) => {
  for (let n = 1; n <= 6; n++) {
    const { short } = await loadContentPackage(`short-${String(n).padStart(3, "0")}`);
    assert.deepEqual(await writePublishingAssets(short, await loadChannel(short.channel), output, async () => { throw new Error("Must not render"); }, quiet), []);
  }
  assert.deepEqual(readdirSync(output), []);
}));
test("configured thumbnail failure leaves previous files intact and no partial artifacts", async () => fixture(async (output) => {
  const { short } = await loadContentPackage("short-007");
  writeFileSync(join(output, "youtube-title.txt"), "previous title");
  await assert.rejects(writePublishingAssets(short, await loadChannel(short.channel), output, async (_s, _c, path) => {
    writeFileSync(path, "partial image"); throw new Error("render failed");
  }), /render failed/);
  assert.equal(readFileSync(join(output, "youtube-title.txt"), "utf8"), "previous title");
  assert.deepEqual(readdirSync(output), ["youtube-title.txt"]);
}));
test("production reports completion only after successful artifacts", async () => {
  const events: string[] = [];
  const run = (step: string) => { events.push(step); };
  const log = (message: string) => { events.push(message); };
  await assert.rejects(produceShort("short-007", run, async () => { events.push("publishing"); throw new Error("artifact failed"); }, log), /artifact failed/);
  assert.deepEqual(events, ["typecheck", "validate", "render-short", "publishing"]);
  events.length = 0;
  await produceShort("short-007", run, async () => { events.push("publishing"); return { video: "short-007.mp4", files: ["thumbnail.png"] }; }, log);
  assert.equal(events[3], "publishing"); assert.match(events[4], /Production complete/);
});
test("publishing validation rejects empty metadata and oversized thumbnail text", () => {
  assert.throws(() => validatePublishingAssets({ publishing: { youtube: { title: "", description: "text" }, instagram: { caption: "text" } } }), /Publishing/);
  assert.throws(() => validatePublishingAssets({ thumbnail: { headline: "x".repeat(27) } }), /headline/);
});
test("real local Remotion thumbnail is a 1080×1920 PNG", async () => fixture(async (output) => {
  const { short } = await loadContentPackage("short-007");
  const files = await writePublishingAssets(short, await loadChannel(short.channel), output);
  assert.equal(files.length, 4);
  const png = join(output, "thumbnail.png");
  assertThumbnailPng(png); assert.ok(existsSync(png));
  assert.ok(readFileSync(png).length > 10_000);
  writeFileSync(join(output, "invalid.png"), "invalid");
  assert.throws(() => assertThumbnailPng(join(output, "invalid.png")), /1080/);
}));
