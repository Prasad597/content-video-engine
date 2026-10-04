import { content as original, type CaptionCue } from "./unchecked-exception";

export const videoV2 = {
  id: "JavaUncheckedExceptionV2",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 1170,
};
export const contentV2 = {
  id: "video_001_v2",
  question: "Will this code\ncompile?",
  code: [
    "int a = 10;",
    "int b = getValue();",
    "",
    "System.out.println(a / b);",
  ],
  codeContext: "getValue() returns an int at runtime.",
  choices: ["Compilation Error", "Compiles Successfully"],
  answer: "It compiles.",
  exception: original.exception,
  why: "Why didn’t Java\nforce us to handle it?",
  concept: "UNCHECKED\nEXCEPTION",
  definition: {
    lead: "The compiler",
    emphasis: "does NOT",
    action: "require you to",
  },
  handling: ["catch", "declare with throws"],
  execution: [
    "Read the numerator",
    "Call getValue()",
    "This run returns zero",
    "Execute integer division",
    "Exception thrown",
  ],
  hierarchy: original.hierarchy,
  examples: original.examples,
  rule: ["RuntimeException", "+", "its subclasses", "=", "UNCHECKED"],
  support: "No mandatory catch or throws.",
  note: "RuntimeException branch shown.\nError subclasses are also unchecked.",
  scenes: [
    { id: "challenge", start: 0, end: 7 },
    { id: "concept", start: 7, end: 17 },
    { id: "execution", start: 17, end: 24 },
    { id: "hierarchy", start: 24, end: 32 },
    { id: "rule", start: 32, end: 39 },
  ],
  // Editorial phrase captions: the prominent technical words live in the scene.
  // Align these cues to the actual external recording when it is supplied.
  captions: [
    { startMs: 1500, endMs: 3500, text: "Mee answer?", emphasis: "answer" },
    { startMs: 7000, endMs: 9000, text: "Mari enduku?", emphasis: "enduku" },
    {
      startMs: 10500,
      endMs: 12500,
      text: "Compiler em cheyyadu?",
      emphasis: "Compiler",
    },
    {
      startMs: 13500,
      endMs: 15500,
      text: "Handle cheyyamani force cheyyadu.",
      emphasis: "force",
    },
    { startMs: 17500, endMs: 19500, text: "Oka run chuddam.", emphasis: "run" },
    {
      startMs: 19500,
      endMs: 21500,
      text: "Ippudu b value zero.",
      emphasis: "zero",
    },
    {
      startMs: 24500,
      endMs: 26500,
      text: "Ee family ni chudandi.",
      emphasis: "family",
    },
    {
      startMs: 28000,
      endMs: 30500,
      text: "Ivanni subclasses.",
      emphasis: "subclasses",
    },
    {
      startMs: 32000,
      endMs: 34500,
      text: "Interview lo idi gurthupettukondi.",
      emphasis: "gurthupettukondi",
    },
  ] satisfies CaptionCue[],
};

// Seconds local to each scene. Shared with validation, SFX and visual review.
export const beats = {
  options: 1.5,
  answer: 3.5,
  runtime: 5.2,
  concept: 2,
  compiler: 3.5,
  emphasis: 5,
  catch: 6.5,
  throws: 8,
  execution: [0, 1.3, 2.6, 4, 5.2],
  hierarchy: [0, 1.2, 2.6],
  examples: [4.2, 5.2, 6.2],
  rule: [0, 1, 1.5, 2.5, 3.2],
  support: 5,
};

export const audioV2 = {
  narration: "audio/narration-v2.mp3",
  music: "audio/music-v2.mp3",
  // Optional music is muted by default. Keep normalized SFX/music below voice.
  volume: { narration: 1, sfx: 0.12, music: 0 },
  effects: [
    { file: "audio/sfx/question.wav", at: 0, duration: 0.5 },
    ...[1.5, 2.1666666667, 2.8333333333].map((at) => ({
      file: "audio/sfx/tick.wav",
      at,
      duration: 0.2,
    })),
    { file: "audio/sfx/reveal.wav", at: beats.answer, duration: 0.65 },
    { file: "audio/sfx/exception.wav", at: beats.runtime, duration: 0.5 },
    {
      file: "audio/sfx/exception.wav",
      at: 17 + beats.execution[4],
      duration: 0.5,
    },
    { file: "audio/sfx/takeaway.wav", at: 32 + beats.rule[4], duration: 0.8 },
  ],
};
