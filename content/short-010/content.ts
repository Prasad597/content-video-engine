import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-010",
  channel: "noskip-learning",

  title: "Two Threads Insert 10,000 Entries. Where Did Some Go?",
  topic: "Why HashMap is not thread-safe for concurrent writes",

  narration: "content/short-010/audio/narration.mp3",

  scenes: [
    // ------------------------------------------------------------
    // HOOK
    // 0.000 -> 10.820
    // ------------------------------------------------------------
    {
      id: "hook",
      type: "diagram",

      timing: {
        from: "HOOK",
        until: "SETUP",
      },

      title: "5,000 + 5,000 = 10,000... RIGHT?",

      nodes: [
        {
          label: "THREAD 1",
          value: "+ 5,000 entries",
          at: within("HOOK", 0.05),
        },
        {
          label: "THREAD 2",
          value: "+ 5,000 entries",
          at: within("HOOK", 0.20),
        },
        {
          label: "EXPECTED SIZE",
          value: "10,000",
          emphasis: true,
          at: within("HOOK", 0.38),
        },
        {
          label: "EXCEPTION",
          value: "NONE",
          at: within("HOOK", 0.56),
        },
        {
          label: "ACTUAL SIZE",
          value: "< 10,000 ?!",
          emphasis: true,
          at: within("HOOK", 0.70),
        },
      ],

      note: "WHERE DID THE ENTRIES GO?",
      noteAt: within("HOOK", 0.82),
    },

    // ------------------------------------------------------------
    // SETUP
    // 10.820 -> 16.720
    // ------------------------------------------------------------
    {
      id: "setup",
      type: "diagram",

      timing: {
        from: "SETUP",
        until: "COLLISION",
      },

      title: "ONE SHARED HASHMAP",

      nodes: [
        {
          label: "THREAD 1",
          value: "put(...)",
          at: within("SETUP", 0.08),
        },
        {
          label: "THREAD 2",
          value: "put(...)",
          at: within("SETUP", 0.22),
        },
        {
          label: "SHARED",
          value: "HashMap",
          emphasis: true,
          at: within("SETUP", 0.40),
        },
        {
          label: "THREAD SAFETY",
          value: "NOT PROVIDED",
          emphasis: true,
          at: within("SETUP", 0.68),
        },
      ],

      note: "Both threads write at the same time.",
      noteAt: within("SETUP", 0.78),
    },

    // ------------------------------------------------------------
    // COLLISION
    // 16.720 -> 23.760
    // ------------------------------------------------------------
    {
      id: "concurrent-write",
      type: "diagram",

      timing: {
        from: "COLLISION",
        until: "RESULT",
      },

      title: "THIS ISN'T JUST A HASH COLLISION",

      nodes: [
        {
          label: "THREAD 1",
          value: "changes map state",
          at: within("COLLISION", 0.08),
        },
        {
          label: "THREAD 2",
          value: "changes map state",
          at: within("COLLISION", 0.22),
        },
        {
          label: "SAME MAP",
          value: "concurrent mutation",
          emphasis: true,
          at: within("COLLISION", 0.43),
        },
        {
          label: "INTERNAL STATE",
          value: "writes can interfere",
          emphasis: true,
          at: within("COLLISION", 0.66),
        },
      ],

      note: "No coordination between writers.",
      noteAt: within("COLLISION", 0.80),
    },

    // ------------------------------------------------------------
    // RESULT
    // 23.760 -> 30.240
    // ------------------------------------------------------------
    {
      id: "result",
      type: "comparison",

      timing: {
        from: "RESULT",
        until: "FIX",
      },

      title: "BOTH THREADS FINISHED",

      leftLabel: "EXPECTED",
      leftValue: "10,000",

      rightLabel: "ACTUAL",
      rightValue: "< 10,000",

      note: "No exception ≠ correct result",
    },

    // ------------------------------------------------------------
    // FIX
    // 30.240 -> 39.380
    // ------------------------------------------------------------
    {
      id: "fix",
      type: "comparison",

      timing: {
        from: "FIX",
        until: "RULE",
      },

      title: "CHOOSE THE RIGHT MAP",

      leftLabel: "HashMap",
      leftValue: "Concurrent writes? NO",

      rightLabel: "ConcurrentHashMap",
      rightValue: "Designed for concurrency",

      note: "Shared mutable state needs coordination.",
    },

    // ------------------------------------------------------------
    // RULE
    // 39.380 -> 46.367
    // ------------------------------------------------------------
    {
      id: "rule",
      type: "rule",

      timing: {
        from: "RULE",
      },

      title: "REMEMBER",

      rows: [
        "No exception ≠ thread-safe",
        "Shared writes need coordination",
        "Choose concurrency deliberately",
      ],

      rowTimes: [
        within("RULE", 0.10),
        within("RULE", 0.38),
        within("RULE", 0.66),
      ],

      note: "Correctness must be designed.",
      noteAt: within("RULE", 0.76),

      signatureAt: within("RULE", 0.88),
    },
  ],

  captions: [
    {
      timing: {
        from: "HOOK",
        until: "SETUP",
      },
      text: "Two threads insert 5,000 each. Why isn't the size 10,000?",
      emphasis: "10,000",
    },

    {
      timing: {
        from: "SETUP",
        until: "COLLISION",
      },
      text: "Both threads are writing to the same HashMap.",
      emphasis: "same HashMap",
    },

    {
      timing: {
        from: "COLLISION",
        until: "RESULT",
      },
      text: "Concurrent writes can interfere with the map's internal state.",
      emphasis: "interfere",
    },

    {
      timing: {
        from: "RESULT",
        until: "FIX",
      },
      text: "Both threads can finish without giving you the result you expected.",
      emphasis: "without",
    },

    {
      timing: {
        from: "FIX",
        until: "RULE",
      },
      text: "ConcurrentHashMap is designed for concurrent access.",
      emphasis: "ConcurrentHashMap",
    },

    {
      timing: {
        from: "RULE",
      },
      text: "No exception does not mean thread-safe.",
      emphasis: "thread-safe",
    },
  ],

  publishing: {
    youtube: {
      title:
        "Two Threads Insert 10,000 Entries… So Where Did Some Go? 😳 | 11.AI",

      description:
        "Two threads insert 5,000 entries each into the same Java HashMap.\n\nExpected size: 10,000.\n\nBut with concurrent writes, the final result may not be what you expect — even when no exception is thrown.\n\nHashMap does not provide thread safety for concurrent mutation. Shared writes can interfere while the map's internal state is changing.\n\nWhen multiple threads need concurrent access, choose the appropriate concurrency strategy — such as ConcurrentHashMap where appropriate.\n\nNo exception does not mean thread-safe.\n\n#Java #HashMap #ConcurrentHashMap #Concurrency #Multithreading #JavaInterview #NoSkipLearning",
    },

    instagram: {
      caption:
        "5,000 + 5,000 should equal 10,000… right? 👀\n\nTwo threads write 5,000 entries each into the same HashMap.\n\nNo exception is thrown.\nBoth threads finish.\n\nYet the final result can still be wrong.\n\nWhy?\n\nHashMap does not provide thread safety for concurrent writes. Shared mutations can interfere while its internal state is changing.\n\nWhen multiple threads need to update the same map, use an appropriate concurrency strategy — such as ConcurrentHashMap where appropriate.\n\nThe rule worth remembering:\n\n⚠️ No exception ≠ thread-safe.\n\n#Java #HashMap #ConcurrentHashMap #Concurrency #Multithreading #JavaInterview #BackendDeveloper #NoSkipLearning",
    },
  },

};

export default short;