// Times are seconds relative to the narration; reveal times are scene-local.
export type CaptionCue = {
  startMs: number;
  endMs: number;
  text: string;
  emphasis?: string;
};
export type Theme = {
  ink: string;
  muted: string;
  text: string;
  accent: string;
  line: string;
  red: string;
};
export type ChannelDefinition = {
  id: string;
  name: string;
  mark: string;
  tagline: string;
  theme: Theme;
};
export type Cue = {
  at: number;
  text: string;
  tone?: "normal" | "accent" | "alert";
  size?: number;
};
export type CodeDisplay = {
  code: string[];
  filename?: string;
  language?: string;
  keywords?: string[];
  activeLine?: number;
  highlight?: string;
};
export type BaseScene = {
  id: string;
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
  code?: CodeDisplay;
  choices?: string[];
  countdown?: { start: number; end: number; count: number };
  reveals?: Cue[];
};
export type ExplanationScene = BaseScene & {
  type: "explanation";
  title: string;
  question?: { text: string; until: number };
  titleAt?: number;
  reveals?: Cue[];
};
export type CodeScene = BaseScene &
  CodeDisplay & {
    type: "code";
    successLabel?: string;
    steps?: {
      at: number;
      activeLine: number;
      highlight?: string;
      status: string;
      values?: string[];
      result?: Cue;
    }[];
  };
export type DiagramScene = BaseScene & {
  type: "diagram";
  nodes: { label: string; value?: string; at?: number; emphasis?: boolean }[];
  examples?: { label: string; at: number }[];
  note?: string;
  noteAt?: number;
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
  rowTimes?: number[];
  note?: string;
  noteAt?: number;
  signatureAt?: number;
};
export type OutroScene = BaseScene & { type: "outro"; title: string };
export type SceneDefinition =
  | HookScene
  | ExplanationScene
  | CodeScene
  | DiagramScene
  | ComparisonScene
  | RuleScene
  | OutroScene;
export type SceneType = SceneDefinition["type"];
export type PublishingDefinition = {
  youtube: { title: string; description: string };
  instagram: { caption: string };
};
export type ThumbnailDefinition = {
  eyebrow?: string;
  headline: string; // Up to two short lines, separated by a newline.
  subheadline?: string;
  // One optional debugger-style convergence diagram, not a scene framework.
  diagram?: {
    left: { label: string; expression: string; value: string };
    right: { label: string; expression: string; value: string };
    destination: string;
    verdict?: string;
  };
};
export type ShortDefinition = {
  id: string;
  channel: string;
  title: string;
  topic: string;
  // Exact repository-relative asset path. Never matched by basename.
  narration: string;
  publishing?: PublishingDefinition;
  thumbnail?: ThumbnailDefinition;
  scenes: SceneDefinition[];
  captions?: CaptionCue[];
  audio?: {
    narrationVolume?: number;
    music?: { file: string; volume: number };
    effects?: { file: string; at: number; duration: number; volume: number }[];
  };
};

// Authored timing is resolved before the existing numeric rendering boundary.
export type SemanticTiming = {
  from: string;
  until?: string; // next beat's start; omitted means from beat's end
  leadMs?: number;
  tailMs?: number;
};
type AuthoredScene<T> = T extends SceneDefinition
  ? T | (Omit<T, "start" | "end"> & { timing: SemanticTiming; start?: never; end?: never })
  : never;
export type AuthoredShortDefinition = Omit<ShortDefinition, "scenes" | "captions"> & {
  visualLeadMs?: number;
  scenes: AuthoredScene<SceneDefinition>[];
  captions?: (CaptionCue | (Omit<CaptionCue, "startMs" | "endMs"> & {
    timing: SemanticTiming; startMs?: never; endMs?: never;
  }))[];
};
