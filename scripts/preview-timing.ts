import { hash, parseScript, type BeatFile } from "./alignment";
import { writeFileSync, renameSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { validateReviewedTiming, type TimingProposal, type TimingEvidence } from "./manual-timing";

export const PREVIEW_FILE = "beats.preview-estimated.json";
export function writeEstimatedTiming(directory: string, value: EstimatedTiming) {
  const temp = join(directory, `.${PREVIEW_FILE}.${process.pid}.tmp`);
  try {
    writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
    renameSync(temp, join(directory, PREVIEW_FILE));
  } finally { if (existsSync(temp)) unlinkSync(temp); }
}
export type EstimatedTiming = {
  version: 1; source: "preview-estimated"; mode: "preview-estimated"; publishable: false;
  scriptFileHash: string; reason: string; method: "script-word-proportion-v1";
  timing: BeatFile & { mode: "preview-estimated"; publishable: false };
};
export function estimateTiming(evidence: TimingEvidence, duration: number, reason: string): EstimatedTiming {
  if (!Number.isFinite(duration) || duration <= 0 || !reason.trim()) throw new Error("Invalid preview duration/failure reason");
  const script = parseScript(evidence.script);
  const total = script.sections.reduce((n, s) => n + s.words.length, 0);
  let offset = 0;
  const beats = Object.fromEntries(script.sections.map((s, i) => {
    const start = duration * offset / total; offset += s.words.length;
    return [s.id, { start, end: i === script.sections.length - 1 ? duration : duration * offset / total }];
  }));
  const value: EstimatedTiming = { version: 1, source: "preview-estimated", mode: "preview-estimated", publishable: false,
    scriptFileHash: hash(evidence.script), reason, method: "script-word-proportion-v1",
    timing: { version: 1, audio: evidence.audio, audioHash: evidence.audioHash, scriptHash: script.scriptHash,
      duration, language: "en", beats, mode: "preview-estimated", publishable: false } };
  reviewProposal(value, evidence);
  return value;
}
// Conversion is a review suggestion, not approval. Only approve-timing's
// existing explicit consent path may turn this proposal into canonical timing.
export function reviewProposal(value: EstimatedTiming, evidence: TimingEvidence): TimingProposal {
  if (value.version !== 1 || value.source !== "preview-estimated" || value.mode !== "preview-estimated" || value.publishable !== false ||
      value.timing?.mode !== "preview-estimated" || value.timing.publishable !== false ||
      value.method !== "script-word-proportion-v1" || typeof value.reason !== "string" || !value.reason.trim())
    throw new Error("Missing/invalid preview-estimated provenance");
  const { mode: _, publishable: __, ...timing } = value.timing;
  const proposal: TimingProposal = { version: 1, source: "manual-proposal", scriptFileHash: value.scriptFileHash, timing };
  validateReviewedTiming(proposal, evidence);
  return proposal;
}
