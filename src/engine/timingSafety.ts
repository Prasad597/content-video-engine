// Legacy measured artifacts have no mode field; their provenance is verified by
// exact recomputation. A preview marker is never valid production provenance.
export function assertPublishableTiming(value: unknown) {
  if (!value || typeof value !== "object") return;
  const v = value as Record<string, unknown>;
  if ("mode" in v || "publishable" in v || "timingProvenance" in v || v.source === "preview-estimated")
    throw new Error("Preview/unknown timing provenance is not publishable; obtain measured alignment or explicit human approval");
}
