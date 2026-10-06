import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { root } from "../project";
import { parseScript } from "../alignment";
import { checkExistingNarration, generateNarration, type NarrationPackage } from "./narration";

type Step = "typecheck" | "validate" | "align-short" | "render-short";
export type Runner = (step: Step, id: string) => void;
export const runExisting: Runner = (step, id) => {
  console.log(`\n> ${step}${step.endsWith("-short") ? ` --content ${id}` : ""}`);
  // Run the existing entry points without a shell (including on Windows).
  const command = step === "typecheck"
    ? [require.resolve("typescript/bin/tsc"), "--noEmit"]
    : [require.resolve("tsx/cli"), "--", join(root, `scripts/${step}.ts`),
      ...(step.endsWith("-short") ? ["--content", id] : [])];
  const result = spawnSync(process.execPath, command, { cwd: root, stdio: "inherit" });
  if (result.error || result.status !== 0)
    throw Object.assign(new Error(`${step} failed; later steps were not run.`), { exitCode: result.status || 1 });
};
export function regenerationFlag(value?: string) {
  if (value !== undefined && value !== "true" && value !== "false")
    throw new Error("Use --regenerate true (or false); flags require key/value arguments.");
  return value === "true";
}
export async function prepareShort(p: NarrationPackage, run: Runner = runExisting, generate = generateNarration) {
  if (existsSync(join(p.generated, "narration.lock"))) throw new Error("Narration generation is in progress or locked; inspect generated/narration.lock before preparing.");
  // Apply the existing alignment constraints BEFORE consuming TTS credits.
  parseScript(readFileSync(p.script, "utf8"));
  let narration: string;
  if (existsSync(p.audio)) narration = checkExistingNarration(p);
  else { await generate(p); narration = "generated"; }
  console.log(`Narration: ${narration}`);
  run("align-short", p.short.id);
  return narration;
}
export function produceShort(id: string, run: Runner = runExisting) {
  for (const step of ["typecheck", "validate", "render-short"] as const) run(step, id);
}
export function reportFailure(error: unknown) {
  console.error(error instanceof Error ? error.message : "Production command failed.");
  process.exitCode = typeof (error as {exitCode?: unknown})?.exitCode === "number" ? (error as {exitCode: number}).exitCode : 1;
}
