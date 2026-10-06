import { readFileSync } from "node:fs";
import { join } from "node:path";
import { args } from "./project";
import { loadProductionEnv, narrationPackage, speechScript } from "./production/narration";
import { prepareShort, reportFailure } from "./production/workflow";
import type { BeatFile } from "./alignment";

async function main() {
  const options = args(["content"]);
  if (!options.content) throw new Error("Use --content <short-id>");
  const content = await narrationPackage(options.content);
  loadProductionEnv();
  console.log(`NoSkip Short Preparation\nShort: ${content.short.id}`);
  const narration = await prepareShort(content);
  const beats: BeatFile = JSON.parse(readFileSync(join(content.generated, "beats.json"), "utf8"));
  console.log(`\nShort: ${content.short.id}\nWords: ${speechScript(readFileSync(content.script, "utf8")).words}\nNarration: ${narration}\nAlignment: complete\nDuration: ${beats.duration.toFixed(3)} seconds\nBeats: ${Object.keys(beats.beats).length}\nReady for content.ts authoring.`);
}
main().catch(reportFailure);
