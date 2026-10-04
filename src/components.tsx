import type { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionCue } from "./content/unchecked-exception";

export const colors = {
  ink: "#10191f",
  muted: "#98a8af",
  text: "#f3f3eb",
  accent: "#cbf279",
  line: "#334149",
  red: "#ffad93",
};
export const Kicker = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      color: colors.accent,
      fontSize: 27,
      fontWeight: 700,
      letterSpacing: 4,
      marginBottom: 48,
    }}
  >
    {children}
  </div>
);
export const Entrance = ({
  children,
  duration,
}: {
  children: ReactNode;
  duration: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 22,
  });
  const exit = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 22}px)`,
      }}
    >
      {children}
    </div>
  );
};
export const Caption = ({
  cues,
  compact = false,
}: {
  cues: CaptionCue[];
  compact?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = cues.find(
    (c) => (frame * 1000) / fps >= c.startMs && (frame * 1000) / fps < c.endMs,
  );
  if (!cue) return null;
  const parts = cue.emphasis ? cue.text.split(cue.emphasis) : [cue.text];
  return (
    <div
      style={{
        position: "absolute",
        left: 78,
        right: compact ? 180 : 150,
        top: compact ? 1460 : 1510,
        minHeight: compact ? undefined : 170,
        padding: "24px 28px",
        borderTop: compact ? undefined : `2px solid ${colors.line}`,
        borderRadius: compact ? 16 : undefined,
        background: compact ? "#19272e" : undefined,
        fontSize: compact ? 40 : 36,
        lineHeight: 1.45,
        textAlign: "center",
        whiteSpace: "pre-wrap",
      }}
    >
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <strong style={{ color: colors.accent }}>{cue.emphasis}</strong>
          )}
          {part}
        </span>
      ))}
    </div>
  );
};
export const CodePanel = ({
  lines,
  highlight,
  activeLine,
}: {
  lines: string[];
  highlight: boolean;
  activeLine?: number;
}) => (
  <div
    style={{
      border: `2px solid ${colors.line}`,
      borderRadius: 20,
      overflow: "hidden",
      background: "#152229",
    }}
  >
    <div
      style={{
        padding: "23px 30px",
        borderBottom: `2px solid ${colors.line}`,
        fontSize: 25,
        color: colors.muted,
      }}
    >
      Main.java <span style={{ float: "right" }}>JAVA</span>
    </div>
    <div
      style={{
        padding: "35px 20px",
        fontFamily: "var(--mono)",
        fontSize: 40,
        lineHeight: 1.9,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            whiteSpace: "pre",
            background: activeLine === i ? "#293c42" : undefined,
            borderRadius: 6,
            boxShadow:
              activeLine === i ? `inset 3px 0 ${colors.accent}` : undefined,
          }}
        >
          <span
            style={{
              width: 48,
              flexShrink: 0,
              color: "#637780",
              fontSize: 25,
              paddingTop: 13,
            }}
          >
            {i + 1}
          </span>
          <span>
            {line.split(/(\b(?:int|10|0)\b|a \/ b)/g).map((token, j) => (
              <span
                key={j}
                style={{
                  color:
                    token === "int"
                      ? "#a2c9ff"
                      : /^(10|0)$/.test(token)
                        ? colors.accent
                        : undefined,
                  background:
                    token === "a / b" && highlight ? "#774636" : undefined,
                  borderRadius: 5,
                }}
              >
                {token}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  </div>
);
