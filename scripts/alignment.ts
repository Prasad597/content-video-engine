import { createHash } from "node:crypto";

export type AlignmentResult = {
  version: 1; audio: string; audioHash: string; scriptHash: string;
  duration: number; language: "en";
  words: { text: string; start: number; end: number; confidence?: number }[];
};
export type BeatFile = Omit<AlignmentResult, "words"> & {
  beats: Record<string, { start: number; end: number; confidence?: number }>;
};
export const hash = (input: string | Buffer) => createHash("sha256").update(input).digest("hex");
export const tokens = (text: string) =>
  text.normalize("NFKC").toLowerCase().replace(/[’']/g, "").match(/[\p{L}\p{N}]+/gu) ?? [];
export function parseScript(script: string, minimumSectionWords = 3) {
  const sections: { id: string; text: string; words: string[] }[] = [];
  // ALL_CAPS identifiers are ours. Lowercase delivery directions are unspoken.
  const parts = script.split(/(\[[^\]\r\n]+\])/g);
  for (const part of parts) {
    const tag = /^\[([^\]]+)\]$/.exec(part)?.[1];
    if (tag) {
      if (/^[A-Z][A-Z0-9_]*$/.test(tag)) {
        if (sections.some((s) => s.id === tag)) throw new Error(`Duplicate semantic marker ${tag}`);
        sections.push({ id: tag, text: "", words: [] });
      } else if (!/^[a-z][a-z ,.-]*$/.test(tag)) {
        throw new Error(`Invalid script marker [${tag}]`);
      }
    } else if (part.trim()) {
      if (!sections.length) throw new Error("Spoken script needs an opening [SEMANTIC_MARKER]");
      sections.at(-1)!.text += ` ${part}`;
    }
  }
  if (!sections.length) throw new Error("No semantic markers in script.txt");
  sections.forEach((s) => {
    s.words = tokens(s.text);
    if (s.words.length < minimumSectionWords) throw new Error(`Semantic beat ${s.id} needs at least ${minimumSectionWords} spoken words`);
  });
  const normalized = sections.map(({ id, words }) => `[${id}] ${words.join(" ")}`).join("\n");
  return { sections, normalized, scriptHash: hash(normalized), text: sections.map((s) => s.words.join(" ")).join(" ") };
}
function validateAlignmentMetadata(a: AlignmentResult) {
  if (a.version !== 1 || a.language !== "en" || !/^[a-f0-9]{64}$/.test(a.audioHash) ||
      !/^[a-f0-9]{64}$/.test(a.scriptHash) || !a.audio || a.audio.includes("..") ||
      a.audio.startsWith("/") || a.audio.includes(":") ||
      !Number.isFinite(a.duration) || a.duration <= 0 || !a.words?.length)
    throw new Error("Invalid normalized alignment metadata");
}
export function validateAlignment(a: AlignmentResult) {
  validateAlignmentMetadata(a);
  let previous = 0;
  for (const w of a.words) {
    if (!w.text || !Number.isFinite(w.start) || !Number.isFinite(w.end) ||
        w.start < previous || w.end < w.start || w.end > a.duration ||
        (w.confidence !== undefined && (!Number.isFinite(w.confidence) || w.confidence < 0 || w.confidence > 1)))
      throw new Error(`Invalid word timestamp: ${w.text}`);
    previous = w.end;
  }
  for (const { first, last } of pointRuns(a)) {
    const before = a.words[first - 1], after = a.words[last + 1];
    if (!before || !after || after.start - before.end > 1)
      throw new Error(`Unusable zero-duration region: ${a.words[first].text} (indices ${first}–${last}); requires surrounding positive-duration words within 1 second`);
  }
}
function pointRuns(a: AlignmentResult) {
  const runs: { first: number; last: number }[] = [];
  for (let i = 0; i < a.words.length; i++) {
    if (a.words[i].start !== a.words[i].end) continue;
    const first = i;
    while (i + 1 < a.words.length && a.words[i + 1].start === a.words[i + 1].end) i++;
    runs.push({ first, last: i });
  }
  return runs;
}
function reportPoints(a: AlignmentResult, warn: (message: string) => void) {
  for (const { first, last } of pointRuns(a))
    warn(`Retained bounded zero-duration observations: indices ${first}–${last} (${a.words.slice(first, last + 1).map((w) => w.text).join(" ")}) at ${a.words[first].start}–${a.words[last].end}s; excluded from semantic matching/timing evidence.`);
}
// Adapter-boundary repair only. Stored alignments and semantic resolution still
// use the strict validator above; rendering never silently repairs timestamps.
export function recoverWordTimestamps(a: AlignmentResult, warn: (message: string) => void = console.warn): AlignmentResult {
  validateAlignmentMetadata(a);
  const invalid: number[] = [];
  const fail = (index: number, reason: string): never => {
    throw new Error(`Invalid word timestamp: ${a.words[index]?.text ?? "<missing>"} (index ${index}): ${reason}. Inspect recognized words/audio; no guessed timing was written.`);
  };
  let previousValid = -1;
  a.words.forEach((w, i) => {
    if (!w || !w.text || (w.confidence !== undefined && (!Number.isFinite(w.confidence) || w.confidence < 0 || w.confidence > 1)))
      fail(i, "invalid word text/confidence is not a timestamp repair");
    if (!Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < 0 || w.end < w.start || w.end > a.duration) {
      invalid.push(i);
    } else {
      if (previousValid >= 0 && w.start < a.words[previousValid].end)
        fail(i, `non-monotonic valid neighbors (${a.words[previousValid].end} > ${w.start}); valid timestamps cannot be moved`);
      previousValid = i;
    }
  });
  if (!invalid.length) { validateAlignment(a); reportPoints(a, warn); return a; }
  // Deliberately small repair budget for Short narration. Do not reconstruct a
  // broadly damaged transcript, or distribute words across an unexplained pause.
  if (invalid.length > 3) fail(invalid[0], `too many invalid words (${invalid.length}; maximum 3)`);
  const words = a.words.map((w) => ({ ...w }));
  const diagnostics: string[] = [];
  for (let k = 0; k < invalid.length;) {
    const first = invalid[k];
    let last = first;
    while (k + 1 < invalid.length && invalid[k + 1] === last + 1) last = invalid[++k];
    const before = words[first - 1], after = words[last + 1];
    if (!before || !after) fail(first, "missing valid previous/following word bounds");
    if (before.start === before.end || after.start === after.end) fail(first, "zero-duration observations cannot bound malformed timestamp recovery");
    const left = before.end, right = after.start;
    const gap = right - left;
    if (!(gap > 0) || gap > 1) fail(first, `unusable neighboring interval [${left}, ${right}] (${gap === 0 ? "zero width" : "must be positive and at most 1 second"})`);
    const count = last - first + 1;
    for (let i = first; i <= last; i++) {
      words[i].start = left + gap * (i - first) / count;
      words[i].end = i === last ? right : left + gap * (i - first + 1) / count;
      diagnostics.push(`Recovered invalid word timestamp: ${words[i].text} (index ${i}) -> ${words[i].start.toFixed(6)}–${words[i].end.toFixed(6)}; neighbor bounds [${left}, ${right}]`);
    }
    k++;
  }
  const recovered = { ...a, words };
  validateAlignment(recovered); // Includes bounds, confidence and overlap checks.
  diagnostics.forEach(warn);
  reportPoints(recovered, warn);
  return recovered;
}
export function resolveBeats(script: ReturnType<typeof parseScript>, a: AlignmentResult): BeatFile {
  validateAlignment(a);
  if (script.scriptHash !== a.scriptHash) throw new Error("Script changed since alignment");
  const expected = script.sections.flatMap((s) => s.words);
  // Keep raw recognized text/order in the contract, but never use point-only
  // observations as lexical/confidence/anchor evidence. In particular a spurious
  // zero-duration repetition must not displace a later measured phrase in LCS.
  const heard = a.words.flatMap((word, index) => word.end > word.start
    ? tokens(word.text).map((text) => ({ text, index })) : []);
  // Global monotonic matching disambiguates repeated words without estimating time.
  const dp = Array.from({ length: expected.length + 1 }, () => new Uint16Array(heard.length + 1));
  for (let i = expected.length - 1; i >= 0; i--)
    for (let j = heard.length - 1; j >= 0; j--)
      dp[i][j] = expected[i] === heard[j].text ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
  // Prefix + suffix scores identify all equally optimal opening-word locations,
  // not just the one selected by the deterministic LCS traversal below.
  const prefix = Array.from({ length: expected.length + 1 }, () => new Uint16Array(heard.length + 1));
  for (let i = 0; i < expected.length; i++)
    for (let j = 0; j < heard.length; j++)
      prefix[i + 1][j + 1] = expected[i] === heard[j].text ? 1 + prefix[i][j]
        : Math.max(prefix[i][j + 1], prefix[i + 1][j]);
  const matched = new Map<number, number>();
  for (let i = 0, j = 0; i < expected.length && j < heard.length;) {
    if (expected[i] === heard[j].text) { matched.set(i++, heard[j++].index); }
    else if (dp[i + 1][j] > dp[i][j + 1]) i++;
    else j++;
  }
  const beats: BeatFile["beats"] = {};
  let offset = 0;
  for (const section of script.sections) {
    const indices = section.words.map((_, i) => matched.get(offset + i));
    const anchor = indices.slice(0, Math.min(5, indices.length));
    const present = indices.filter((i): i is number => i !== undefined);
    const first = indices[0];
    const anchorWords = anchor.filter((i): i is number => i !== undefined).map((i) => a.words[i]);
    const probabilities = anchorWords.flatMap((w) => w.confidence === undefined ? [] : [w.confidence]);
    const confidence = probabilities.length ? probabilities.reduce((x, y) => x + y, 0) / probabilities.length : undefined;
    if (first === undefined || present.length / indices.length < 0.7 ||
        anchorWords.length < Math.min(3, anchor.length) ||
        (confidence !== undefined && confidence < 0.6) ||
        anchorWords.at(-1)!.end - anchorWords[0].start > 5)
      throw new Error(`Could not reliably align semantic beat ${section.id}. Measured text coverage ${(present.length / indices.length).toFixed(3)} (minimum 0.7); opening word ${first === undefined ? "unavailable" : "measured"}; anchor words ${anchorWords.length}/${Math.min(3, anchor.length)} required; confidence ${confidence === undefined ? "unavailable" : confidence.toFixed(6) + " (minimum 0.6)"}. Check script/audio wording and recognized words; no guessed timing was written.`);
    const candidates = new Set(heard.flatMap((word, j) =>
      word.text === section.words[0] && prefix[offset][j] + 1 + dp[offset + 1][j + 1] === dp[0][0]
        ? [word.index] : []));
    if (candidates.size > 1)
      throw new Error(`Ambiguous semantic beat ${section.id}: equally optimal opening-word candidates at ${[...candidates].slice(0, 5).map((i) => `${a.words[i].start.toFixed(3)}s (word ${i})`).join(", ")}${candidates.size > 5 ? ", …" : ""}. Text order does not uniquely establish this boundary; no guessed timing was written.`);
    beats[section.id] = { start: a.words[first].start, end: a.duration,
      ...(confidence === undefined ? {} : { confidence }) };
    offset += section.words.length;
  }
  const ordered = Object.values(beats);
  ordered.forEach((beat, i) => {
    beat.end = ordered[i + 1]?.start ?? a.duration;
    if (beat.end <= beat.start) throw new Error(`Could not reliably order semantic beat ${Object.keys(beats)[i]}`);
  });
  const { words: _, ...metadata } = a;
  return { ...metadata, beats };
}
