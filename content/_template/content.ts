import type { ShortDefinition } from "../../src/engine/types";

export const templateShort: ShortDefinition = {
  id: "short-template",
  channel: "noskip-learning",
  title: "A short-form educational explanation",
  topic: "General topic",
  narration: "public/audio/narration-template.wav",
  scenes: [
    {
      id: "hook",
      type: "hook",
      start: 0,
      end: 3,
      kicker: "HOOK",
      title: "A clear, memorable question",
      subtitle: "Prompt the audience in the first few seconds.",
    },
    {
      id: "concept",
      type: "explanation",
      start: 3,
      end: 8,
      kicker: "CONCEPT",
      title: "Explain the core idea simply.",
      body: ["Keep the concept concrete.", "Use one memorable takeaway."],
    },
    {
      id: "code",
      type: "code",
      start: 8,
      end: 13,
      kicker: "CODE",
      code: ["int value = 42;", "System.out.println(value);"],
      activeLine: 1,
    },
    {
      id: "rule",
      type: "rule",
      start: 13,
      end: 18,
      kicker: "RULE",
      title: "The essential rule",
      rows: ["ONE KEY IDEA", "ONE ACTIONABLE TAKEAWAY"],
    },
    {
      id: "outro",
      type: "outro",
      start: 18,
      end: 21,
      kicker: "OUTRO",
      title: "Understand it. Then move on.",
    },
  ],
  captions: [
    { startMs: 0, endMs: 2000, text: "A clear, memorable question", emphasis: "question" },
    { startMs: 6000, endMs: 9000, text: "Explain the core idea simply.", emphasis: "simply" },
  ],
};
