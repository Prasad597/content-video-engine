import type { CSSProperties } from "react";
import { Kicker, CodePanel, colors } from "../components";
import type { ChannelDefinition, SceneDefinition } from "../engine/types";
import { ChannelSignature } from "../brand/BrandMark";

const mono: CSSProperties = { fontFamily: "var(--mono)" };
const card: CSSProperties = {
  border: `2px solid ${colors.line}`,
  borderRadius: 18,
  background: "#152229",
  padding: "25px 30px",
};

const titleStyle = (size = 78): CSSProperties => ({
  fontSize: size,
  lineHeight: 1.12,
  fontWeight: 700,
  letterSpacing: -3,
  whiteSpace: "pre-line",
  margin: 0,
});

export const renderGenericScene = (scene: SceneDefinition, channel: ChannelDefinition) => {
  const palette = { ...colors, ...channel.theme };
  switch (scene.type) {
    case "hook":
      return (
        <>
          <Kicker>{scene.kicker ?? "HOOK"}</Kicker>
          <h1 style={{ ...titleStyle(), color: palette.text }}>{scene.title}</h1>
          {scene.subtitle ? (
            <div style={{ fontSize: 38, marginTop: 28, color: palette.muted }}>{scene.subtitle}</div>
          ) : null}
        </>
      );
    case "explanation":
      return (
        <>
          <Kicker>{scene.kicker ?? "EXPLANATION"}</Kicker>
          <h2 style={{ ...titleStyle(72), color: palette.text }}>{scene.title}</h2>
          <div style={{ marginTop: 42, display: "grid", gap: 18 }}>
            {(scene.body ?? []).map((line) => (
              <div key={line} style={{ fontSize: 36, color: palette.muted, lineHeight: 1.5 }}>
                {line}
              </div>
            ))}
          </div>
        </>
      );
    case "code":
      return (
        <>
          <Kicker>{scene.kicker ?? "CODE"}</Kicker>
          <CodePanel lines={scene.code} highlight={false} activeLine={scene.activeLine} />
          {scene.successLabel ? (
            <div style={{ marginTop: 24, fontSize: 34, color: palette.accent }}>{scene.successLabel}</div>
          ) : null}
        </>
      );
    case "diagram":
      return (
        <>
          <Kicker>{scene.kicker ?? "DIAGRAM"}</Kicker>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", alignItems: "stretch" }}>
            {scene.nodes.map((node, index) => (
              <div key={`${scene.id}-${node.label}`} style={{ flex: 1 }}>
                {index > 0 ? <div style={{ textAlign: "center", color: palette.muted, fontSize: 40, margin: "18px 0" }}>↓</div> : null}
                <div
                  style={{
                    ...card,
                    borderColor: index === 0 ? palette.accent : palette.line,
                    background: index === 0 ? "#1c2d30" : "#152229",
                    textAlign: "center",
                    fontSize: 34,
                    minHeight: 110,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...mono,
                  }}
                >
                  {node.label}
                  {node.value ? <div style={{ display: "block", fontSize: 21, color: palette.muted, marginTop: 10 }}>{node.value}</div> : null}
                </div>
              </div>
            ))}
          </div>
          {scene.note ? <div style={{ marginTop: 28, color: palette.muted, fontSize: 27 }}>{scene.note}</div> : null}
        </>
      );
    case "comparison":
      return (
        <>
          <Kicker>{scene.kicker ?? "COMPARISON"}</Kicker>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            <div style={{ ...card, borderColor: palette.line }}>
              <div style={{ fontSize: 25, letterSpacing: 3, color: palette.muted }}>{scene.leftLabel}</div>
              <div style={{ marginTop: 16, fontSize: 52, ...mono, color: palette.text }}>{scene.leftValue}</div>
            </div>
            <div style={{ ...card, borderColor: palette.accent }}>
              <div style={{ fontSize: 25, letterSpacing: 3, color: palette.muted }}>{scene.rightLabel}</div>
              <div style={{ marginTop: 16, fontSize: 52, ...mono, color: palette.accent }}>{scene.rightValue}</div>
            </div>
          </div>
          {scene.note ? <div style={{ marginTop: 28, color: palette.muted, fontSize: 28 }}>{scene.note}</div> : null}
        </>
      );
    case "rule":
      return (
        <>
          <Kicker>{scene.kicker ?? "RULE"}</Kicker>
          <div style={{ ...card, borderColor: palette.accent, padding: "38px 24px", textAlign: "center" }}>
            {scene.rows.map((row, index) => (
              <div
                key={`${scene.id}-${row}`}
                style={{
                  fontSize: index === scene.rows.length - 1 ? 76 : index % 2 === 1 ? 52 : 58,
                  lineHeight: 1.45,
                  fontWeight: index === scene.rows.length - 1 ? 700 : 600,
                  color: index === scene.rows.length - 1 || index % 2 === 1 ? palette.accent : palette.text,
                  letterSpacing: -2,
                }}
              >
                {row}
              </div>
            ))}
          </div>
          {scene.note ? <div style={{ marginTop: 26, fontSize: 28, color: palette.muted }}>{scene.note}</div> : null}
        </>
      );
    case "outro":
      return (
        <>
          <Kicker>{scene.kicker ?? "OUTRO"}</Kicker>
          <h2 style={{ ...titleStyle(72), color: palette.text }}>{scene.title}</h2>
          {scene.subtitle ? <div style={{ marginTop: 30, fontSize: 36, color: palette.muted }}>{scene.subtitle}</div> : null}
          <div style={{ marginTop: 56 }}>
            <ChannelSignature name={channel.name} tagline={channel.tagline} />
          </div>
        </>
      );
    default:
      return null;
  }
};
