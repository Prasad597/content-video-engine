export type CaptionCue = {
  startMs: number;
  endMs: number;
  text: string;
  emphasis?: string;
};
export type SceneId =
  | "question"
  | "think"
  | "definition"
  | "code"
  | "hierarchy"
  | "takeaway";
export interface ShortContent {
  id: string;
  topic: string;
  question: string;
  definition: { lead: string; emphasis: string; action: string };
  code: string[];
  exception: string;
  hierarchy: string[];
  examples: string[];
  takeaway: string;
  labels: Record<
    | "series"
    | "think"
    | "definition"
    | "code"
    | "hierarchy"
    | "takeaway"
    | "compile"
    | "runtime"
    | "note",
    string
  >;
  scenes: { id: SceneId; start: number; end: number }[];
  captions: CaptionCue[];
}
export const video = {
  id: "JavaUncheckedException",
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 1230,
};
export const content: ShortContent = {
  id: "video_001",
  topic: "Unchecked exceptions",
  question: "What is an\nUnchecked\nException?",
  definition: {
    lead: "The compiler",
    emphasis: "does NOT",
    action: "force you to\ncatch or declare it.",
  },
  code: ["int a = 10;", "int b = 0;", "", "System.out.println(a / b);"],
  exception: "ArithmeticException",
  hierarchy: ["Throwable", "Exception", "RuntimeException"],
  examples: [
    "ArithmeticException",
    "NullPointerException",
    "IllegalArgumentException",
  ],
  takeaway: "RuntimeException\nand its subclasses\nare unchecked\nexceptions.",
  labels: {
    series: "JAVA INTERVIEW QUESTION",
    think: "Think for 3 seconds…",
    definition: "THE DEFINITION",
    code: "COMPILE ≠ EXECUTE",
    hierarchy: "THE EXCEPTION FAMILY",
    takeaway: "INTERVIEW TAKEAWAY",
    compile: "Compiles successfully",
    runtime: "Fails at runtime",
    note: "Shown: the RuntimeException branch.\nError subclasses are also unchecked.",
  },
  scenes: [
    { id: "question", start: 0, end: 4 },
    { id: "think", start: 4, end: 7 },
    { id: "definition", start: 7, end: 15 },
    { id: "code", start: 15, end: 25 },
    { id: "hierarchy", start: 25, end: 34 },
    { id: "takeaway", start: 34, end: 41 },
  ],
  captions: [
    {
      startMs: 7000,
      endMs: 11000,
      text: "An unchecked exception needs no mandatory handling.",
      emphasis: "no mandatory handling",
    },
    { startMs: 11000, endMs: 15000, text: "You can still choose to catch it." },
    {
      startMs: 15000,
      endMs: 19000,
      text: "This Java code compiles successfully.",
    },
    {
      startMs: 19000,
      endMs: 25000,
      text: "Integer division by zero throws ArithmeticException.",
      emphasis: "division by zero",
    },
    {
      startMs: 25000,
      endMs: 29000,
      text: "Follow the RuntimeException branch.",
    },
    {
      startMs: 29000,
      endMs: 34000,
      text: "These are three common unchecked exceptions.",
    },
  ],
};
