import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

const duration = (beat: keyof typeof measured.beats) =>
  measured.beats[beat].end - measured.beats[beat].start;
const within = (beat: keyof typeof measured.beats, fraction: number) =>
  duration(beat) * fraction;
const caption = (
  beat: keyof typeof measured.beats,
  from: number,
  until: number,
  text: string,
  emphasis: string,
) => ({
  startMs: Math.round(
    (measured.beats[beat].start + duration(beat) * from) * 1000,
  ),
  endMs: Math.round(
    (measured.beats[beat].start + duration(beat) * until) * 1000,
  ),
  text,
  emphasis,
});

const short: AuthoredShortDefinition = {
  id: "short-011",
  channel: "noskip-learning",
  title: "Find the Single Number With XOR",
  topic: "XOR, duplicate cancellation, and constant-space algorithms",
  narration: "content/short-011/audio/narration.mp3",
  visualLeadMs: 200,
  publishing: {
    youtube: {
      title: "Find the Single Number With XOR | Java DSA",
      description:
        "Find the value that appears once in [4, 1, 2, 1, 2]. XOR cancels duplicate pairs in one pass, using O(n) time and O(1) extra space.",
    },
    instagram: {
      caption:
        "One number appears once: [4, 1, 2, 1, 2]. XOR makes duplicate pairs cancel. One pass, O(1) extra space.",
    },
  },
  scenes: [
    {
      id: "puzzle",
      type: "hook",
      timing: { from: "HOOK", until: "REVEAL" },
      kicker: "SINGLE NUMBER",
      title: "WHICH NUMBER\nAPPEARS ONCE?",
      code: {
        language: "java",
        code: ["int[] nums = {4, 1, 2, 1, 2};"],
      },
      reveals: [
        {
          at: within("HOOK", 0.42),
          text: "Every other value appears twice.",
        },
        {
          at: within("HOOK", 0.68),
          text: "NO HASHMAP. NO SORTING.",
          tone: "accent",
        },
        {
          at: within("HOOK", 0.84),
          text: "CONSTANT EXTRA SPACE",
          tone: "accent",
        },
      ],
    },
    {
      id: "xor-reveal",
      type: "code",
      timing: { from: "REVEAL", until: "WHY" },
      kicker: "THE SHORTCUT",
      code: [
        "int answer = 0;",
        "for (int value : nums) {",
        "    answer ^= value;",
        "}",
      ],
      activeLine: 0,
      steps: [
        {
          at: within("REVEAL", 0.05),
          activeLine: 0,
          status: "Start with zero.",
          values: ["answer = 0"],
        },
        {
          at: within("REVEAL", 0.32),
          activeLine: 2,
          status: "XOR every number in the array.",
          values: ["answer ^= value"],
        },
        {
          at: within("REVEAL", 0.72),
          activeLine: 2,
          status: "One pass through the array.",
        },
      ],
    },
    {
      id: "xor-properties",
      type: "diagram",
      timing: { from: "WHY", until: "RESULT" },
      kicker: "WHY XOR WORKS",
      title: "Duplicate pairs cancel",
      nodes: [
        {
          label: "x ^ x",
          value: "= 0",
          at: within("WHY", 0.05),
        },
        {
          label: "0 ^ x",
          value: "= x",
          at: within("WHY", 0.32),
          emphasis: true,
        },
        {
          label: "DUPLICATES",
          value: "cancel to zero",
          at: within("WHY", 0.62),
        },
      ],
      note: "XOR the whole array; the unpaired value remains.",
      noteAt: within("WHY", 0.83),
    },
    {
      id: "cancellation-result",
      type: "diagram",
      timing: { from: "RESULT", until: "RULE" },
      kicker: "WATCH THE PAIRS CANCEL",
      title: "4 ^ 1 ^ 2 ^ 1 ^ 2",
      nodes: [
        {
          label: "4 ^ (1 ^ 1) ^ (2 ^ 2)",
          value: "Group equal pairs",
          at: within("RESULT", 0.04),
        },
        {
          label: "4 ^ 0 ^ 0",
          value: "1 ^ 1 = 0   ·   2 ^ 2 = 0",
          at: within("RESULT", 0.34),
        },
        {
          label: "4",
          value: "THE SINGLE NUMBER",
          at: within("RESULT", 0.72),
          emphasis: true,
        },
      ],
      note: "Only four remains.",
      noteAt: within("RESULT", 0.88),
    },
    {
      id: "complexity-rule",
      type: "rule",
      timing: { from: "RULE" },
      kicker: "INTERVIEW TAKEAWAY",
      title: "Single Number with XOR",
      rows: ["ONE LOOP", "O(n) TIME", "O(1) EXTRA SPACE"],
      rowTimes: [
        within("RULE", 0.04),
        within("RULE", 0.24),
        within("RULE", 0.47),
      ],
      note: "Sometimes the trick isn't a data structure. It's an operation.",
      noteAt: within("RULE", 0.68),
      signatureAt: within("RULE", 0.9),
    },
  ],
  captions: [
    caption("HOOK", 0, 0.07, "Five numbers.", "numbers"),
    caption("HOOK", 0.07, 0.26, "4, 1, 2, 1, 2.", "2"),
    caption(
      "HOOK",
      0.26,
      0.49,
      "Every number appears twice, except one.",
      "except one",
    ),
    caption("HOOK", 0.49, 0.61, "Find that number.", "that number"),
    caption("HOOK", 0.61, 0.78, "No HashMap. No sorting.", "No sorting"),
    caption(
      "HOOK",
      0.78,
      0.91,
      "Only constant extra space.",
      "constant extra space",
    ),
    caption("HOOK", 0.91, 1, "Can you solve it?", "solve it"),
    caption("REVEAL", 0, 0.26, "Here's the shortcut.", "shortcut"),
    caption("REVEAL", 0.26, 0.48, "Use XOR.", "XOR"),
    caption(
      "REVEAL",
      0.48,
      1,
      "XOR every number in the array.",
      "every number",
    ),
    caption(
      "WHY",
      0,
      0.34,
      "A number XOR itself becomes zero.",
      "becomes zero",
    ),
    caption(
      "WHY",
      0.34,
      0.69,
      "Zero XOR any number gives that number back.",
      "that number back",
    ),
    caption(
      "WHY",
      0.69,
      1,
      "Duplicate pairs cancel each other.",
      "cancel",
    ),
    caption("RESULT", 0, 0.33, "One XOR one becomes zero.", "zero"),
    caption("RESULT", 0.33, 0.66, "Two XOR two becomes zero.", "zero"),
    caption("RESULT", 0.66, 1, "Only four remains.", "four"),
    caption("RULE", 0, 0.24, "One loop. Linear time.", "Linear time"),
    caption("RULE", 0.24, 0.54, "Constant extra space.", "extra space"),
    caption(
      "RULE",
      0.54,
      1,
      "The trick isn't a data structure. It's an operation.",
      "an operation",
    ),
  ],
};

export default short;
