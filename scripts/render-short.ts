import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { short001Content } from "../content/short-001/content";
import { short002Content } from "../content/short-002/content";

const args = process.argv.slice(2);
const getArg = (name: string) => {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) return undefined;
  return args[index + 1];
};

const contentId = getArg("--content") ?? "short-001";
const channel = getArg("--channel") ?? "noskip-learning";

const library = {
  "short-001": { short: short001Content, output: "out/short-001.mp4" },
  "short-002": { short: short002Content, output: "out/short-002.mp4" },
} as const;

const selected = library[contentId as keyof typeof library];
if (!selected) {
  throw new Error(`Unknown content id: ${contentId}. Available: ${Object.keys(library).join(", ")}`);
}

const narrationPath = selected.short.narration;
const resolvedNarration = resolve(process.cwd(), narrationPath);
const message = `Missing narration file for ${contentId}: ${narrationPath}`;

if (!existsSync(resolvedNarration)) {
  console.warn(`WARNING: ${message}`);
}

if (channel !== "noskip-learning") {
  console.warn(`WARNING: channel ${channel} is not configured yet; using the default NoSkipLearning channel.`);
}

const compositionId = contentId;
const outputPath = selected.output;
console.log(`Rendering ${compositionId} -> ${outputPath}`);

execSync(
  `npx remotion render src/index.ts ${compositionId} ${outputPath} --codec=h264 --crf=18`,
  { stdio: "inherit" },
);
