import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

// Scene-local reveal properties use seconds. Pace them within each measured
// semantic beat; scene/caption boundaries remain semantic references.
const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-005",
  channel: "noskip-learning",
  title: "HashMap vs ConcurrentHashMap",
  topic: "HashMap vs ConcurrentHashMap: concurrent access and atomic operations",
  narration: "content/short-005/audio/narration.mp3",

  scenes: [
    {
      id: "hook",
      type: "comparison",
      timing: { from: "HOOK", until: "REVEAL" },
      kicker: "JAVA INTERVIEW",
      title: "Two threads.\nSame Map.",
      leftLabel: "OPTION A",
      leftValue: "HashMap",
      rightLabel: "OPTION B",
      rightValue: "ConcurrentHashMap",
      note: "Which one would you trust?",
    },

    {
      id: "reveal",
      type: "comparison",
      timing: { from: "REVEAL", until: "HASHMAP_PROBLEM" },
      kicker: "YOUR ANSWER?",
      leftLabel: "HashMap",
      leftValue: "NOT THREAD-SAFE",
      rightLabel: "ConcurrentHashMap",
      rightValue: "SAFER CHOICE ✓",
      note: "For shared concurrent access.",
    },

    {
      id: "hashmap-problem",
      type: "diagram",
      timing: { from: "HASHMAP_PROBLEM", until: "OBVIOUS_FIX" },
      kicker: "WHY NOT HASHMAP?",
      title: "Concurrent modification.",
      nodes: [
        {
          label: "THREAD 1",
          value: "update(key)",
        },
        {
          label: "HashMap",
          value: "shared state",
          emphasis: true,
          at: within("HASHMAP_PROBLEM", 0.18),
        },
        {
          label: "THREAD 2",
          value: "update(key)",
          at: within("HASHMAP_PROBLEM", 0.32),
        },
        {
          label: "RACE CONDITION",
          value: "inconsistent result?",
          emphasis: true,
          at: within("HASHMAP_PROBLEM", 0.55),
        },
      ],
      note: "HashMap does not provide thread-safety for concurrent modification.",
      noteAt: within("HASHMAP_PROBLEM", 0.72),
    },

    {
      id: "obvious-fix",
      type: "diagram",
      timing: { from: "OBVIOUS_FIX", until: "CONCURRENT_MAP" },
      kicker: "THE OBVIOUS FIX",
      title: "One big lock?",
      nodes: [
        {
          label: "THREAD 1",
          value: "waiting...",
        },
        {
          label: "SYNCHRONIZED",
          value: "LOCK",
          emphasis: true,
          at: within("OBVIOUS_FIX", 0.18),
        },
        {
          label: "THREAD 2",
          value: "waiting...",
          at: within("OBVIOUS_FIX", 0.36),
        },
      ],
      examples: [
        {
          label: "Safe access ✓",
          at: within("OBVIOUS_FIX", 0.52),
        },
        {
          label: "But threads may contend for the same lock",
          at: within("OBVIOUS_FIX", 0.68),
        },
      ],
      note: "ConcurrentHashMap is designed specifically for concurrent access.",
      noteAt: within("OBVIOUS_FIX", 0.82),
    },

    {
      id: "concurrent-map",
      type: "diagram",
      timing: { from: "CONCURRENT_MAP", until: "IMPORTANT_DETAIL" },
      kicker: "CONCURRENT HASHMAP",
      title: "Concurrency by design.",
      nodes: [
        {
          label: "THREAD 1",
          value: "operation A",
        },
        {
          label: "ConcurrentHashMap",
          value: "shared map",
          emphasis: true,
          at: within("CONCURRENT_MAP", 0.16),
        },
        {
          label: "THREAD 2",
          value: "operation B",
          at: within("CONCURRENT_MAP", 0.3),
        },
        {
          label: "MANY OPERATIONS",
          value: "can proceed concurrently",
          emphasis: true,
          at: within("CONCURRENT_MAP", 0.5),
        },
      ],
      note: "It does not force every ordinary operation through one map-wide lock.",
      noteAt: within("CONCURRENT_MAP", 0.68),
    },

    {
      id: "important-detail",
      type: "code",
      timing: { from: "IMPORTANT_DETAIL", until: "INTERVIEW_RULE" },
      kicker: "BUT HERE'S THE TRAP",
      title: "Thread-safe ≠ everything atomic",
      language: "JAVA",
      code: [
        "if (!map.containsKey(key)) {",
        '    map.put(key, "Java");',
        "}",
      ],
      activeLine: 0,
      steps: [
        {
          at: 0,
          activeLine: 0,
          values: ["check", "then", "act"],
          status: "Multiple operations form a compound action.",
        },
        {
          at: within("IMPORTANT_DETAIL", 0.34),
          activeLine: 1,
          highlight: "map.put",
          values: ["containsKey()", "put()"],
          status: "The sequence is not automatically atomic.",
        },
        {
          at: within("IMPORTANT_DETAIL", 0.62),
          activeLine: 1,
          values: ["putIfAbsent()", "compute()", "merge()"],
          status: "Prefer the map's atomic methods when appropriate.",
          result: {
            at: within("IMPORTANT_DETAIL", 0.62),
            text: "ATOMIC METHODS ✓",
            size: 48,
            tone: "accent",
          },
        },
      ],
    },

    {
      id: "interview-rule",
      type: "rule",
      timing: { from: "INTERVIEW_RULE" },
      kicker: "INTERVIEW RULE",
      title: "Choose for the access pattern",
      rows: [
        "SINGLE-THREADED",
        "HashMap",
        "SHARED CONCURRENT ACCESS",
        "ConcurrentHashMap",
      ],
      rowTimes: [
        0,
        within("INTERVIEW_RULE", 0.12),
        within("INTERVIEW_RULE", 0.3),
        within("INTERVIEW_RULE", 0.43),
      ],
      note: "And use atomic methods for\ncompound actions when appropriate.",
      noteAt: within("INTERVIEW_RULE", 0.58),
      signatureAt: within("INTERVIEW_RULE", 0.8),
    },
  ],

  captions: [
    {
      timing: { from: "HOOK", until: "REVEAL" },
      text: "Two threads. Same Map. Which one?",
      emphasis: "Which one?",
    },
    {
      timing: { from: "REVEAL", until: "HASHMAP_PROBLEM" },
      text: "ConcurrentHashMap is the safer choice",
      emphasis: "ConcurrentHashMap",
    },
    {
      timing: { from: "HASHMAP_PROBLEM", until: "OBVIOUS_FIX" },
      text: "HashMap is not thread-safe",
      emphasis: "not thread-safe",
    },
    {
      timing: { from: "OBVIOUS_FIX", until: "CONCURRENT_MAP" },
      text: "Why not just synchronize the HashMap?",
      emphasis: "synchronize",
    },
    {
      timing: { from: "CONCURRENT_MAP", until: "IMPORTANT_DETAIL" },
      text: "Concurrent access by design",
      emphasis: "Concurrent",
    },
    {
      timing: { from: "IMPORTANT_DETAIL", until: "INTERVIEW_RULE" },
      text: "Thread-safe does not mean every sequence is atomic",
      emphasis: "atomic",
    },
    {
      timing: { from: "INTERVIEW_RULE" },
      text: "Choose the Map for your access pattern",
      emphasis: "access pattern",
    },
  ],
};

export default short;