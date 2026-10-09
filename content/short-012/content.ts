
import type { AuthoredShortDefinition } from "../../src/engine/types";

const short: AuthoredShortDefinition = {
  id: "short-012",
  channel: "noskip-learning",

  title: "The Volatile Interview Trap",
  topic: "Why volatile does not make count++ atomic",

  narration: "content/short-012/audio/narration.mp3",

  audio: {
    music: {
      file: "content/short-012/audio/music.wav",
      fadeInSeconds: 0.5,
      fadeOutSeconds: 0.8,
      crossfadeSeconds: 0.25,
    },
  },

  scenes: [
    {
      id: "hook",
      type: "hook",
      timing: { from: "HOOK", until: "CHALLENGE" },
      title: "YOUR INTERVIEWER SAYS...",
      code: {
        language: "java",
        code: [
          "volatile int count = 0;",
          "count++;",
        ],
      },
      reveals: [
        {
          at: 1.5,
          text: "BUG FIXED?",
        },
      ],
    },

    {
      id: "challenge",
      type: "code",
      timing: { from: "CHALLENGE", until: "REVEAL" },
      title: "WOULD YOU APPROVE THIS?",
      language: "java",
      code: [
        "class Counter {",
        "  volatile int count = 0;",
        "",
        "  void increment() {",
        "    count++;",
        "  }",
        "}",
      ],
      activeLine: 5,
    },

    {
      id: "reveal",
      type: "explanation",
      timing: { from: "REVEAL", until: "WHY" },
      title: "VOLATILE ≠ ATOMIC",
      body: [
        "Visibility is not the same as atomicity.",
      ],
      reveals: [
        {
          at: 1.0,
          text: "count++ is NOT atomic",
        },
      ],
    },

    {
      id: "why",
      type: "diagram",
      timing: { from: "WHY", until: "FIX" },
      title: "THE HIDDEN RACE CONDITION",
      nodes: [
        {
          label: "THREAD A",
          value: "READ 5",
          at: 0.5,
        },
        {
          label: "THREAD B",
          value: "READ 5",
          at: 1.5,
        },
        {
          label: "THREAD A",
          value: "WRITE 6",
          at: 2.5,
        },
        {
          label: "THREAD B",
          value: "WRITE 6",
          at: 3.5,
          emphasis: true,
        },
      ],
      note: "Two increments. One update lost.",
    },

    {
      id: "fix",
      type: "code",
      timing: { from: "FIX", until: "RULE" },
      title: "THE THREAD-SAFE FIX",
      language: "java",
      code: [
        "import java.util.concurrent.atomic.AtomicInteger;",
        "",
        "class Counter {",
        "  private final AtomicInteger count =",
        "      new AtomicInteger();",
        "",
        "  void increment() {",
        "    count.incrementAndGet();",
        "  }",
        "}",
      ],
      activeLine: 8,
    },

    {
      id: "rule",
      type: "rule",
      timing: { from: "RULE" },
      title: "REMEMBER THIS",
      rows: [
        "volatile → VISIBILITY",
        "AtomicInteger → ATOMIC INCREMENT",
        "VISIBILITY ≠ ATOMICITY",
      ],
      note: "One keyword doesn't make every operation thread-safe.",
    },
  ],

  captions: [
    {
      timing: { from: "HOOK", until: "CHALLENGE" },
      text: "Your interviewer says: BUG FIXED!",
      emphasis: "BUG FIXED",
    },
    {
      timing: { from: "CHALLENGE", until: "REVEAL" },
      text: "Would you approve volatile count++?",
      emphasis: "volatile",
    },
    {
      timing: { from: "REVEAL", until: "WHY" },
      text: "Volatile guarantees visibility, NOT atomicity.",
      emphasis: "NOT atomicity",
    },
    {
      timing: { from: "WHY", until: "FIX" },
      text: "Read. Increment. Write. Updates can be lost.",
      emphasis: "Updates can be lost",
    },
    {
      timing: { from: "FIX", until: "RULE" },
      text: "Use AtomicInteger.incrementAndGet().",
      emphasis: "AtomicInteger",
    },
    {
      timing: { from: "RULE" },
      text: "Visibility does NOT mean atomicity.",
      emphasis: "NOT",
    },
  ],

  publishing: {
    youtube: {
      title: "Your Interviewer Says Volatile Fixes This Bug? 🤯 | 11.AI",
      description:
        "Does volatile make count++ thread-safe? Not quite.\n\n" +
        "volatile guarantees visibility, but count++ is a read-modify-write " +
        "operation that can lose updates under concurrency.\n\n" +
        "Use AtomicInteger.incrementAndGet() when you need an atomic counter.\n\n" +
        "#Java #CoreJava #JavaInterview #Multithreading #CodingShorts",
    },

    instagram: {
      caption:
        "Your interviewer changes int to volatile int and says: FIXED! 😳\n\n" +
        "Would you approve the code?\n\n" +
        "volatile gives visibility, NOT atomicity. " +
        "count++ can still lose updates.\n\n" +
        "The fix: AtomicInteger.incrementAndGet().\n\n" +
        "#Java #JavaDeveloper #CoreJava #JavaInterview #Multithreading",
    },
  },
};

export default short;
