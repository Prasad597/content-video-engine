import { existsSync, mkdtempSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { openBrowser, selectComposition, renderMedia } from "@remotion/renderer";
import {
  args,
  root,
  loadContentPackage,
  prepareOutput,
  loadChannel,
  resolveAudio,
  stageAssets,
  bundleShorts,
} from "./project";
import { cleanupStage } from "./project";
async function main() {
  const options = args(["content", "channel"]);
  if (!options.content) throw new Error("Use --content <folder-id>");
  const content = await loadContentPackage(options.content);
  const { short } = content;
  const channel = await loadChannel(options.channel ?? short.channel);
  const narration = resolveAudio(short.narration);
  if (!existsSync(narration))
    console.warn(`Silent preview: missing ${short.narration}`);
  mkdirSync(join(root, ".tmp"), { recursive: true });
  const stage = mkdtempSync(join(root, ".tmp", "render-assets-"));
  const browser = await openBrowser('chrome');
  try {
    const serveUrl = await bundleShorts(stageAssets([short], stage));
    const inputProps = { short, channel };
    const composition = await selectComposition({
      serveUrl,
      id: short.id,
      inputProps,
      puppeteerInstance: browser,
    });
    const outputLocation = prepareOutput(content);
    console.log(`Rendering ${short.id} -> ${outputLocation}`);
    let reported = -1;
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: "h264",
      crf: 18,
      concurrency: 2,
      puppeteerInstance: browser,
      onProgress: ({progress}) => {
        const quarter = Math.floor(progress * 4);
        if (quarter > reported) {
          reported = quarter;
          console.log(`Render progress: ${quarter * 25}%`);
        }
      },
      outputLocation,
    });
    console.log(`Rendered ${outputLocation}`);
  } finally {
    await browser.close({silent: true});
    cleanupStage(stage);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
