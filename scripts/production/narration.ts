import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync, openSync, closeSync, realpathSync } from "node:fs";
import { dirname, join, relative, isAbsolute, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { loadEnvFile } from "node:process";
import { spawnSync } from "node:child_process";
import { loadAuthoredPackage, resolveAudio, root } from "../project";
import { hash, parseScript } from "../alignment";
import { elevenLabsSpeech, ttsConfig } from "./elevenlabs";

export function loadProductionEnv() {
  if (existsSync(join(root, ".env"))) {
    try { loadEnvFile(join(root, ".env")); }
    catch { throw new Error("Cannot load repository .env; check its syntax and file permissions."); }
  }
}
export function speechScript(source: string) {
  // Reuse the parser's original sections, NOT its punctuation-free alignment text.
  const parsed = parseScript(source, 1);
  const text = parsed.sections.map((s) => s.text.trim().replace(/`/g, "")).join("\n\n");
  if (!text.trim() || /[\[\]]/.test(text)) throw new Error("Malformed semantic script: unexpected/unclosed brackets in spoken text.");
  return { text, sourceHash: hash(source), scriptHash: parsed.scriptHash,
    words: parsed.sections.reduce((sum, section) => sum + section.words.length, 0) };
}
export async function narrationPackage(id: string) {
  const content = await loadAuthoredPackage(id);
  const audio = resolveAudio(content.short.narration);
  const rel = relative(content.directory, audio);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("Narration must be inside the selected content package.");
  // Check the existing ancestor too: a missing file must not escape via a symlink.
  let ancestor = dirname(audio);
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const actual = relative(content.directory, realpathSync(ancestor));
  if (actual.startsWith("..") || isAbsolute(actual)) throw new Error("Narration directory redirects outside its package.");
  const generated = join(content.directory, "generated");
  if (existsSync(generated) && realpathSync(generated) !== generated) throw new Error("Generated state must not redirect outside its package.");
  return { ...content, audio, script: join(content.directory, "script.txt"), generated: join(content.directory, "generated") };
}
export type NarrationPackage = Awaited<ReturnType<typeof narrationPackage>>;
export const metadataPath = (p: NarrationPackage) => join(p.generated, "narration.json");
const pendingPath = (p: NarrationPackage) => join(p.generated, "narration.pending.json");
export function checkExistingNarration(p: NarrationPackage) {
  if (existsSync(pendingPath(p))) throw new Error("Incomplete narration transaction. Inspect generated/narration.pending.json and restore matching audio/metadata before preparing again.");
  const source = readFileSync(p.script, "utf8");
  const script = speechScript(source);
  const audioHash = hash(readFileSync(p.audio));
  if (existsSync(metadataPath(p))) {
    let meta;
    try { meta = JSON.parse(readFileSync(metadataPath(p), "utf8")); } catch { throw new Error("Invalid generated/narration.json; restore metadata or explicitly regenerate narration."); }
    if (meta.version !== 1 || meta.provider !== "elevenlabs" || meta.sourceHash !== script.sourceHash || meta.scriptHash !== script.scriptHash || meta.audioHash !== audioHash)
      throw new Error("Narration exists but script/audio changed since generation. Refusing to align stale audio. Restore the original files or run generate-audio -- --content " + p.short.id + " --regenerate true.");
    return "reused";
  }
  // Legacy audio stays supported; existing alignment provides provenance when available.
  const alignmentPath = join(p.generated, "alignment.json");
  if (existsSync(alignmentPath)) {
    const alignment = JSON.parse(readFileSync(alignmentPath, "utf8"));
    if (alignment.scriptHash !== script.scriptHash || alignment.audioHash !== audioHash)
      throw new Error("Manual narration/script differs from its existing alignment. Verify the recording and use align-short explicitly; prepare-short will not guess.");
  }
  return "manual (no TTS metadata; verify recording matches script)";
}
export function verifyMp3(path: string) {
  const probe = process.platform === "win32" ? join(root, "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe") : "ffprobe";
  const result = spawnSync(probe, ["-v", "error", "-show_entries", "stream=codec_name,codec_type:format=duration", "-of", "json", path], { encoding: "utf8" });
  if (result.status !== 0) throw new Error("Generated MP3 failed ffprobe validation; ensure the existing Remotion ffprobe is available. Original narration preserved.");
  const data = JSON.parse(result.stdout);
  if (!data.streams?.some((s: {codec_name: string; codec_type: string}) => s.codec_type === "audio" && s.codec_name === "mp3") || !(Number(data.format?.duration) > 0))
    throw new Error("Generated response is not a playable MP3. Original narration preserved.");
}
export async function generateNarration(p: NarrationPackage, regenerate = false, options: {
  env?: NodeJS.ProcessEnv; request?: typeof fetch; verify?: typeof verifyMp3; log?: (text: string) => void;
} = {}) {
  const log = options.log ?? console.log;
  const refuse = () => { throw new Error(`Narration already exists: ${p.short.narration}\nNo ElevenLabs request was made. No credits were consumed.\nTo intentionally regenerate: npm.cmd run generate-audio -- --content ${p.short.id} --regenerate true`); };
  if (existsSync(p.audio) && !regenerate) refuse();
  if (existsSync(pendingPath(p))) throw new Error("Incomplete narration transaction; inspect generated/narration.pending.json before retrying.");
  if (extname(p.audio).toLowerCase() !== ".mp3") throw new Error("ElevenLabs generation currently supports package .mp3 paths only. Existing manual WAV narration remains supported.");
  const source = readFileSync(p.script, "utf8");
  const script = speechScript(source);
  const config = ttsConfig(options.env ?? process.env);
  mkdirSync(dirname(p.audio), { recursive: true });
  mkdirSync(p.generated, { recursive: true });
  const lock = join(p.generated, "narration.lock");
  let descriptor: number;
  try { descriptor = openSync(lock, "wx"); }
  catch { throw new Error("Narration generation is locked or the directory is not writable. Check for another running generation before removing generated/narration.lock."); }
  const suffix = randomUUID();
  const tempAudio = join(dirname(p.audio), `.narration-${suffix}.mp3`);
  const tempMeta = join(p.generated, `.narration-${suffix}.json`);
  let oldAudio: Buffer | undefined;
  let oldMeta: Buffer | undefined;
  let replaced = false;
  let recoveryRequired = false;
  try {
    oldAudio = existsSync(p.audio) ? readFileSync(p.audio) : undefined;
    oldMeta = existsSync(metadataPath(p)) ? readFileSync(metadataPath(p)) : undefined;
    if (oldAudio && !regenerate) refuse();
    // Exercise both destination directories before a paid request.
    writeFileSync(tempAudio, "", { flag: "wx" });
    writeFileSync(tempMeta, "", { flag: "wx" });
    log(`Short: ${p.short.id}\nWords: ${script.words}\nCharacters: ${script.text.length}\nVoice: configured via ELEVENLABS_VOICE_ID (not logged)\nModel: ${config.modelId}`);
    const bytes = await elevenLabsSpeech(script.text, config, options.request);
    writeFileSync(tempAudio, bytes);
    (options.verify ?? verifyMp3)(tempAudio);
    if (hash(readFileSync(p.script)) !== script.sourceHash) throw new Error("Script changed during generation. Audio was not replaced; check ElevenLabs history before retrying.");
    if ((existsSync(p.audio) ? hash(readFileSync(p.audio)) : undefined) !== (oldAudio ? hash(oldAudio) : undefined))
      throw new Error("Narration changed during generation. Refusing to replace it.");
    writeFileSync(tempMeta, JSON.stringify({ version: 1, provider: "elevenlabs", sourceHash: script.sourceHash,
      scriptHash: script.scriptHash, audioHash: hash(bytes), voiceId: config.voiceId, modelId: config.modelId }, null, 2) + "\n");
    writeFileSync(pendingPath(p), JSON.stringify({ tempAudio, tempMeta }), { flag: "wx" });
    renameSync(tempAudio, p.audio); // Same-directory atomic replacement, after validation.
    replaced = true;
    renameSync(tempMeta, metadataPath(p));
    unlinkSync(pendingPath(p));
    log(`Narration saved: ${p.short.narration}`);
    return script.words;
  } catch (error) {
    if (replaced) {
      // Roll back ordinary filesystem failures. A failed rollback leaves a marker
      // so preparation cannot mistake uncommitted audio for legacy narration.
      try {
        if (oldAudio) { writeFileSync(tempAudio, oldAudio); renameSync(tempAudio, p.audio); }
        else unlinkSync(p.audio);
        if (oldMeta) { writeFileSync(tempMeta, oldMeta); renameSync(tempMeta, metadataPath(p)); }
        else if (existsSync(metadataPath(p))) unlinkSync(metadataPath(p));
        if (existsSync(pendingPath(p))) unlinkSync(pendingPath(p));
      } catch { recoveryRequired = true; throw new Error("Narration transaction/rollback failed. Stop and restore matching audio/metadata; generated/narration.pending.json marks the incomplete transaction."); }
    } else if (existsSync(pendingPath(p))) unlinkSync(pendingPath(p));
    throw error;
  } finally {
    closeSync(descriptor);
    for (const path of recoveryRequired ? [lock] : [tempAudio, tempMeta, lock]) if (existsSync(path)) unlinkSync(path);
  }
}
