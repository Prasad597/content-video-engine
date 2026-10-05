export type SceneType =
  | "hook"
  | "explanation"
  | "code"
  | "diagram"
  | "comparison"
  | "rule"
  | "outro";

export type CaptionCue = {
  startMs: number;
  endMs: number;
  text: string;
  emphasis?: string;
};

export type BaseScene = {
  id: string;
  type: SceneType;
  start: number;
  end: number;
  kicker?: string;
  title?: string;
  subtitle?: string;
  body?: string[];
  emphasis?: string;
};

export type HookScene = BaseScene & {
  type: "hook";
  title: string;
  subtitle?: string;
};

export type ExplanationScene = BaseScene & {
  type: "explanation";
  title: string;
  body?: string[];
};

export type CodeScene = BaseScene & {
  type: "code";
  code: string[];
  successLabel?: string;
  activeLine?: number;
};

export type DiagramScene = BaseScene & {
  type: "diagram";
  nodes: { label: string; value?: string }[];
  note?: string;
};

export type ComparisonScene = BaseScene & {
  type: "comparison";
  leftLabel: string;
  rightLabel: string;
  leftValue: string;
  rightValue: string;
  note?: string;
};

export type RuleScene = BaseScene & {
  type: "rule";
  title: string;
  rows: string[];
  note?: string;
};

export type OutroScene = BaseScene & {
  type: "outro";
  title: string;
  subtitle?: string;
};

export type SceneDefinition =
  | HookScene
  | ExplanationScene
  | CodeScene
  | DiagramScene
  | ComparisonScene
  | RuleScene
  | OutroScene;

export type ChannelDefinition = {
  id: string;
  name: string;
  tagline: string;
  theme: {
    ink: string;
    muted: string;
    text: string;
    accent: string;
    line: string;
    red: string;
  };
};

export type ShortDefinition = {
  id: string;
  channel: string;
  title: string;
  topic: string;
  narration: string;
  scenes: SceneDefinition[];
  captions?: CaptionCue[];
};
