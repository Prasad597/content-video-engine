import type { ReactNode } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionCue, CodeDisplay } from "./engine/types";
import { frameToSeconds, secondsToFrames } from "./engine/timeline";
import { SAFE_WIDTH } from "./PlatformSafeFrame";

// Colors are CSS variables supplied by the selected channel, never brand defaults.
export const colors = {
  ink: "var(--ink)",
  muted: "var(--muted)",
  text: "var(--text)",
  accent: "var(--accent)",
  line: "var(--line)",
  red: "var(--red)",
};
export const Kicker = ({ children }: { children: ReactNode }) =>
  children ? (
    <div
      style={{
        color: colors.accent,
        fontSize: 27,
        fontWeight: 700,
        letterSpacing: 4,
        marginBottom: 40,
      }}
    >
      {children}
    </div>
  ) : null;
export const Reveal = ({
  at = 0,
  children,
}: {
  at?: number;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - secondsToFrames(at, fps),
    fps,
    config: { damping: 200 },
    durationInFrames: secondsToFrames(0.4, fps),
  });
  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 14}px)`,
      }}
    >
      {children}
    </div>
  );
};
export const Caption = ({ cues }: { cues: CaptionCue[] }) => {
  const t = frameToSeconds(useCurrentFrame(), useVideoConfig().fps) * 1000;
  const cue = cues.find((c) => t >= c.startMs && t < c.endMs);
  if (!cue) return null;
  return (
    <div
      style={{
        padding: "24px 28px",
        background: colors.ink,
        borderTop: `2px solid ${colors.line}`,
        fontSize: 40,
        lineHeight: 1.45,
        textAlign: "center",
      }}
    >
      {(cue.emphasis ? cue.text.split(cue.emphasis) : [cue.text]).map(
        (part, i) => (
          <span key={i}>
            {i > 0 && (
              <strong style={{ color: colors.accent }}>{cue.emphasis}</strong>
            )}
            {part}
          </span>
        ),
      )}
    </div>
  );
};
export const CodePanel = ({
  code,
  filename,
  language,
  keywords = [],
  activeLine,
  highlight,
}: CodeDisplay) => {
  // Content supplies language-specific keywords; the tokenizer is domain-neutral.
  const fontSize = Math.min(
    40,
    Math.floor((SAFE_WIDTH - 92) / (Math.max(...code.map((line) => line.length), 1) * 0.61)),
  );
  return (
    <div
      style={{
        border: `2px solid ${colors.line}`,
        borderRadius: 20,
        overflow: "hidden",
        background: colors.ink,
      }}
    >
      {(filename || language) && (
        <div
          style={{
            padding: "23px 30px",
            borderBottom: `2px solid ${colors.line}`,
            fontSize: 25,
            color: colors.muted,
          }}
        >
          {filename}
          <span style={{ float: "right" }}>{language}</span>
        </div>
      )}
      <div
        style={{
          padding: "28px 20px",
          fontFamily: "var(--mono)",
          fontSize,
          lineHeight: 1.85,
        }}
      >
        {code.map((line, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              whiteSpace: "pre",
              background: activeLine === i ? colors.line : undefined,
              borderRadius: 6,
              boxShadow:
                activeLine === i ? `inset 3px 0 ${colors.accent}` : undefined,
            }}
          >
            <span
              style={{
                width: 48,
                flexShrink: 0,
                fontSize: 25,
                color: colors.muted,
                paddingTop: 7,
              }}
            >
              {i + 1}
            </span>
            <span>
              {(highlight ? line.split(highlight) : [line]).map((part, j) => (
                <span key={j}>
                  {j > 0 && (
                    <span
                      style={{
                        background: colors.red,
                        color: colors.ink,
                        borderRadius: 4,
                      }}
                    >
                      {highlight}
                    </span>
                  )}
                  {part.split(/(\b\w+\b)/g).map((token, k) => (
                    <span
                      key={k}
                      style={{
                        color:
                          keywords.includes(token) || /^\d+$/.test(token)
                            ? colors.accent
                            : undefined,
                      }}
                    >
                      {token}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
