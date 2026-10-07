import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { args, root, loadAuthoredPackage, resolveAudio } from "./project";
import { hash, parseScript, recoverWordTimestamps, resolveBeats, type AlignmentResult } from "./alignment";

async function main() {
  const options = args(["content"]);
  if (!options.content) throw new Error("Use --content <folder-id>");
  const { short, directory } = await loadAuthoredPackage(options.content);
  const audioPath = resolveAudio(short.narration);
  if (!existsSync(audioPath)) throw new Error(`Missing authoritative narration: ${audioPath}`);
  const audio = relative(directory, audioPath).replaceAll("\\", "/");
  if (audio.startsWith("..") || isAbsolute(audio)) throw new Error("Alignment narration must belong to its content package");
  const script = parseScript(readFileSync(join(directory, "script.txt"), "utf8"));
  const python = join(root, "tools/alignment/.venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  if (!existsSync(python)) throw new Error("Set up tools/alignment/.venv first; see docs/ALIGNMENT.md");
  const probe = process.platform === "win32"
    ? join(root, "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe") : "ffprobe";
  const measured = spawnSync(probe, ["-v", "error", "-show_entries", "format=duration", "-of", "json", audioPath], { encoding: "utf8" });
  if (measured.status !== 0) throw new Error(`Cannot measure narration: ${measured.stderr || measured.error}`);
  const duration = Number(JSON.parse(measured.stdout).format.duration);
  const generated = join(directory, "generated");
  mkdirSync(generated, { recursive: true });
  const request = { version: 1, audio, audioPath, audioHash: hash(readFileSync(audioPath)),
    scriptHash: script.scriptHash, duration, language: "en", text: script.text };
  const input = join(generated, "alignment-input.json");
  const alignmentPath = join(generated, "alignment.json");
  writeFileSync(input, JSON.stringify(request, null, 2));
  console.log("Local CPU alignment: faster-whisper base.en INT8 (first run downloads model; no audio upload).");
  const result = spawnSync(python, [join(root, "tools/alignment/align.py"), input, alignmentPath, join(generated, "benchmark.json")], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Local aligner failed: ${result.error ?? result.status}`);
  const rawAlignment = JSON.parse(readFileSync(alignmentPath, "utf8")) as AlignmentResult;
  if (hash(readFileSync(audioPath)) !== request.audioHash || parseScript(readFileSync(join(directory, "script.txt"), "utf8")).scriptHash !== request.scriptHash)
    throw new Error("Narration or script changed during alignment; rerun align-short");
  const alignment = recoverWordTimestamps(rawAlignment);
  const beats = resolveBeats(script, alignment);
  // Persist repaired words only after strict semantic matching succeeds. Failure
  // leaves the adapter's original output available for diagnosis.
  if (alignment !== rawAlignment) writeFileSync(alignmentPath, JSON.stringify(alignment, null, 2) + "\n");
  writeFileSync(join(generated, "beats.json"), JSON.stringify(beats, null, 2) + "\n");
  for (const [id, beat] of Object.entries(beats.beats))
    console.log(`${id.padEnd(22)} ${beat.start.toFixed(3)} -> ${beat.end.toFixed(3)}`);
  console.log(`${alignment.words.length} words; ${Object.keys(beats.beats).length} beats; ${duration.toFixed(6)} seconds`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
