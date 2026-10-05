import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const input = process.argv.slice(2);
const shortId = input[0] ?? "short-003";
const targetDir = resolve(process.cwd(), "content", shortId);
const templatePath = resolve(process.cwd(), "content", "_template", "content.ts");
const template = readFileSync(templatePath, "utf8");

const content = template
  .replace(/short-template/g, shortId)
  .replace(/A short-form educational explanation/g, `Short ${shortId}`)
  .replace(/General topic/g, "Your topic")
  .replace(/public\/audio\/narration-template.wav/g, `content/${shortId}/audio/narration.mp3`);

mkdirSync(targetDir, { recursive: true });
writeFileSync(resolve(targetDir, "content.ts"), content, "utf8");
console.log(`Created starter content at ${targetDir}/content.ts`);
