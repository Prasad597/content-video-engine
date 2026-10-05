import type { CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Kicker, CodePanel, colors, Reveal } from "../components";
import { frameToSeconds } from "../engine/timeline";
import type { ChannelDefinition, SceneDefinition, Cue } from "../engine/types";
import { ChannelSignature } from "../brand/BrandMark";
const card: CSSProperties = {
  border: `2px solid ${colors.line}`,
  borderRadius: 18,
  background: colors.ink,
  padding: "24px 28px",
};
const title: CSSProperties = {
  fontSize: 72,
  lineHeight: 1.12,
  fontWeight: 700,
  letterSpacing: -3,
  whiteSpace: "pre-line",
  margin: 0,
  overflowWrap: "break-word",
};
const note: CSSProperties = {
  fontSize: 30,
  lineHeight: 1.4,
  color: colors.muted,
  marginTop: 24,
};
const CueView = ({ cue }: { cue: Cue }) => (
  <Reveal at={cue.at}>
    <div
      style={{
        marginTop: 24,
        fontSize: cue.size ?? 48,
        lineHeight: 1.25,
        fontWeight: 600,
        color:
          cue.tone === "alert"
            ? colors.red
            : cue.tone === "accent"
              ? colors.accent
              : colors.text,
        whiteSpace: "pre-line",
      }}
    >
      {cue.text}
    </div>
  </Reveal>
);

