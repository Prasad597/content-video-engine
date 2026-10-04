import { contentV2, beats as v2Beats } from "./unchecked-exception-v2";

// Provenance only: never rendered as viewer-facing text.
export const metadataV3 = {
  contentId: "JAVA-001",
  brand: "NoSkipLearning",
  topic: "Java",
  contentType: "interview-question",
  language: "en",
  templateVersion: 3,
};

// Provisional visual schedule. The owner's processed recording will set the final
// scene boundaries; the composition duration follows the final scene automatically.
export const scenesV3 = [
  { id: "challenge", start: 0, end: 7 },
  { id: "concept", start: 7, end: 17 },
  { id: "execution", start: 17, end: 24 },
  { id: "hierarchy", start: 24, end: 32 },
  { id: "rule", start: 32, end: 39 },
];
export const beatsV3 = {
  ...v2Beats,
  but: 4.5,
  note: 6.5,
  brand: 5.8,
  execution: [...v2Beats.execution],
  hierarchy: [...v2Beats.hierarchy],
  examples: [...v2Beats.examples],
  rule: [...v2Beats.rule],
};
export const videoV3 = {
  id: "JavaUncheckedExceptionV3",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: Math.round(scenesV3[scenesV3.length - 1].end * 30),
};
export const contentV3: typeof contentV2 = {
  ...contentV2,
  id: "video_001_v3",
  scenes: scenesV3,
  captions: [
    { startMs: 1500, endMs: 3500, text: "Think about it.", emphasis: "Think" },
    { startMs: 7000, endMs: 9000, text: "Why?", emphasis: "Why" },
    {
      startMs: 10500,
      endMs: 12500,
      text: "The rule is simple.",
      emphasis: "simple",
    },
    {
      startMs: 17500,
      endMs: 19500,
      text: "Let’s see what happens.",
      emphasis: "happens",
    },
    {
      startMs: 19500,
      endMs: 21500,
      text: "getValue() returns zero.",
      emphasis: "zero",
    },
    {
      startMs: 24500,
      endMs: 26500,
      text: "Remember this for your interview.",
      emphasis: "Remember",
    },
  ],
};
const start = (id: string) => {
  const scene = scenesV3.find((scene) => scene.id === id);
  if (!scene) throw new Error(`Missing scene: ${id}`);
  return scene.start;
};
export const audioV3 = {
  narration: "audio/narration-v3-en.wav",
  music: "audio/music-v3.wav",
  volume: { narration: 1, sfx: 0.12, music: 0 },
  effects: [
    { file: "audio/sfx/question.wav", at: start("challenge"), duration: 0.5 },
    ...[0, 1, 2].map((i) => ({
      file: "audio/sfx/tick.wav",
      at:
        start("challenge") +
        beatsV3.options +
        (i * (beatsV3.answer - beatsV3.options)) / 3,
      duration: 0.2,
    })),
    {
      file: "audio/sfx/reveal.wav",
      at: start("challenge") + beatsV3.answer,
      duration: 0.65,
    },
    {
      file: "audio/sfx/exception.wav",
      at: start("challenge") + beatsV3.runtime,
      duration: 0.5,
    },
    {
      file: "audio/sfx/exception.wav",
      at: start("execution") + beatsV3.execution[4],
      duration: 0.5,
    },
    {
      file: "audio/sfx/takeaway.wav",
      at: start("rule") + beatsV3.rule[4],
      duration: 0.8,
    },
  ],
};
