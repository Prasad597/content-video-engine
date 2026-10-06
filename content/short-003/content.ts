import type { AuthoredShortDefinition } from "../../src/engine/types";
import measured from "./generated/beats.json";

// Existing scene-local reveal properties use seconds. Pace them within the
// measured beat span; scene/caption boundaries remain semantic references.
const within = (beat: keyof typeof measured.beats, fraction: number) =>
  (measured.beats[beat].end - measured.beats[beat].start) * fraction;

const short: AuthoredShortDefinition = {
  id: "short-003",
  channel: "noskip-learning",
  title: "Why can a mutated HashMap key return null?",
  topic: "Mutable HashMap keys: stored placement versus current hash",
  narration: "content/short-003/audio/narration.mp3",
  scenes: [
    {
      id: "hook", type: "hook",
      timing: { from: "HOOK", until: "SETUP" },
      kicker: "JAVA INTERVIEW",
      title: "Stored it.\nWhy null?",
      code: { language: "JAVA", code: ['map.put(key, "Java");', '', 'map.get(key);'], activeLine: 2 },
      reveals: [
        { at: within("HOOK", 0.35), text: "↓", size: 56 },
        { at: within("HOOK", 0.5), text: "null ?!", tone: "alert", size: 100 },
      ],
    },
    {
      id: "setup", type: "diagram",
      timing: { from: "SETUP", until: "CODE_INSERT" },
      kicker: "MEET THE KEY",
      nodes: [
        { label: "key", value: "object reference" },
        { label: "Key", value: "id = 1", emphasis: true, at: within("SETUP", 0.2) },
      ],
      note: "Example: id participates in equals() and hashCode().",
    },
    {
      id: "insert", type: "code",
      timing: { from: "CODE_INSERT", until: "HASH_LOOKUP" },
      kicker: "INSERT THE ENTRY", title: "Key → value",
      language: "JAVA", code: ['map.put(key, "Java");'], activeLine: 0,
      steps: [
        { at: 0, activeLine: 0, values: ["Key(id=1)", '"Java"'], status: "The key is still unchanged." },
      ],
    },
    {
      id: "hash-lookup", type: "diagram",
      timing: { from: "HASH_LOOKUP", until: "MUTATION" },
      kicker: "KEY → HASH → BUCKET",
      nodes: [
        { label: "Key(id=1)" },
        { label: "hashCode()", value: "original hash", at: within("HASH_LOOKUP", 0.22) },
        { label: "Bucket A", value: 'entry → "Java"', emphasis: true, at: within("HASH_LOOKUP", 0.48) },
      ],
      note: "Illustrative placement, not literal bucket indices.",
      noteAt: within("HASH_LOOKUP", 0.6),
    },
    {
      id: "mutation", type: "code",
      timing: { from: "MUTATION", until: "HASH_CHANGED" },
      kicker: "SAME KEY OBJECT", title: "State changes.",
      language: "JAVA", code: ["key.id = 2;"], activeLine: 0,
      steps: [
        { at: 0, activeLine: 0, values: ["id = 1"], status: "Already stored in the map." },
        { at: within("MUTATION", 0.35), activeLine: 0, highlight: "2", values: ["id: 1 → 2"], status: "Same reference. Mutated state.", result: { at: within("MUTATION", 0.35), text: "No new key object.", size: 46, tone: "accent" } },
      ],
    },
    {
      id: "hash-changed", type: "comparison",
      timing: { from: "HASH_CHANGED", until: "LOOKUP_FAILS" },
      kicker: "HASH CAN CHANGE",
      leftLabel: "BEFORE · id = 1", leftValue: "Original hash",
      rightLabel: "AFTER · id = 2", rightValue: "Different hash?",
      note: "When hashCode() depends on the mutated field.",
    },
    {
      id: "lookup-fails", type: "diagram",
      timing: { from: "LOOKUP_FAILS", until: "RESULT" },
      kicker: "AFTER MUTATION",
      title: "New lookup.\nOld placement.",
      nodes: [
        { label: "map.get(key)", value: "same key · id = 2" },
        { label: "Current hash", at: within("LOOKUP_FAILS", 0.18) },
        { label: "Bucket B", value: "lookup searches here", at: within("LOOKUP_FAILS", 0.35) },
        { label: "NOT FOUND", value: "get() can return null", emphasis: true, at: within("LOOKUP_FAILS", 0.5) },
      ],
      examples: [
        { label: 'Original: Bucket A → "Java"', at: within("LOOKUP_FAILS", 0.63) },
      ],
      note: "Illustrative different-bucket case. Mutation does not move the stored entry.",
      noteAt: within("LOOKUP_FAILS", 0.74),
    },
    {
      id: "result", type: "comparison",
      timing: { from: "RESULT", until: "FINAL_RULE" },
      kicker: "THE ENTRY DID NOT VANISH",
      leftLabel: "ENTRY", leftValue: "May still be in the map",
      rightLabel: "LOOKUP WITH MUTATED KEY", rightValue: "Can fail",
      note: "Existing entry ≠ successful lookup.",
    },
    {
      id: "final-rule", type: "rule",
      timing: { from: "FINAL_RULE", until: "INTERVIEW_RULE" },
      kicker: "THE TAKEAWAY", title: "Prefer immutable keys",
      rows: ["HASHMAP KEYS", "SHOULD BE", "IMMUTABLE"],
      rowTimes: [0, within("FINAL_RULE", 0.12), within("FINAL_RULE", 0.23)],
      note: "Especially fields used by\nequals() and hashCode().",
      noteAt: within("FINAL_RULE", 0.48),
    },
    {
      id: "interview-rule", type: "rule",
      timing: { from: "INTERVIEW_RULE" },
      kicker: "INTERVIEW RULE", title: "Never mutate equality/hash fields",
      rows: ["NEVER MUTATE", "fields used by", "equals()", "hashCode()"],
      rowTimes: [0, within("INTERVIEW_RULE", 0.13), within("INTERVIEW_RULE", 0.25), within("INTERVIEW_RULE", 0.34)],
      note: "While the key is stored\nin the HashMap.",
      noteAt: within("INTERVIEW_RULE", 0.47),
      signatureAt: within("INTERVIEW_RULE", 0.76),
    },
  ],
  captions: [
    { timing: { from: "MUTATION", until: "HASH_CHANGED" }, text: "Mutation after insertion", emphasis: "after" },
    { timing: { from: "RESULT", until: "FINAL_RULE" }, text: "Placement ≠ current lookup", emphasis: "≠" },
  ],
};
export default short;
