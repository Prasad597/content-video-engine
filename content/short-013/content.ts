import type { AuthoredShortDefinition } from "../../src/engine/types";

const short: AuthoredShortDefinition = {
  id: "short-013",
  channel: "noskip-learning",
  title: "Find Two Sum in One Pass | 11.AI",
  topic: "The HashMap complement technique for Two Sum",
  narration: "content/short-013/audio/narration.mp3",
  audio: {
    music: {
      file: "content/short-013/audio/music.wav",
      fadeInSeconds: 0.5,
      fadeOutSeconds: 0.8,
      crossfadeSeconds: 0.25,
    },
  },
  publishing: {
    youtube: {
      title: "Find Two Sum in One Pass | 11.AI",
      description:
        "Find the pair that adds to 25 in [13, 4, 21, 8, 17, 6]. " +
        "A HashMap stores values already seen and their indices. " +
        "At 21, its complement 4 is already stored at index 1, so the answer is indices 1 and 2.",
    },
    instagram: {
      caption:
        "Two Sum in one pass: for each number, check whether target - current is already in the map. " +
        "When current is 21, complement 4 is stored at index 1. Match: indices 1 and 2. #Java #DSA #TwoSum",
    },
  },
  scenes: [
    {
      id: "hook",
      type: "hook",
      timing: { from: "HOOK", until: "CHALLENGE" },
      kicker: "TWO SUM",
      title: "FIND THE PAIR\nIN ONE PASS",
      subtitle: "Six numbers. One target.",
    },
    {
      id: "challenge",
      type: "diagram",
      timing: { from: "CHALLENGE", until: "REVEAL" },
      kicker: "YOUR CHALLENGE",
      title: "WHICH TWO ADD TO 25?",
      nodes: [
        {
          label: "ARRAY",
          value: "[13, 4, 21, 8, 17, 6]",
        },
        {
          label: "TARGET",
          value: "25",
          emphasis: true,
        },
      ],
      note: "Find the two zero-based indices.",
    },
    {
      id: "reveal",
      type: "diagram",
      timing: { from: "REVEAL", until: "WHY" },
      kicker: "THE MATCH",
      title: "4 + 21 = 25",
      nodes: [
        {
          label: "INDEX 1",
          value: "4",
        },
        {
          label: "INDEX 2",
          value: "21",
          emphasis: true,
        },
      ],
      note: "Answer: indices [1, 2].",
    },
    {
      id: "complement",
      type: "code",
      timing: { from: "WHY", until: "FIX" },
      kicker: "THE COMPLEMENT TECHNIQUE",
      title: "LOOK UP BEFORE YOU STORE",
      language: "java",
      code: [
        "Map<Integer, Integer> seen = new HashMap<>();",
        "for (int i = 0; i < nums.length; i++) {",
        "  int complement = target - nums[i];",
        "  if (seen.containsKey(complement)) {",
        "    return new int[] { seen.get(complement), i };",
        "  }",
        "  seen.put(nums[i], i);",
        "}",
      ],
      activeLine: 2,
    },
    {
      id: "map-match",
      type: "diagram",
      timing: { from: "FIX", until: "RULE" },
      kicker: "WHEN CURRENT VALUE IS 21",
      title: "THE MAP ALREADY KNOWS 4",
      nodes: [
        {
          label: "SEEN SO FAR",
          value: "{13 → 0, 4 → 1}",
        },
        {
          label: "COMPLEMENT",
          value: "25 - 21 = 4",
        },
        {
          label: "FOUND",
          value: "seen[4] = 1  →  [1, 2]",
          emphasis: true,
        },
      ],
      note: "The match is found while processing index 2.",
    },
    {
      id: "rule",
      type: "rule",
      timing: { from: "RULE" },
      kicker: "INTERVIEW RULE",
      title: "CHECK, THEN STORE",
      rows: [
        "complement = target - current",
        "Look up complement in the map",
        "If absent, store current → index",
      ],
      note: "Remember only values you've already seen.",
    },
  ],
  captions: [
    {
      timing: { from: "HOOK", until: "CHALLENGE" },
      text: "Six numbers. One target. Find the pair in one pass.",
      emphasis: "one pass",
    },
    {
      timing: { from: "CHALLENGE", until: "REVEAL" },
      text: "[13, 4, 21, 8, 17, 6]. Target: 25.",
      emphasis: "Target: 25",
    },
    {
      timing: { from: "REVEAL", until: "WHY" },
      text: "4 + 21 = 25. Their indices are 1 and 2.",
      emphasis: "4 + 21",
    },
    {
      timing: { from: "WHY", until: "FIX" },
      text: "Calculate target minus current, then check the map.",
      emphasis: "check the map",
    },
    {
      timing: { from: "FIX", until: "RULE" },
      text: "At 21, complement 4 is already stored at index 1.",
      emphasis: "index 1",
    },
    {
      timing: { from: "RULE" },
      text: "Check first. Store the current value and index if there is no match.",
      emphasis: "Check first",
    },
  ],
};

export default short;
