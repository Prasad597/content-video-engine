import { mkdtempSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { root, listContent, loadShort, stageAssets } from "./project";
import { cleanupStage } from "./project";
async function main() {
  mkdirSync(join(root, ".tmp"), { recursive: true });
  const stage = mkdtempSync(join(root, ".tmp", "studio-assets-"));
  stageAssets(await Promise.all(listContent().map(loadShort)), stage);
  const child = spawn(
    process.execPath,
    [
      join(
        dirname(require.resolve("@remotion/cli/package.json")),
        "remotion-cli.js",
      ),
      "studio",
      join(root, "src/index.ts"),
      "--public-dir",
      stage,
    ],
    { stdio: "inherit" },
  );
  child.on("exit", (code) => {
    cleanupStage(stage);
    process.exitCode = code ?? 0;
  });
  child.on("error", (error) => {
    console.error(error);
    cleanupStage(stage);
    process.exitCode = 1;
  });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
