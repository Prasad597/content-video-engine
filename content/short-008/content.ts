import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-008",
  channel: "noskip-learning",

  title:
    "LinkedList Should Be Faster… So Why Did ArrayList Win? 🤯 | 11.AI",

  topic: "ArrayList vs LinkedList insertion performance",

  narration: "content/short-008/audio/narration.mp3",

  scenes: [
    // ============================================================
    // HOOK
    // 0.000 -> 8.600
    // ============================================================
    {
      id: "hook",
      type: "comparison",

      timing: {
        from: "HOOK",
        until: "WHY",
      },

      leftLabel: "LinkedList",
      leftValue: "Insertion O(1) ✓",

      rightLabel: "ArrayList",
      rightValue: "WINNER?!",

      note: "But ArrayList can still win.",
    },

    // ============================================================
    // WHY
    // 8.600 -> 14.600
    // ============================================================
    {
      id: "why",
      type: "diagram",

      timing: {
        from: "WHY",
        until: "SEARCH",
      },

      title: "THE CATCH",

      nodes: [
        {
          label: "A",
          at: within("WHY", 0.08),
        },
        {
          label: "B",
          at: within("WHY", 0.18),
        },
        {
          label: "C",
          emphasis: true,
          at: within("WHY", 0.3),
        },
        {
          label: "D",
          at: within("WHY", 0.42),
        },
        {
          label: "E",
          at: within("WHY", 0.54),
        },
      ],

      note: "O(1) insertion — AFTER you reach the node.",

      noteAt: within("WHY", 0.64),
    },

    // ============================================================
    // SEARCH
    // 14.600 -> 22.960
    // ============================================================
    {
      id: "search",
      type: "comparison",

      timing: {
        from: "SEARCH",
        until: "REALITY",
      },

      leftLabel: "ArrayList",

      leftValue:
        "[0] [1] [2] [3] [4]\n" +
        "         ↑\n" +
        "   DIRECT ACCESS",

      rightLabel: "LinkedList",

      rightValue:
        "A → B → C → D → E\n" +
        "        ↑\n" +
        "    TRAVERSAL",

      note: "Finding the insertion position matters.",
    },

    // ============================================================
    // REALITY
    // 22.960 -> 28.720
    // ============================================================
    {
      id: "reality",
      type: "comparison",

      timing: {
        from: "REALITY",
        until: "RULE",
      },

      leftLabel: "ArrayList",
      leftValue: "[A][B][C][D][E]",

      rightLabel: "LinkedList",
      rightValue: "[A] → [B] → [C] → [D]",

      note: "Contiguous data is generally more CPU-cache friendly.",
    },

    // ============================================================
    // RULE
    // 28.720 -> END
    // ============================================================
    {
      id: "rule",
      type: "rule",

      timing: {
        from: "RULE",
      },

      title: "DON'T MEMORIZE THIS",

      rows: [
        "❌ Insertions → LinkedList",
        "✓ Access pattern matters",
        "✓ Insertion position matters",
        "✓ Real workload matters",
      ],

      rowTimes: [
        within("RULE", 0.08),
        within("RULE", 0.35),
        within("RULE", 0.5),
        within("RULE", 0.65),
      ],

      signatureAt: within("RULE", 0.82),
    },
  ],

  // ============================================================
  // CAPTIONS
  //
  // IMPORTANT:
  // Every emphasis value below exists literally inside its text.
  // ============================================================
  captions: [
    {
      timing: {
        from: "HOOK",
        until: "WHY",
      },

      text:
        "LinkedList should be faster for inserting elements than ArrayList. But ArrayList can still win.",

      emphasis: "ArrayList can still win",
    },

    {
      timing: {
        from: "WHY",
        until: "SEARCH",
      },

      text:
        "LinkedList insertion is cheap only after you're already at the correct node.",

      emphasis: "correct node",
    },

    {
      timing: {
        from: "SEARCH",
        until: "REALITY",
      },

      text:
        "If you insert by index, LinkedList may first have to walk through the list.",

      emphasis: "walk through the list",
    },

    {
      timing: {
        from: "REALITY",
        until: "RULE",
      },

      text:
        "ArrayList stores elements close together, which is generally much friendlier to the CPU cache.",

      emphasis: "CPU cache",
    },

    {
      timing: {
        from: "RULE",
      },

      text:
        "Don't memorize: Insertions? Use LinkedList. It depends on how you're accessing and inserting the data.",

      emphasis: "It depends",
    },
  ],

  // ============================================================
  // PUBLISHING
  // ============================================================
  publishing: {
    youtube: {
      title:
        "LinkedList Should Be Faster… So Why Did ArrayList Win? 🤯 | 11.AI",

      description:
        "LinkedList insertion is O(1), so it should always beat ArrayList... right?\n\n" +
        "Not necessarily.\n\n" +
        "LinkedList may first need to traverse the list to reach the insertion position, while ArrayList provides direct indexed access and generally benefits from better cache locality.\n\n" +
        "The interview rule to remember: don't choose a collection from Big-O alone — understand the actual access pattern and workload.\n\n" +
        "#Java #ArrayList #LinkedList #JavaInterview #Programming #BackendDevelopment #NoSkipLearning",
    },

    instagram: {
      caption:
        "LinkedList insertion is O(1)... so it must be faster than ArrayList, right? 🤔\n\n" +
        "Not necessarily.\n\n" +
        "The missing detail is HOW you reach the insertion position.\n\n" +
        "🔹 LinkedList may need traversal first\n" +
        "🔹 ArrayList provides direct indexed access\n" +
        "🔹 ArrayList generally has better cache locality\n\n" +
        "So don't memorize:\n" +
        "❌ Insertions → LinkedList\n\n" +
        "The real answer depends on the access pattern and workload.\n\n" +
        "Save this for your next Java interview. ☕🧠\n\n" +
        "#Java #ArrayList #LinkedList #JavaInterview #Programming #BackendDeveloper #SoftwareEngineering #NoSkipLearning",
    },
  },

  // ============================================================
  // THUMBNAIL
  // ============================================================
  thumbnail: {
    headline: "LinkedList SHOULD WIN",
    subheadline: "So why did ArrayList win?",
  },
};

export default short;