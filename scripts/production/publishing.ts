import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, renameSync, unlinkSync, rmdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { loadContentPackage, loadChannel, prepareOutput, root } from "../project";
import { validatePublishingAssets } from "../../src/engine/validateShort";
import type { ShortDefinition, ChannelDefinition } from "../../src/engine/types";

export async function renderThumbnail(short: ShortDefinition, channel: ChannelDefinition, output: string) {
  const serveUrl = await bundle({ entryPoint: join(root, "src/thumbnail/index.tsx") });
  const browser = await openBrowser("chrome");
  try {
    const inputProps = { thumbnail: short.thumbnail, channel };
    const composition = await selectComposition({ serveUrl, id: "publishing-thumbnail", inputProps, puppeteerInstance: browser });
    await renderStill({ serveUrl, composition, inputProps, output, imageFormat: "png", frame: 0, puppeteerInstance: browser });
  } finally { await browser.close({ silent: true }); }
}
export function assertThumbnailPng(path: string) {
  const bytes = readFileSync(path);
  if (bytes.length < 45 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.toString("ascii", 12, 16) !== "IHDR" || bytes.readUInt32BE(16) !== 1080 || bytes.readUInt32BE(20) !== 1920 || bytes.subarray(-12).toString("hex") !== "0000000049454e44ae426082")
    throw new Error("Thumbnail must be a 1080×1920 PNG");
}
export async function writePublishingAssets(short: ShortDefinition, channel: ChannelDefinition, output: string, render = renderThumbnail, warn = console.warn) {
  validatePublishingAssets(short);
  const files: string[] = [];
  if (!short.publishing) warn(`${short.id}: no publishing metadata; text artifacts skipped (legacy content supported).`);
  if (!short.thumbnail) warn(`${short.id}: no thumbnail configuration; thumbnail skipped.`);
  if (!short.publishing && !short.thumbnail) return files;
  mkdirSync(output, { recursive: true });
  // Stage every artifact before touching final files. Same-directory renames keep
  // each final file complete; a commit failure propagates, never reports success.
  const stage = mkdtempSync(join(output, ".publishing-"));
  const staged: string[] = [];
  try {
    if (short.thumbnail) {
      staged.push("thumbnail.png");
      await render(short, channel, join(stage, "thumbnail.png"));
      assertThumbnailPng(join(stage, "thumbnail.png"));
    }
    if (short.publishing) {
      const p = short.publishing;
      for (const [name, value] of [["youtube-title.txt", p.youtube.title], ["youtube-description.txt", p.youtube.description], ["instagram-caption.txt", p.instagram.caption]]) {
        staged.push(name);
        writeFileSync(join(stage, name), value, { encoding: "utf8", flag: "wx" });
      }
    }
    for (const name of staged) {
      renameSync(join(stage, name), join(output, name));
      files.push(join(output, name));
    }
    return files;
  } finally {
    // Only our fixed staging filenames, no recursive removal of user paths.
    for (const name of staged) {
      try { unlinkSync(join(stage, name)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    rmdirSync(stage);
  }
}
export async function publishShort(id: string) {
  const content = await loadContentPackage(id);
  const video = prepareOutput(content);
  const files = await writePublishingAssets(content.short, await loadChannel(content.short.channel), dirname(video));
  return { video, files };
}
