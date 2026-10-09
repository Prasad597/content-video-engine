import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { args, root, loadAuthoredPackage, resolveAudio } from "./project";
import { hash } from "./alignment";
import { approveTiming, type TimingProposal } from "./manual-timing";
import { reviewProposal } from "./preview-timing";

async function main() {
  const options = args(["content", "proposal", "approve", "reviewer"]);
  if (!options.content || !options.proposal || options.approve !== "true" || !options.reviewer?.trim())
    throw new Error("After listening and approving: --content <id> --proposal <review.json> --approve true --reviewer <name>");
  const { short, directory } = await loadAuthoredPackage(options.content);
  const audio = resolveAudio(short.narration);
  const rel = relative(directory, audio).replaceAll("\\", "/");
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("Narration must belong to its content package");
  const script = readFileSync(join(directory, "script.txt"), "utf8");
  const audioHash = hash(readFileSync(audio));
  const probe = process.platform === "win32" ? join(root, "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe") : "ffprobe";
  const measured = spawnSync(probe, ["-v", "error", "-show_entries", "format=duration", "-of", "json", audio], { encoding: "utf8" });
  if (measured.status !== 0) throw new Error(`Cannot measure narration: ${measured.stderr || measured.error}`);
  const input = JSON.parse(readFileSync(resolve(root, options.proposal), "utf8"));
  const proposal: TimingProposal = input.source === "preview-estimated"
    ? reviewProposal(input, { script, audioHash, audio: rel }) : input;
  const approval = approveTiming(proposal, { script, audioHash, audio: rel },
    Number(JSON.parse(measured.stdout).format.duration), { approved: true, reviewer: options.reviewer });
  const generated = join(directory, "generated");
  mkdirSync(generated, { recursive: true });
  const pending = ["manual-timing.json", "beats.json"].map((name) => ({
    final: join(generated, name), temp: join(generated, `.${name}.${process.pid}.tmp`),
  }));
  try {
    writeFileSync(pending[0].temp, JSON.stringify(approval, null, 2) + "\n", { flag: "wx" });
    writeFileSync(pending[1].temp, JSON.stringify(approval.timing, null, 2) + "\n", { flag: "wx" });
    if (hash(readFileSync(audio)) !== audioHash || readFileSync(join(directory, "script.txt"), "utf8") !== script)
      throw new Error("Narration or script changed during approval; nothing approved");
    // Approval first: interruption between renames leaves a mismatch that fails closed.
    for (const file of pending) renameSync(file.temp, file.final);
  } finally {
    for (const file of pending) if (existsSync(file.temp)) unlinkSync(file.temp);
  }
  console.log(`Human-reviewed timing approved for ${short.id} by ${approval.approvedBy}. Automatic alignment was not changed.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
