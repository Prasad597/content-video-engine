import { hash, parseScript, type BeatFile } from "./alignment";
import { assertPublishableTiming } from "../src/engine/timingSafety";

export type TimingProposal = {
  version: 1;
  source: "manual-proposal";
  scriptFileHash: string;
  timing: BeatFile;
};
export type TimingApproval = Omit<TimingProposal, "source"> & {
  source: "human-reviewed";
  approvedBy: string;
  approvedAt: string;
};
export type TimingEvidence = { script: string; audioHash: string; audio: string };

export function validateReviewedTiming(value: TimingProposal | TimingApproval, evidence: TimingEvidence) {
  assertPublishableTiming(value);
  assertPublishableTiming(value.timing);
  const script = parseScript(evidence.script);
  const t = value.timing;
  if (value.version !== 1 || !t || t.version !== 1 || t.language !== "en" ||
      !Number.isFinite(t.duration) || t.duration <= 0 ||
      !/^[a-f0-9]{64}$/.test(t.audioHash) || !/^[a-f0-9]{64}$/.test(t.scriptHash))
    throw new Error("Invalid manual timing metadata");
  if (t.audio !== evidence.audio || t.audioHash !== evidence.audioHash ||
      t.scriptHash !== script.scriptHash || value.scriptFileHash !== hash(evidence.script))
    throw new Error("Stale manual timing: narration or script changed; review and approve again");
  const ids = script.sections.map((s) => s.id);
  if (!t.beats || JSON.stringify(Object.keys(t.beats)) !== JSON.stringify(ids))
    throw new Error("Manual beats must exactly match semantic markers in script order");
  ids.forEach((id, i) => {
    const b = t.beats[id];
    if (!b || Object.keys(b).some((k) => k !== "start" && k !== "end") ||
        !Number.isFinite(b.start) || !Number.isFinite(b.end) || b.start < 0 ||
        b.end <= b.start || b.end > t.duration ||
        b.end !== (i + 1 < ids.length ? t.beats[ids[i + 1]]?.start : t.duration))
      throw new Error(`Invalid manual beat ${id}: require positive, contiguous, ordered audio-bounded intervals without ASR confidence`);
  });
}

export function approveTiming(proposal: TimingProposal, evidence: TimingEvidence, measuredDuration: number,
  approval: { approved: boolean; reviewer: string; at?: string }): TimingApproval {
  if (approval.approved !== true || !approval.reviewer?.trim())
    throw new Error("Explicit human approval and reviewer name are required");
  if (proposal.source !== "manual-proposal") throw new Error("Expected an unapproved manual proposal");
  validateReviewedTiming(proposal, evidence);
  if (!Number.isFinite(measuredDuration) || proposal.timing.duration !== measuredDuration)
    throw new Error("Proposed duration differs from measured narration duration; review again");
  const approvedAt = approval.at ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(approvedAt))) throw new Error("Invalid approval date");
  return { ...structuredClone(proposal), source: "human-reviewed", approvedBy: approval.reviewer.trim(), approvedAt };
}

export function verifyTimingApproval(approval: TimingApproval, beats: BeatFile, evidence: TimingEvidence) {
  if (approval.source !== "human-reviewed" || !approval.approvedBy?.trim() ||
      !Number.isFinite(Date.parse(approval.approvedAt)))
    throw new Error("Manual timing needs an explicit human-reviewed approval record");
  validateReviewedTiming(approval, evidence);
  if (JSON.stringify(approval.timing) !== JSON.stringify(beats))
    throw new Error("Canonical beats differ from approved manual timing; review and approve again");
  return beats;
}
