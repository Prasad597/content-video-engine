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
  { id: "challenge", start: 0, end: 8 },
  { id: "concept", start: 8, end: 17 },
  { id: "execution", start: 17, end: 25 },
  { id: "hierarchy", start: 25, end: 33 },
  { id: "rule", start: 33, end: 42 },
];
export const beatsV3 = {
  ...v2Beats,
  options: 1.5,
  answer: 4.8,
  but: 6.7,
  runtime: 7.8,
  concept: 1.4,
  compiler: 3.2,
  emphasis: 4.8,
  catch: 6.1,
  throws: 7.2,
  note: 7.1,
  brand: 7.5,
  execution: [0, 1.7, 3.3, 4.8, 6.3],
  hierarchy: [0, 1.4, 3.1],
  examples: [4.8, 5.7, 6.6],
  rule: [0, 1.3, 2.6, 3.9, 5.5],
  support: 6.7,
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
    {
      startMs: 0,
      endMs: 2500,
      text: "Will this code compile?",
      emphasis: "compile",
    },
    {
      startMs: 3500,
      endMs: 5200,
      text: "Think about it.",
      emphasis: "Think",
    },
    {
      startMs: 7000,
      endMs: 10000,
      text: "Yes! It actually compiles.",
      emphasis: "compiles",
    },
    {
      startMs: 10400,
      endMs: 13500,
      text: "But if b becomes zero at runtime...",
      emphasis: "zero",
    },
    {
      startMs: 15000,
      endMs: 17600,
      text: "ArithmeticException.",
      emphasis: "ArithmeticException",
    },
    {
      startMs: 20500,
      endMs: 23300,
      text: "The compiler does NOT force you to catch it.",
      emphasis: "NOT",
    },
    {
      startMs: 24200,
      endMs: 27000,
      text: "Or declare it using throws.",
      emphasis: "throws",
    },
    {
      startMs: 29200,
      endMs: 31800,
      text: "getValue() returns zero.",
      emphasis: "zero",
    },
    {
      startMs: 31800,
      endMs: 34400,
      text: "Ten divided by zero...",
      emphasis: "zero",
    },
    {
      startMs: 34800,
      endMs: 38500,
      text: "RuntimeException subclasses are unchecked.",
      emphasis: "unchecked",
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

const interactiveThinkEnd = 3.3;
const interactiveExistingPause = 0.9;
const interactiveAdditionalSilence = 3 - interactiveExistingPause;

export const scenesV3Interactive = [
  { id: "challenge", start: 0, end: 11 },
  { id: "concept", start: 11, end: 20 },
  { id: "execution", start: 20, end: 28 },
  { id: "hierarchy", start: 28, end: 36 },
  { id: "rule", start: 36, end: 44.1 },
];

export const beatsV3Interactive = {
  ...beatsV3,
  options: interactiveThinkEnd,
  answer: interactiveThinkEnd + 3,
  but: interactiveThinkEnd + 5.4,
  runtime: interactiveThinkEnd + 6.9,
  concept: 1.8,
  compiler: 4.2,
  emphasis: 5.4,
  catch: 7.2,
  throws: 8.8,
  note: 10.4,
  brand: 10.9,
  execution: [0.9, 2.5, 4.2, 5.7, 7.6],
  hierarchy: [0.4, 1.9, 3.6],
  examples: [5.3, 6.3, 7.3],
  rule: [0.5, 2.1, 3.8, 5.3, 7.0],
  support: 8.1,
};

export const videoV3Interactive = {
  id: "JavaUncheckedExceptionV3Interactive",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: Math.round(
    scenesV3Interactive[scenesV3Interactive.length - 1].end * 30,
  ),
};

export const contentV3Interactive: typeof contentV2 = {
  ...contentV3,
  id: "video_001_v3_interactive",
  scenes: scenesV3Interactive,
  captions: [
    {
      startMs: 0,
      endMs: 2500,
      text: "Will this code compile?",
      emphasis: "compile",
    },
    {
      startMs: 3500,
      endMs: 5200,
      text: "Think about it.",
      emphasis: "Think",
    },
    {
      startMs: 6300,
      endMs: 8900,
      text: "Yes! It actually compiles.",
      emphasis: "compiles",
    },
    {
      startMs: 9100,
      endMs: 12400,
      text: "But if b becomes zero at runtime...",
      emphasis: "zero",
    },
    {
      startMs: 14000,
      endMs: 16700,
      text: "ArithmeticException.",
      emphasis: "ArithmeticException",
    },
    {
      startMs: 21700,
      endMs: 24400,
      text: "The compiler does NOT force you to catch it.",
      emphasis: "NOT",
    },
    {
      startMs: 25300,
      endMs: 28100,
      text: "Or declare it using throws.",
      emphasis: "throws",
    },
    {
      startMs: 30300,
      endMs: 32900,
      text: "getValue() returns zero.",
      emphasis: "zero",
    },
    {
      startMs: 32900,
      endMs: 35500,
      text: "Ten divided by zero...",
      emphasis: "zero",
    },
    {
      startMs: 35900,
      endMs: 39600,
      text: "RuntimeException subclasses are unchecked.",
      emphasis: "unchecked",
    },
  ],
};

const startInteractive = (id: string) => {
  const scene = scenesV3Interactive.find((scene) => scene.id === id);
  if (!scene) throw new Error(`Missing scene: ${id}`);
  return scene.start;
};

export const audioV3Interactive = {
  narration: "audio/narration-v3-interactive.wav",
  music: "audio/music-v3.wav",
  volume: { narration: 1, sfx: 0.12, music: 0 },
  effects: [
    { file: "audio/sfx/question.wav", at: startInteractive("challenge"), duration: 0.5 },
    ...[0, 1, 2].map((i) => ({
      file: "audio/sfx/tick.wav",
      at:
        startInteractive("challenge") +
        beatsV3Interactive.options +
        (i * (beatsV3Interactive.answer - beatsV3Interactive.options)) / 3,
      duration: 0.2,
    })),
    {
      file: "audio/sfx/reveal.wav",
      at: startInteractive("challenge") + beatsV3Interactive.answer,
      duration: 0.65,
    },
    {
      file: "audio/sfx/exception.wav",
      at: startInteractive("challenge") + beatsV3Interactive.runtime,
      duration: 0.5,
    },
    {
      file: "audio/sfx/exception.wav",
      at: startInteractive("execution") + beatsV3Interactive.execution[4],
      duration: 0.5,
    },
    {
      file: "audio/sfx/takeaway.wav",
      at: startInteractive("rule") + beatsV3Interactive.rule[4],
      duration: 0.8,
    },
  ],
};

export const interactiveNarrationTiming = {
  thinkEnd: interactiveThinkEnd,
  existingPause: interactiveExistingPause,
  additionalSilence: interactiveAdditionalSilence,
  totalThinkingPause: 3,
  insertionAt: interactiveThinkEnd,
};
