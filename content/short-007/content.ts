import type { ShortDefinition } from "../../src/engine/types";

const short: ShortDefinition = {
  id: "short-007",
  channel: "noskip-learning",
  title: "A clear educational question",
  topic: "Your topic",
  narration: "content/short-007/audio/narration.mp3",
  scenes: [
    {
      id: "question",
      type: "hook",
      start: 0,
      end: 7,
      kicker: "QUICK QUESTION",
      title: "What explains this?",
      choices: ["First explanation", "Second explanation"],
      countdown: { start: 1, end: 4, count: 3 },
      reveals: [{ at: 4, text: "Here is the key idea.", tone: "accent" }],
    },
    {
      id: "explain",
      type: "explanation",
      start: 7,
      end: 16,
      kicker: "THE IDEA",
      title: "One concept at a time",
      reveals: [
        { at: 0.5, text: "Start with what you know." },
        { at: 3, text: "Connect cause and effect." },
        { at: 6, text: "Check your understanding.", tone: "accent" },
      ],
    },
    {
      id: "diagram",
      type: "diagram",
      start: 16,
      end: 25,
      kicker: "HOW IT WORKS",
      nodes: [
        { label: "Starting point", at: 0 },
        { label: "A meaningful change", at: 2 },
        { label: "Observable result", at: 4, emphasis: true },
      ],
      note: "Replace this with your explanation.",
      noteAt: 6,
    },
    {
      id: "takeaway",
      type: "rule",
      start: 25,
      end: 35,
      kicker: "REMEMBER",
      title: "The takeaway",
      rows: ["One clear idea", "One useful takeaway"],
      rowTimes: [0, 2],
      note: "Apply it to a new example.",
      noteAt: 4,
      signatureAt: 7,
    },
  ],
  captions: [
    {
      startMs: 1000,
      endMs: 4000,
      text: "Take a moment to decide.",
      emphasis: "decide",
    },
  ],
};
export default short;
