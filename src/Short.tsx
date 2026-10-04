import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { getStaticFiles } from "@remotion/studio";
import {
  content as c,
  video,
  type SceneId,
} from "./content/unchecked-exception";
import { Caption, CodePanel, colors, Entrance, Kicker } from "./components";
import "./style.css";

const QuestionScene = () => (
  <>
    <Kicker>{c.labels.series}</Kicker>
    <h1
      style={{
        fontSize: 98,
        lineHeight: 1.13,
        letterSpacing: -5,
        fontWeight: 600,
        whiteSpace: "pre-line",
        margin: 0,
      }}
    >
      {c.question}
    </h1>
    <div
      style={{
        width: 120,
        height: 8,
        background: colors.accent,
        marginTop: 64,
      }}
    />
  </>
);
const ThinkScene = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Kicker>{c.labels.series}</Kicker>
      <div style={{ fontSize: 68, lineHeight: 1.25 }}>{c.labels.think}</div>
      <div style={{ height: 4, background: colors.line, marginTop: 70 }}>
        <div
          style={{
            height: "100%",
            background: colors.accent,
            width: `${100 * (1 - frame / 90)}%`,
          }}
        />
      </div>
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 130,
          marginTop: 60,
          color: colors.muted,
        }}
      >
        {String(Math.max(1, 3 - Math.floor(frame / 30))).padStart(2, "0")}
      </div>
    </>
  );
};
const DefinitionScene = () => (
  <>
    <Kicker>{c.labels.definition}</Kicker>
    <div style={{ fontSize: 72, lineHeight: 1.25 }}>{c.definition.lead}</div>
    <div
      style={{
        color: colors.accent,
        fontSize: 104,
        fontWeight: 700,
        letterSpacing: -4,
        margin: "20px 0",
      }}
    >
      {c.definition.emphasis}
    </div>
    <div style={{ fontSize: 72, lineHeight: 1.3, whiteSpace: "pre-line" }}>
      {c.definition.action}
    </div>
    <div style={{ display: "flex", gap: 20, marginTop: 72 }}>
      {["try / catch", "throws"].map((t) => (
        <div
          key={t}
          style={{
            border: `2px solid ${colors.line}`,
            padding: "20px 28px",
            borderRadius: 12,
            fontSize: 36,
            fontFamily: "var(--mono)",
            color: colors.muted,
          }}
        >
          {t}
        </div>
      ))}
    </div>
  </>
);
const CodeScene = () => {
  const frame = useCurrentFrame();
  const showError = frame >= 120;
  return (
    <>
      <Kicker>{c.labels.code}</Kicker>
      <CodePanel lines={c.code} highlight={showError} />
      <div style={{ marginTop: 48, fontSize: 40, color: colors.accent }}>
        ✓ {c.labels.compile}
      </div>
      <div
        style={{
          opacity: interpolate(frame, [120, 138], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          marginTop: 26,
        }}
      >
        <div style={{ color: colors.muted, fontSize: 40, marginLeft: 8 }}>
          ↓
        </div>
        <div style={{ fontSize: 40, marginTop: 20, color: colors.red }}>
          {c.labels.runtime}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 43,
            color: colors.red,
            marginTop: 24,
          }}
        >
          {c.exception}
        </div>
      </div>
    </>
  );
};
const HierarchyScene = () => (
  <>
    <Kicker>{c.labels.hierarchy}</Kicker>
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      {c.hierarchy.map((name, i) => (
        <div key={name} style={{ width: "100%", textAlign: "center" }}>
          {i > 0 && (
            <div
              style={{ fontSize: 34, lineHeight: "58px", color: colors.muted }}
            >
              ↓
            </div>
          )}
          <div
            style={{
              border: `2px solid ${i === 2 ? colors.accent : colors.line}`,
              background: i === 2 ? colors.accent : "#152229",
              color: i === 2 ? colors.ink : colors.text,
              borderRadius: 14,
              padding: "22px 12px",
              fontFamily: "var(--mono)",
              fontSize: 43,
            }}
          >
            {name}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 34, lineHeight: "58px", color: colors.accent }}>
        ↓
      </div>
      <div
        style={{
          borderLeft: `3px solid ${colors.accent}`,
          paddingLeft: 27,
          alignSelf: "flex-start",
        }}
      >
        {c.examples.map((name) => (
          <div
            key={name}
            style={{ fontFamily: "var(--mono)", fontSize: 39, lineHeight: 1.9 }}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
    <div
      style={{
        fontSize: 26,
        color: colors.muted,
        lineHeight: 1.5,
        marginTop: 35,
        whiteSpace: "pre-line",
      }}
    >
      {c.labels.note}
    </div>
  </>
);
const TakeawayScene = () => (
  <>
    <Kicker>{c.labels.takeaway}</Kicker>
    <div
      style={{
        fontSize: 69,
        lineHeight: 1.35,
        fontWeight: 600,
        letterSpacing: -2,
        whiteSpace: "pre-line",
      }}
    >
      {c.takeaway.split("\n").map((line, i) => (
        <div
          key={line}
          style={{ color: i === 0 || i === 2 ? colors.accent : colors.text }}
        >
          {line}
        </div>
      ))}
    </div>
    <div
      style={{
        width: 120,
        height: 8,
        background: colors.accent,
        marginTop: 64,
      }}
    />
  </>
);
const scenes: Record<SceneId, React.ComponentType> = {
  question: QuestionScene,
  think: ThinkScene,
  definition: DefinitionScene,
  code: CodeScene,
  hierarchy: HierarchyScene,
  takeaway: TakeawayScene,
};

export const Short = () => {
  const frame = useCurrentFrame();
  const narration = getStaticFiles().find(
    (file) => file.name === "audio/narration.mp3",
  );
  return (
    <AbsoluteFill
      style={{
        background: colors.ink,
        color: colors.text,
        fontFamily: "var(--sans)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 115,
          left: 78,
          right: 150,
          display: "flex",
          justifyContent: "space-between",
          color: colors.muted,
          fontSize: 25,
          letterSpacing: 3,
        }}
      >
        <span>JAVA / EXCEPTIONS</span>
        <span>001</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 178,
          left: 78,
          right: 150,
          height: 2,
          background: colors.line,
        }}
      />
      {c.scenes.map((scene, i) => {
        const Scene = scenes[scene.id];
        const duration = (scene.end - scene.start) * video.fps;
        return (
          <Sequence
            key={scene.id}
            from={scene.start * video.fps}
            durationInFrames={duration}
            name={scene.id}
          >
            <div
              style={{
                position: "absolute",
                top: scene.id === "hierarchy" ? 295 : 395,
                left: 78,
                right: 150,
              }}
            >
              <Entrance duration={duration}>
                <Scene />
              </Entrance>
            </div>
            <div
              style={{
                position: "absolute",
                left: 78,
                top: 1740,
                fontSize: 23,
                letterSpacing: 3,
                color: colors.muted,
              }}
            >
              {String(i + 1).padStart(2, "0")} / 06
            </div>
          </Sequence>
        );
      })}
      <Caption cues={c.captions} />
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 150,
          top: 1800,
          height: 4,
          background: colors.line,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(100 * frame) / (video.durationInFrames - 1)}%`,
            background: colors.accent,
          }}
        />
      </div>
      {narration && <Html5Audio src={narration.src} />}
    </AbsoluteFill>
  );
};
