import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { args, root, loadChannel } from "./project";
import { validateId } from "../src/engine/validateShort";
async function main() {
  const options = args(["id", "channel"]);
  if (!options.id || !options.channel)
    throw new Error("Use --id <short-id> --channel <channel-id>");
  const id = validateId(options.id);
  await loadChannel(options.channel);
  const target = join(root, "content", id);
  if (existsSync(target))
    throw new Error(`Refusing to overwrite existing folder: ${id}`);
  const template = readFileSync(
    join(root, "content/_template/content.ts"),
    "utf8",
  )
    .replaceAll("short-template", id)
    .replace(/channel: "[^"]+"/, `channel: "${options.channel}"`)
    .replaceAll("content/_template/", `content/${id}/`);
  for (const folder of ["audio", "assets", "output"]) {
    mkdirSync(join(target, folder), { recursive: true });
    if (folder !== "audio")
      writeFileSync(join(target, folder, ".gitkeep"), "", { flag: "wx" });
  }
  writeFileSync(join(target, "script.txt"), "", { flag: "wx" });
  writeFileSync(join(target, "content.ts"), template, { flag: "wx" });
  console.log(
    `Created content/${id}/ with content.ts, script.txt, audio/, assets/, output/. Edit the content and script, add audio/narration.mp3, then run npm.cmd run render-short -- --content ${id}. Result: content/${id}/output/${id}.mp4`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