export const GenericScene = ({
  scene,
  channel,
}: {
  scene: SceneDefinition;
  channel: ChannelDefinition;
}) => {
  const t = frameToSeconds(useCurrentFrame(), useVideoConfig().fps);
  switch (scene.type) {
    case "hook": {
      const thinking = scene.countdown && t < scene.countdown.end;
      return (
        <>
          <Kicker>{scene.kicker}</Kicker>
          <h1 style={title}>{scene.title}</h1>
          {scene.code && (
            <div style={{ marginTop: 36 }}>
              <CodePanel {...scene.code} />
            </div>
          )}
          {scene.subtitle && <div style={note}>{scene.subtitle}</div>}
          {scene.choices && (!scene.countdown || thinking) && (
            <Reveal at={scene.countdown?.start ?? 0}>
              <div style={{ marginTop: 28 }}>
                {scene.choices.map((choice, i) => (
                  <div
                    key={i}
                    style={{ ...card, fontSize: 34, marginBottom: 12 }}
                  >
                    <span style={{ color: colors.accent, marginRight: 20 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice}
                  </div>
                ))}
              </div>
            </Reveal>
          )}
          {thinking && scene.countdown && (
            <Reveal at={scene.countdown.start}>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                  marginTop: 20,
                }}
              >
                <span style={{ fontSize: 38, color: colors.accent }}>
                  {Math.max(
                    1,
                    Math.ceil(
                      (scene.countdown.count * (scene.countdown.end - t)) /
                        (scene.countdown.end - scene.countdown.start),
                    ),
                  )}
                </span>
                <div style={{ height: 4, flex: 1, background: colors.line }}>
                  <div
                    style={{
                      height: 4,
                      background: colors.accent,
                      width: `${Math.max(0, Math.min(1, (scene.countdown.end - t) / (scene.countdown.end - scene.countdown.start))) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Reveal>
          )}
          {scene.reveals?.map((cue, i) => (
            <CueView key={i} cue={cue} />
          ))}
        </>
      );
    }
    case "explanation":
      return (
        <>
          <Kicker>{scene.kicker}</Kicker>
          {scene.question && t < scene.question.until ? (
            <h2 style={title}>{scene.question.text}</h2>
          ) : (
            <>
              <Reveal at={scene.titleAt ?? 0}>
                <h2 style={{ ...title, color: colors.accent }}>
                  {scene.title}
                </h2>
              </Reveal>
              {scene.body?.map((line, i) => (
                <div
                  key={i}
                  style={{ ...note, fontSize: 40, color: colors.text }}
                >
                  {line}
                </div>
              ))}
              {scene.reveals?.map((cue, i) => (
                <CueView key={i} cue={cue} />
              ))}
            </>
          )}
        </>
      );
    case "code": {
      const step = scene.steps?.filter((step) => t >= step.at).at(-1);
      return (
        <>
          <Kicker>{scene.kicker}</Kicker>
          {scene.title && (
            <h2 style={{ ...title, fontSize: 66, marginBottom: 36 }}>
              {scene.title}
            </h2>
          )}
          <CodePanel
            {...scene}
            activeLine={step?.activeLine ?? scene.activeLine}
            highlight={step?.highlight ?? scene.highlight}
          />
          {step?.values && (
            <div style={{ display: "flex", gap: 18, marginTop: 28 }}>
              {step.values.map((value, i) => (
                <div
                  key={i}
                  style={{
                    ...card,
                    flex: 1,
                    fontFamily: "var(--mono)",
                    fontSize: 42,
                  }}
                >
                  {value}
                </div>
              ))}
            </div>
          )}
          {(step?.status || scene.successLabel) && (
            <div style={note}>{step?.status ?? scene.successLabel}</div>
          )}
          {step?.result && <CueView cue={step.result} />}
        </>
      );
    }
    case "diagram":
      return (
        <>
          <Kicker>{scene.kicker}</Kicker>
          {scene.title && (
            <h2 style={{ ...title, fontSize: 58, marginBottom: 30 }}>
              {scene.title}
            </h2>
          )}
          {scene.nodes.map((node, i) => (
            <Reveal key={i} at={node.at ?? 0}>
              {i > 0 && (
                <div
                  style={{
                    fontSize: 32,
                    lineHeight: "48px",
                    textAlign: "center",
                    color: colors.muted,
                  }}
                >
                  ↓
                </div>
              )}
              <div
                style={{
                  ...card,
                  textAlign: "center",
                  fontFamily: "var(--mono)",
                  fontSize: 40,
                  background: node.emphasis ? colors.accent : colors.ink,
                  color: node.emphasis ? colors.ink : colors.text,
                }}
              >
                {node.label}
                {node.value && (
                  <div style={{ fontSize: 30, marginTop: 10 }}>
                    {node.value}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
          {scene.examples?.map((example, i) => (
            <Reveal key={i} at={example.at}>
              <div
                style={{
                  borderLeft: `3px solid ${colors.accent}`,
                  padding: "12px 20px",
                  fontFamily: "var(--mono)",
                  fontSize: 37,
                  marginTop: i === 0 ? 24 : 0,
                }}
              >
                {example.label}
              </div>
            </Reveal>
          ))}
          {scene.note && (
            <Reveal at={scene.noteAt ?? 0}>
              <div style={{ ...note, fontSize: 26 }}>{scene.note}</div>
            </Reveal>
          )}
        </>
      );
    case "comparison":
      return (
        <>
          <Kicker>{scene.kicker}</Kicker>
          {scene.title && (
            <h2 style={{ ...title, marginBottom: 32 }}>{scene.title}</h2>
          )}
          <div style={{ display: "grid", gap: 22 }}>
            {[
              [scene.leftLabel, scene.leftValue],
              [scene.rightLabel, scene.rightValue],
            ].map(([label, value], i) => (
              <div
                key={i}
                style={{
                  ...card,
                  borderColor: i ? colors.accent : colors.line,
                }}
              >
                <div style={{ fontSize: 28, color: colors.muted }}>{label}</div>
                <div
                  style={{
                    fontSize: 48,
                    lineHeight: 1.3,
                    marginTop: 12,
                    overflowWrap: "break-word",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          {scene.note && <div style={note}>{scene.note}</div>}
        </>
      );
    case "rule":
      return (
        <>
          <Kicker>{scene.kicker ?? scene.title}</Kicker>
          <div style={{ ...card, textAlign: "center", padding: "35px 20px" }}>
            {scene.rows.map((row, i) => (
              <Reveal key={i} at={scene.rowTimes?.[i] ?? 0}>
                <div
                  style={{
                    fontSize: i === scene.rows.length - 1 ? 64 : 52,
                    lineHeight: 1.5,
                    fontWeight: 600,
                    color:
                      i === scene.rows.length - 1 ? colors.accent : colors.text,
                    overflowWrap: "break-word",
                  }}
                >
                  {row}
                </div>
              </Reveal>
            ))}
          </div>
          {scene.note && (
            <Reveal at={scene.noteAt ?? 0}>
              <div
                style={{
                  ...note,
                  fontSize: 38,
                  textAlign: "center",
                  color: colors.text,
                }}
              >
                {scene.note}
              </div>
            </Reveal>
          )}
          {scene.signatureAt !== undefined && (
            <Reveal at={scene.signatureAt}>
              <ChannelSignature channel={channel} />
            </Reveal>
          )}
        </>
      );
    case "outro":
      return (
        <>
          <Kicker>{scene.kicker}</Kicker>
          <h2 style={title}>{scene.title}</h2>
          {scene.subtitle && <div style={note}>{scene.subtitle}</div>}
          <ChannelSignature channel={channel} />
        </>
      );
  }
};
