import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

// Scene-local reveal properties use seconds. Pace them within each measured
// semantic beat; scene/caption boundaries remain semantic references.
const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-006",
  channel: "noskip-learning",
  title: "How does HashMap work internally?",
  topic: "HashMap internals: hashCode, buckets, collisions, and equals",
  narration: "content/short-006/audio/narration.mp3",

  scenes: [
    {
      id: "hook",
      type: "diagram",
      timing: { from: "HOOK", until: "HASH" },
      kicker: "JAVA INTERVIEW",
      title: "1,000,000 entries.\nOne get(key).",
      nodes: [
        {
          label: "HashMap",
          value: "1,000,000 entries",
          emphasis: true,
        },
        {
          label: "get(key)",
          value: "Search all 1,000,000?",
          at: within("HOOK", 0.25),
        },
        {
          label: "NO",
          value: "So how does Java find it?",
          emphasis: true,
          at: within("HOOK", 0.52),
        },
      ],
      note: "HashMap doesn't scan every key.",
      noteAt: within("HOOK", 0.72),
    },

    {
      id: "hash",
      type: "diagram",
      timing: { from: "HASH", until: "BUCKET" },
      kicker: "STEP 1 · HASH",
      title: "Start with the key.",
      nodes: [
        {
          label: "KEY",
          value: '"user-42"',
        },
        {
          label: "hashCode()",
          value: "hash",
          emphasis: true,
          at: within("HASH", 0.28),
        },
      ],
      note: "The hash helps determine where to look.",
      noteAt: within("HASH", 0.58),
    },

    {
      id: "bucket",
      type: "diagram",
      timing: { from: "BUCKET", until: "COLLISION" },
      kicker: "STEP 2 · BUCKET",
      title: "Jump toward one bucket.",
      nodes: [
        {
          label: "HASH",
          value: "→",
        },
        {
          label: "BUCKET 1",
          value: "other entries",
          at: within("BUCKET", 0.16),
        },
        {
          label: "BUCKET 7",
          value: "possible match",
          emphasis: true,
          at: within("BUCKET", 0.34),
        },
        {
          label: "BUCKET 12",
          value: "other entries",
          at: within("BUCKET", 0.5),
        },
      ],
      note: "No full-map scan.",
      noteAt: within("BUCKET", 0.7),
    },

    {
      id: "collision",
      type: "diagram",
      timing: { from: "COLLISION", until: "KEY_CHECK" },
      kicker: "BUT THERE'S A CATCH",
      title: "Same bucket?",
      nodes: [
        {
          label: "KEY A",
          value: "hash → Bucket 7",
        },
        {
          label: "KEY B",
          value: "hash → Bucket 7",
          at: within("COLLISION", 0.22),
        },
        {
          label: "COLLISION",
          value: "Different keys · same bucket",
          emphasis: true,
          at: within("COLLISION", 0.45),
        },
      ],
      note: "Reaching the bucket doesn't always identify the key.",
      noteAt: within("COLLISION", 0.68),
    },

    {
      id: "key-check",
      type: "comparison",
      timing: { from: "KEY_CHECK", until: "INTERVIEW_RULE" },
      kicker: "STEP 3 · FIND THE KEY",
      leftLabel: "hashCode()",
      leftValue: "Find bucket",
      rightLabel: "equals()",
      rightValue: "Find key",
      note: "Both matter during HashMap lookup.",
    },

    {
      id: "interview-rule",
      type: "rule",
      timing: { from: "INTERVIEW_RULE" },
      kicker: "INTERVIEW RULE",
      title: "Remember these two jobs",
      rows: [
        "hashCode()",
        "HELPS FIND THE BUCKET",
        "equals()",
        "HELPS FIND THE KEY",
      ],
      rowTimes: [
        0,
        within("INTERVIEW_RULE", 0.12),
        within("INTERVIEW_RULE", 0.34),
        within("INTERVIEW_RULE", 0.47),
      ],
      note: "Bucket first.\nCorrect key next.",
      noteAt: within("INTERVIEW_RULE", 0.64),
      signatureAt: within("INTERVIEW_RULE", 0.82),
    },
  ],

  captions: [
    {
      timing: { from: "HOOK", until: "HASH" },
      text: "Does HashMap search all 1,000,000 keys?",
      emphasis: "1,000,000",
    },
    {
      timing: { from: "HASH", until: "BUCKET" },
      text: "First: use the key's hashCode",
      emphasis: "hashCode",
    },
    {
      timing: { from: "BUCKET", until: "COLLISION" },
      text: "The hash helps locate a bucket",
      emphasis: "bucket",
    },
    {
      timing: { from: "COLLISION", until: "KEY_CHECK" },
      text: "Different keys can reach the same bucket",
      emphasis: "same bucket",
    },
    {
      timing: { from: "KEY_CHECK", until: "INTERVIEW_RULE" },
      text: "Then equals helps identify the correct key",
      emphasis: "equals",
    },
    {
      timing: { from: "INTERVIEW_RULE" },
      text: "hashCode → bucket | equals → key",
      emphasis: "bucket",
    },
  ],
};

export default short;