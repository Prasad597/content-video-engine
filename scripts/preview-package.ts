import { readFileSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";
import { hash, parseScript } from "./alignment";
import { loadAuthoredPackage, resolveAudio } from "./project";
import { reviewProposal, PREVIEW_FILE, type EstimatedTiming } from "./preview-timing";
import { hasSemanticTiming, resolveTiming } from "./timing";
import type { AuthoredShortDefinition } from "../src/engine/types";

export async function loadEstimatedPackage(id: string, music?: string) {
  const content = await loadAuthoredPackage(id);
  const raw = readFileSync(join(content.directory, "script.txt"), "utf8");
  const audioPath = resolveAudio(content.short.narration);
  const audio = relative(content.directory, audioPath).replaceAll("\\", "/");
  if (audio.startsWith("..") || isAbsolute(audio)) throw new Error("Preview narration must belong to its package");
  const estimated: EstimatedTiming = JSON.parse(readFileSync(join(content.directory, "generated", PREVIEW_FILE), "utf8"));
  const proposal = reviewProposal(estimated, { script: raw, audio, audioHash: hash(readFileSync(audioPath)) });
  let authored = content.short;
  if (!hasSemanticTiming(authored)) {
    console.warn("No authored semantic scenes: rendering script-review cards, not final visual content.");
    const sections = parseScript(raw).sections;
    authored = { ...authored, publishing: undefined, thumbnail: undefined,
      scenes: sections.map((s, i) => ({ id: s.id.toLowerCase().replaceAll("_", "-"), type: "explanation" as const,
        timing: { from: s.id, ...(sections[i + 1] ? { until: sections[i + 1].id } : {}) },
        kicker: "SCRIPT REVIEW", title: s.id.replaceAll("_", " "),
        body: s.text.trim().split(/\r?\n\s*\r?\n/).map((t) => t.trim()),
      })),
      captions: sections.map((s) => ({ timing: { from: s.id }, text: `Estimated: ${s.id.replaceAll("_", " ")}` })),
    } satisfies AuthoredShortDefinition;
  }
  if (music) authored = { ...authored, audio: { ...authored.audio, music: { file: music } } };
  const resolved = resolveTiming(authored, proposal.timing);
  return { ...content, short: { ...resolved, timingProvenance: { mode: "preview-estimated" as const, publishable: false as const } } };
}
