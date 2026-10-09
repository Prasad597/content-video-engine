import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-009",
  channel: "noskip-learning",

  title: "Same Modification. One List Crashes. The Other Doesn't.",
  topic: "Fail-fast iteration vs CopyOnWriteArrayList snapshot iteration",

  narration: "content/short-009/audio/narration.mp3",

  scenes: [
    // ------------------------------------------------------------
    // HOOK
    // 0.000 -> 9.720
    // ------------------------------------------------------------
    {
      id: "hook",
      type: "comparison",

      timing: {
        from: "HOOK",
        until: "FAIL_FAST",
      },

      title: "SAME MODIFICATION",

      leftLabel: "ArrayList",
      leftValue: "CRASHES",

      rightLabel: "CopyOnWriteArrayList",
      rightValue: "KEEPS RUNNING",

      note: "WHY?",
    },

    // ------------------------------------------------------------
    // FAIL_FAST
    // 9.720 -> 19.720
    // ------------------------------------------------------------
    {
      id: "fail-fast",
      type: "diagram",

      timing: {
        from: "FAIL_FAST",
        until: "SECOND",
      },

      title: "ARRAYLIST ITERATOR",

      nodes: [
        {
          label: "Iterator",
          value: "looping...",
          at: within("FAIL_FAST", 0.08),
        },
        {
          label: "ArrayList",
          value: "structure changes",
          emphasis: true,
          at: within("FAIL_FAST", 0.30),
        },
        {
          label: "Iterator",
          value: "detects modification",
          emphasis: true,
          at: within("FAIL_FAST", 0.55),
        },
        {
          label: "RESULT",
          value: "ConcurrentModificationException",
          emphasis: true,
          at: within("FAIL_FAST", 0.76),
        },
      ],
    },

    // ------------------------------------------------------------
    // SECOND
    // 19.720 -> 25.580
    // ------------------------------------------------------------
    {
      id: "copy-on-write",
      type: "comparison",

      timing: {
        from: "SECOND",
        until: "WHY",
      },

      title: "NOW CHANGE THE LIST",

      leftLabel: "ArrayList",
      leftValue: "FAIL-FAST",

      rightLabel: "CopyOnWriteArrayList",
      rightValue: "LOOP CONTINUES",

      note: "What changed?",
    },

    // ------------------------------------------------------------
    // WHY
    // 25.580 -> 35.840
    // ------------------------------------------------------------
    {
      id: "snapshot",
      type: "diagram",

      timing: {
        from: "WHY",
        until: "TRADEOFF",
      },

      title: "THE ITERATOR HAS A SNAPSHOT",

      nodes: [
        {
          label: "ITERATOR",
          value: "reads Snapshot A",
          at: within("WHY", 0.05),
        },
        {
          label: "SNAPSHOT A",
          value: "[ A ][ B ][ C ]",
          emphasis: true,
          at: within("WHY", 0.22),
        },
        {
          label: "WRITE",
          value: "list.add(D)",
          emphasis: true,
          at: within("WHY", 0.45),
        },
        {
          label: "NEW ARRAY B",
          value: "[ A ][ B ][ C ][ D ]",
          emphasis: true,
          at: within("WHY", 0.65),
        },
        {
          label: "ITERATOR",
          value: "still reads Snapshot A",
          emphasis: true,
          at: within("WHY", 0.82),
        },
      ],
    },

    // ------------------------------------------------------------
    // TRADEOFF
    // 35.840 -> 41.840
    // ------------------------------------------------------------
    {
      id: "tradeoff",
      type: "rule",

      timing: {
        from: "TRADEOFF",
        until: "RULE",
      },

      title: "BUT THERE'S A COST",

      rows: [
        "Reads → cheap",
        "Writes → copy the array",
        "More writes → more copying",
      ],

      rowTimes: [
        within("TRADEOFF", 0.12),
        within("TRADEOFF", 0.38),
        within("TRADEOFF", 0.68),
      ],
    },

    // ------------------------------------------------------------
    // RULE
    // 41.840 -> 50.756
    // ------------------------------------------------------------
    {
      id: "rule",
      type: "rule",

      timing: {
        from: "RULE",
      },

      title: "REMEMBER",

      rows: [
        "ArrayList → fail-fast iterator",
        "CopyOnWriteArrayList → snapshot iterator",
        "Snapshot safety ≠ free writes",
      ],

      rowTimes: [
        within("RULE", 0.10),
        within("RULE", 0.38),
        within("RULE", 0.68),
      ],

      signatureAt: within("RULE", 0.86),
    },
  ],

  captions: [
    {
      timing: {
        from: "HOOK",
        until: "FAIL_FAST",
      },
      text: "Same modification. One crashes. The other doesn't.",
      emphasis: "crashes",
    },

    {
      timing: {
        from: "FAIL_FAST",
        until: "SECOND",
      },
      text: "ArrayList's iterator is fail-fast.",
      emphasis: "fail-fast",
    },

    {
      timing: {
        from: "SECOND",
        until: "WHY",
      },
      text: "CopyOnWriteArrayList can keep iterating.",
      emphasis: "CopyOnWriteArrayList",
    },

    {
      timing: {
        from: "WHY",
        until: "TRADEOFF",
      },
      text: "The iterator keeps reading its original snapshot.",
      emphasis: "snapshot",
    },

    {
      timing: {
        from: "TRADEOFF",
        until: "RULE",
      },
      text: "But writes require copying the array.",
      emphasis: "copying",
    },

    {
      timing: {
        from: "RULE",
      },
      text: "Different iteration behavior. Different trade-off.",
      emphasis: "trade-off",
    },
  ],

  publishing: {
    youtube: {
      title:
        "Same Modification. One Java List Crashes — The Other Doesn't 😳 | 11.AI",

      description:
        "Same modification. Two Java lists. One crashes — the other keeps running.\n\nArrayList iterators are fail-fast. If the list is structurally modified unexpectedly during iteration, you can get ConcurrentModificationException.\n\nCopyOnWriteArrayList behaves differently. Its iterator works on a snapshot of the underlying array. Later writes create a new copy instead of modifying the snapshot currently being traversed.\n\nBut there's a trade-off: writes require copying.\n\n#Java #JavaInterview #ArrayList #CopyOnWriteArrayList #Concurrency #Programming #NoSkipLearning",
    },

    instagram: {
      caption:
        "Same modification. One Java list crashes. The other keeps running. 🤯\n\nArrayList iterators are fail-fast. If the list is structurally modified unexpectedly during iteration, you can get ConcurrentModificationException.\n\nCopyOnWriteArrayList behaves differently.\n\nIts iterator works on a snapshot of the array. Later writes create a new copy, so the iterator can continue reading its original snapshot.\n\nBut there's a trade-off:\n\n✅ Stable snapshot iteration\n❌ Writes require copying\n\nSo CopyOnWriteArrayList isn't simply \"better\" — it solves a different problem.\n\n#Java #JavaInterview #ArrayList #CopyOnWriteArrayList #Concurrency #BackendDeveloper #Programming #NoSkipLearning",
    },
  },

  thumbnail: {
    eyebrow: "JAVA",
    headline: "ONE CRASHES.\nONE DOESN'T.",
    subheadline: "SAME MODIFICATION",
  },
};

export default short;