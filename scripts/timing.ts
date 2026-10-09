import { readFileSync, existsSync } from "node:fs";
import { join, resolve, relative, isAbsolute } from "node:path";
import type { AuthoredShortDefinition, ShortDefinition, SemanticTiming } from "../src/engine/types";
import { validateShortDefinition } from "../src/engine/validateShort";
import { hash, parseScript, resolveBeats, type BeatFile, type AlignmentResult } from "./alignment";
import { verifyTimingApproval, type TimingApproval } from "./manual-timing";
import { assertPublishableTiming } from "../src/engine/timingSafety";

export const pendingEstimatedPreview = (directory: string) =>
  existsSync(join(directory, "generated/beats.preview-estimated.json")) && !existsSync(join(directory, "generated/beats.json"));

export const hasSemanticTiming = (short: AuthoredShortDefinition) =>
  short.scenes.some((s) => "timing" in s) || short.captions?.some((c) => "timing" in c);
export function assertFresh(alignment: AlignmentResult, beats: BeatFile, audioHash: string, scriptHash: string) {
  if (alignment.audioHash !== audioHash || beats.audioHash !== audioHash ||
      alignment.scriptHash !== scriptHash || beats.scriptHash !== scriptHash)
    throw new Error("Narration or script changed since alignment");
}
export function resolveTiming(short: AuthoredShortDefinition, data?: BeatFile): ShortDefinition {
  assertPublishableTiming(short);
  assertPublishableTiming(data);
  if (!hasSemanticTiming(short)) {
    validateShortDefinition(short as ShortDefinition);
    return short as ShortDefinition;
  }
  if (!data || data.version !== 1) throw new Error("Missing or unsupported semantic beats");
  const duration = data.duration;
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid narration duration");
  const beat = (id: string) => {
    const value = data.beats[id];
    if (!value) throw new Error(`Referenced beat does not exist: ${id}`);
    if (!Number.isFinite(value.start) || !Number.isFinite(value.end) || value.start < 0 || value.end <= value.start || value.end > duration)
      throw new Error(`Invalid semantic beat: ${id}`);
    return value;
  };
  const offset = (n: number) => {
    if (!Number.isFinite(n) || Math.abs(n) > 500) throw new Error("Editorial timing offsets must be finite and within +/-500 ms");
    return n / 1000;
  };
  const globalLead = offset(short.visualLeadMs ?? 200);
  const interval = (t: SemanticTiming, caption = false) => {
    const from = beat(t.from);
    const end = t.until ? beat(t.until).start : from.end;
    if (end <= from.start) throw new Error(`Timing from ${t.from} must precede until ${t.until}`);
    const lead = t.leadMs === undefined ? (caption ? 0 : globalLead) : offset(t.leadMs);
    const tail = offset(t.tailMs ?? 0);
    return { start: Math.max(0, from.start - lead),
      end: end === duration ? duration + tail : end - (caption ? 0 : globalLead) + tail };
  };
  const { visualLeadMs: _, ...base } = short;
  const scenes = short.scenes.map((s) => {
    if (!("timing" in s)) return { ...s };
    const { timing, ...visual } = s;
    return { ...visual, ...interval(timing) };
  });
  // One shared cut: incoming scene lead plus outgoing scene tail. No overlap/gap.
  for (let i = 1; i < scenes.length; i++) {
    const previous = short.scenes[i - 1], current = short.scenes[i];
    if ("timing" in previous && "timing" in current) {
      const priorEnd = previous.timing.until ? beat(previous.timing.until).start : beat(previous.timing.from).end;
      if (priorEnd !== beat(current.timing.from).start) throw new Error("Adjacent semantic scenes must share a spoken boundary");
      const cut = scenes[i].start + offset(previous.timing.tailMs ?? 0);
      scenes[i].start = cut;
      scenes[i - 1].end = cut;
    }
  }
  // Opening artwork covers initial silence; narration itself is never shifted.
  if ("timing" in short.scenes[0]) scenes[0].start = 0;
  const captions = short.captions?.map((c) => {
    if (!("timing" in c)) return { ...c };
    const { timing, ...text } = c;
    const time = interval(timing, true);
    return { ...text, startMs: time.start * 1000, endMs: time.end * 1000 };
  });
  const resolved = { ...base, scenes, captions } as ShortDefinition;
  for (const s of scenes)
    if (s.start < 0 || s.end > duration) throw new Error("Resolved scene exceeds narration bounds");
  validateShortDefinition(resolved);
  return resolved;
}
export function resolvePackageTiming(short: AuthoredShortDefinition, directory: string, root: string) {
  if (pendingEstimatedPreview(directory)) throw new Error(`${short.id}: preview-estimated timing is not publishable; measured alignment or explicit human approval required`);
  if (!hasSemanticTiming(short) && !existsSync(join(directory, "generated/beats.preview-estimated.json")) &&
      !existsSync(join(directory, "generated/beats.json")) && !existsSync(join(directory, "generated/manual-timing.json"))) return resolveTiming(short);
  const rerun = existsSync(join(directory, "generated/manual-timing.json"))
    ? "Review manual timing and explicitly approve it again; never reuse stale approval"
    : `Run: npm.cmd run align-short -- --content ${short.id}`;
  try {
    const audio = resolve(root, short.narration);
    const rel = relative(directory, audio);
    if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("Narration must belong to its content package");
    const manualPath = join(directory, "generated/manual-timing.json");
    if (existsSync(manualPath)) {
      const approval: TimingApproval = JSON.parse(readFileSync(manualPath, "utf8"));
      const beats: BeatFile = JSON.parse(readFileSync(join(directory, "generated/beats.json"), "utf8"));
      return resolveTiming(short, verifyTimingApproval(approval, beats, {
        script: readFileSync(join(directory, "script.txt"), "utf8"),
        audioHash: hash(readFileSync(audio)), audio: rel.replaceAll("\\", "/"),
      }));
    }
    const paths = [join(directory, "generated/alignment.json"), join(directory, "generated/beats.json")];
    if (paths.some((p) => !existsSync(p))) throw new Error("Missing alignment.json or beats.json");
    const alignment: AlignmentResult = JSON.parse(readFileSync(paths[0], "utf8"));
    const beats: BeatFile = JSON.parse(readFileSync(paths[1], "utf8"));
    assertPublishableTiming(alignment);
    assertPublishableTiming(beats);
    const script = parseScript(readFileSync(join(directory, "script.txt"), "utf8"));
    assertFresh(alignment, beats, hash(readFileSync(audio)), script.scriptHash);
    if (alignment.audio !== rel.replaceAll("\\", "/")) throw new Error("Aligned audio path changed");
    // Reject corrupted or hand-edited beats too; all boundaries must be reproducible.
    if (JSON.stringify(resolveBeats(script, alignment)) !== JSON.stringify(beats))
      throw new Error("Beats do not match normalized alignment");
    return resolveTiming(short, beats);
  } catch (error) {
    throw new Error(`${short.id}: ${(error as Error).message}. ${rerun}`);
  }
}
