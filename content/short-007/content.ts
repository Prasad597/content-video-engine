import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-007",
  channel: "noskip-learning",
  title: "What happens when two HashMap keys have the same hash?",
  topic: "Java HashMap hash collisions",
  narration: "content/short-007/audio/narration.mp3",

  publishing: {
    youtube: {
      title: "Same hashCode = Same Key? HashMap Says NO 😳 | 11.AI",
      description: `Two different Java HashMap keys can return the exact same hashCode — and still remain completely different keys.

Why?

hashCode() helps HashMap locate the bucket.
equals() helps HashMap identify the correct key inside that bucket.

Same hash does NOT mean same key.

#Java #HashMap #JavaInterview #Programming #BackendDevelopment #NoSkipLearning`,
    },
    instagram: {
      caption: `Same hashCode = same key? ❌

That’s one of the easiest HashMap assumptions to get wrong.

Two different keys can have the same hash and still coexist inside the map.

🔹 hashCode() → helps locate the bucket
🔹 equals() → identifies the actual key

Same hash ≠ same key.

Save this for your next Java interview. ☕🧠

#Java #HashMap #JavaInterview #Programming #BackendDeveloper #SoftwareEngineering #NoSkipLearning`,
    },
  },

  thumbnail: {
    eyebrow: "JAVA / VISUAL DEBUGGER",
    headline: "SAME HASH.\nSAME KEY?",
    subheadline: "Different keys. One bucket.",
    diagram: {
      left: {
        label: "keyA",
        expression: "keyA.hashCode()",
        value: "42",
      },
      right: {
        label: "keyB",
        expression: "keyB.hashCode()",
        value: "42",
      },
      destination: "HashMap bucket",
      verdict: "×",
    },
  },

  scenes: [
    {
      id: "myth",
      type: "diagram",
      timing: {
        from: "MYTH",
        until: "BREAK",
      },
      kicker: "HASHMAP MYTH",
      nodes: [
        {
          label: "keyA.hashCode()",
          value: "42",
          at: within("MYTH", 0.08),
        },
        {
          label: "keyB.hashCode()",
          value: "42",
          at: within("MYTH", 0.32),
        },
        {
          label: "SAME HASH = SAME KEY?",
          at: within("MYTH", 0.62),
          emphasis: true,
        },
      ],
      note: "Does one overwrite the other?",
      noteAt: within("MYTH", 0.76),
    },

    {
      id: "break",
      type: "rule",
      timing: {
        from: "BREAK",
        until: "BUCKET",
      },
      kicker: "WRONG ❌",
      title: "Both keys can still exist",
      rows: [
        "keyA ≠ keyB",
        "Same hash ≠ same key",
      ],
      rowTimes: [
        within("BREAK", 0.18),
        within("BREAK", 0.48),
      ],
      note: "A hash collision does not make the keys equal.",
      noteAt: within("BREAK", 0.68),
      signatureAt: within("BREAK", 0.88),
    },

    {
      id: "bucket",
      type: "diagram",
      timing: {
        from: "BUCKET",
        until: "KEY_CHECK",
      },
      kicker: "HASH COLLISION",
      nodes: [
        {
          label: "keyA",
          value: "hash 42",
          at: within("BUCKET", 0.05),
        },
        {
          label: "keyB",
          value: "hash 42",
          at: within("BUCKET", 0.22),
        },
        {
          label: "bucket",
          value: "same destination",
          at: within("BUCKET", 0.48),
          emphasis: true,
        },
      ],
      note: "Different keys can land in the same bucket.",
      noteAt: within("BUCKET", 0.68),
    },

    {
      id: "key-check",
      type: "comparison",
      timing: {
        from: "KEY_CHECK",
        until: "RULE",
      },
      kicker: "NOW WHAT?",
      leftLabel: "hashCode()",
      leftValue: "Find bucket",
      rightLabel: "equals()",
      rightValue: "Find key",
      note: "equals() identifies which key is actually yours.",
    },

    {
      id: "rule",
      type: "rule",
      timing: {
        from: "RULE",
      },
      kicker: "INTERVIEW RULE",
      title: "Same hash ≠ Same key",
      rows: [
        "hashCode() → bucket",
        "equals() → key",
      ],
      rowTimes: [
        within("RULE", 0.15),
        within("RULE", 0.42),
      ],
      note: "Collision means same bucket — not same key.",
      noteAt: within("RULE", 0.64),
      signatureAt: within("RULE", 0.86),
    },
  ],

  captions: [
    {
      timing: {
        from: "MYTH",
        until: "BREAK",
      },
      text: "Same hashCode = same key?",
      emphasis: "same key",
    },
    {
      timing: {
        from: "BREAK",
        until: "BUCKET",
      },
      text: "Wrong. Both keys can still exist.",
      emphasis: "Wrong",
    },
    {
      timing: {
        from: "BUCKET",
        until: "KEY_CHECK",
      },
      text: "Different keys can land in the same bucket.",
      emphasis: "same bucket",
    },
    {
      timing: {
        from: "KEY_CHECK",
        until: "RULE",
      },
      text: "equals() identifies the correct key.",
      emphasis: "equals()",
    },
    {
      timing: {
        from: "RULE",
      },
      text: "hashCode finds the bucket. equals finds the key.",
      emphasis: "bucket",
    },
  ],
};

export default short;