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
export function validateAlignment(a: AlignmentResult) {
  if (a.version !== 1 || a.language !== "en" || !/^[a-f0-9]{64}$/.test(a.audioHash) ||
      !/^[a-f0-9]{64}$/.test(a.scriptHash) || !a.audio || a.audio.includes("..") ||
      a.audio.startsWith("/") || a.audio.includes(":") ||
      !Number.isFinite(a.duration) || a.duration <= 0 || !a.words?.length)
    throw new Error("Invalid normalized alignment metadata");
  let previous = 0;
  for (const w of a.words) {
    if (!w.text || !Number.isFinite(w.start) || !Number.isFinite(w.end) ||
        w.start < previous || w.end <= w.start || w.end > a.duration ||
        (w.confidence !== undefined && (!Number.isFinite(w.confidence) || w.confidence < 0 || w.confidence > 1)))
      throw new Error(`Invalid word timestamp: ${w.text}`);
    previous = w.end;
  }
}
export function resolveBeats(script: ReturnType<typeof parseScript>, a: AlignmentResult): BeatFile {
  validateAlignment(a);
  if (script.scriptHash !== a.scriptHash) throw new Error("Script changed since alignment");
  const expected = script.sections.flatMap((s) => s.words);
  const heard = a.words.flatMap((word, index) => tokens(word.text).map((text) => ({ text, index })));
  // Global monotonic matching disambiguates repeated words without estimating time.
  const dp = Array.from({ length: expected.length + 1 }, () => new Uint16Array(heard.length + 1));
  for (let i = expected.length - 1; i >= 0; i--)
    for (let j = heard.length - 1; j >= 0; j--)
      dp[i][j] = expected[i] === heard[j].text ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
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
      throw new Error(`Could not reliably align semantic beat ${section.id}. Check script/audio wording and recognized words; no guessed timing was written.`);
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
