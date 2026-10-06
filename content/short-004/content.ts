import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

// Existing scene-local reveal properties use seconds. Pace them within the
// measured beat span; scene/caption boundaries remain semantic references.
const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-004",
  channel: "noskip-learning",
  title: "Why is String immutable in Java?",
  topic: "Java String immutability: objects, references, String Pool, and stable hashing",
  narration: "content/short-004/audio/narration.mp3",

  scenes: [
    {
      id: "hook",
      type: "hook",
      timing: { from: "HOOK", until: "IMMUTABLE_REVEAL" },
      kicker: "JAVA INTERVIEW",
      title: "What will\nthis print?",
      code: {
        language: "JAVA",
        code: [
          'String s = "Java";',
          's.concat(" 21");',
          'System.out.println(s);',
        ],
        activeLine: 1,
      },
      reveals: [
        {
          at: within("HOOK", 0.52),
          text: "Java 21 ?",
          tone: "accent",
          size: 66,
        },
        {
          at: within("HOOK", 0.78),
          text: "Think again.",
          tone: "alert",
          size: 54,
        },
      ],
    },

    {
      id: "immutable-reveal",
      type: "comparison",
      timing: { from: "IMMUTABLE_REVEAL", until: "OBJECT_UNCHANGED" },
      kicker: "ACTUAL RESULT",
      leftLabel: "EXPECTED?",
      leftValue: "Java 21",
      rightLabel: "ACTUAL",
      rightValue: "Java",
      note: "String objects are immutable.",
    },

    {
      id: "object-unchanged",
      type: "diagram",
      timing: { from: "OBJECT_UNCHANGED", until: "NEW_STRING" },
      kicker: "IMMUTABLE OBJECT",
      title: "The object stays unchanged.",
      nodes: [
        {
          label: "s",
          value: "reference",
        },
        {
          label: 'String object',
          value: '"Java"',
          emphasis: true,
          at: within("OBJECT_UNCHANGED", 0.25),
        },
      ],
      note: 'Once created, the "Java" String object cannot be changed.',
      noteAt: within("OBJECT_UNCHANGED", 0.5),
    },

    {
      id: "new-string",
      type: "diagram",
      timing: { from: "NEW_STRING", until: "REFERENCE_UNCHANGED" },
      kicker: "WHAT concat() REALLY DOES",
      title: "It creates a new String.",
      nodes: [
        {
          label: "Original",
          value: '"Java"',
        },
        {
          label: 'concat(" 21")',
          value: "creates",
          at: within("NEW_STRING", 0.2),
        },
        {
          label: "NEW String",
          value: '"Java 21"',
          emphasis: true,
          at: within("NEW_STRING", 0.45),
        },
      ],
      note: "The original String is not modified.",
      noteAt: within("NEW_STRING", 0.67),
    },

    {
      id: "reference-unchanged",
      type: "diagram",
      timing: { from: "REFERENCE_UNCHANGED", until: "REASSIGNMENT" },
      kicker: "BUT s NEVER MOVED",
      title: "The reference still points here.",
      nodes: [
        {
          label: "s",
          value: '→ "Java"',
          emphasis: true,
        },
        {
          label: "New object",
          value: '"Java 21"',
          at: within("REFERENCE_UNCHANGED", 0.25),
        },
      ],
      note: 'The new String exists, but s still points to "Java".',
      noteAt: within("REFERENCE_UNCHANGED", 0.52),
    },

    {
      id: "reassignment",
      type: "code",
      timing: { from: "REASSIGNMENT", until: "WHY_IMMUTABLE" },
      kicker: "ASSIGN THE NEW REFERENCE",
      title: "Now s can point to it.",
      language: "JAVA",
      code: [
        'String s = "Java";',
        's = s.concat(" 21");',
        'System.out.println(s);',
      ],
      activeLine: 1,
      steps: [
        {
          at: 0,
          activeLine: 1,
          values: ['s → "Java"'],
          status: "Before reassignment",
        },
        {
          at: within("REASSIGNMENT", 0.38),
          activeLine: 1,
          highlight: "s =",
          values: ['s → "Java 21"'],
          status: "Reference now points to the new String.",
          result: {
            at: within("REASSIGNMENT", 0.38),
            text: "Java 21",
            size: 64,
            tone: "accent",
          },
        },
      ],
    },

    {
      id: "why-immutable",
      type: "explanation",
      timing: { from: "WHY_IMMUTABLE", until: "STRING_POOL" },
      kicker: "THE REAL INTERVIEW QUESTION",
      title: "But WHY immutable?",
      body: [
        "Why did Java deliberately",
        "design String this way?",
      ],
    },

    {
      id: "string-pool",
      type: "diagram",
      timing: { from: "STRING_POOL", until: "HASH_STABILITY" },
      kicker: "REASON #1 · SAFE SHARING",
      title: "Strings can be shared.",
      nodes: [
        {
          label: "a",
          value: '→ "Java"',
        },
        {
          label: "b",
          value: '→ "Java"',
          at: within("STRING_POOL", 0.16),
        },
        {
          label: "STRING POOL",
          value: '"Java" · shared object',
          emphasis: true,
          at: within("STRING_POOL", 0.34),
        },
      ],
      examples: [
        {
          label: "If one reference could mutate it...",
          at: within("STRING_POOL", 0.56),
        },
        {
          label: "other references could see the change.",
          at: within("STRING_POOL", 0.7),
        },
      ],
      note: "Immutability makes shared Strings safe.",
      noteAt: within("STRING_POOL", 0.82),
    },

    {
      id: "hash-stability",
      type: "diagram",
      timing: { from: "HASH_STABILITY", until: "INTERVIEW_RULE" },
      kicker: "REASON #2 · STABLE HASH",
      title: "Safe HashMap key.",
      nodes: [
        {
          label: "String key",
          value: '"Java"',
        },
        {
          label: "hashCode()",
          value: "stable",
          at: within("HASH_STABILITY", 0.22),
        },
        {
          label: "HashMap bucket",
          value: "stable lookup",
          emphasis: true,
          at: within("HASH_STABILITY", 0.44),
        },
      ],
      note: "The key's value cannot mutate after insertion.",
      noteAt: within("HASH_STABILITY", 0.66),
    },

    {
      id: "interview-rule",
      type: "rule",
      timing: { from: "INTERVIEW_RULE" },
      kicker: "INTERVIEW RULE",
      title: "Reference ≠ Object",
      rows: [
        "REFERENCE",
        "CAN CHANGE",
        "STRING OBJECT",
        "CANNOT CHANGE",
      ],
      rowTimes: [
        0,
        within("INTERVIEW_RULE", 0.12),
        within("INTERVIEW_RULE", 0.28),
        within("INTERVIEW_RULE", 0.4),
      ],
      note: "A variable can point to a new String.\nThe existing String itself never changes.",
      noteAt: within("INTERVIEW_RULE", 0.56),
      signatureAt: within("INTERVIEW_RULE", 0.8),
    },
  ],

  captions: [
    {
      timing: { from: "HOOK", until: "IMMUTABLE_REVEAL" },
      text: "What will this print?",
      emphasis: "print?",
    },
    {
      timing: { from: "IMMUTABLE_REVEAL", until: "OBJECT_UNCHANGED" },
      text: "It still prints Java",
      emphasis: "Java",
    },
    {
      timing: { from: "NEW_STRING", until: "REFERENCE_UNCHANGED" },
      text: "concat() creates a new String",
      emphasis: "new",
    },
    {
      timing: { from: "REASSIGNMENT", until: "WHY_IMMUTABLE" },
      text: "Assign the new String back to s",
      emphasis: "s",
    },
    {
      timing: { from: "STRING_POOL", until: "HASH_STABILITY" },
      text: "Immutability makes shared Strings safe",
      emphasis: "safe",
    },
    {
      timing: { from: "HASH_STABILITY", until: "INTERVIEW_RULE" },
      text: "Immutable String → stable hash",
      emphasis: "stable",
    },
    {
      timing: { from: "INTERVIEW_RULE" },
      text: "Reference can change. String object cannot.",
      emphasis: "cannot",
    },
  ],
};

export default short;