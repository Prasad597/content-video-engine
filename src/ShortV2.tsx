import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Html5Audio,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getStaticFiles } from "@remotion/studio";
import { Caption, CodePanel, colors, Kicker } from "./components";
import { audioV2, beats, contentV2 } from "./content/unchecked-exception-v2";
import { BrandSignature, BrandWatermark } from "./BrandMark";
import "./style.css";

type SceneProps = {
  c: typeof contentV2;
  beats: typeof beats & { but?: number; note?: number; brand?: number };
  branded?: boolean;
};

const mono: CSSProperties = { fontFamily: "var(--mono)" };
const title: CSSProperties = {
  fontSize: 78,
  lineHeight: 1.12,
  fontWeight: 700,
  letterSpacing: -3,
  whiteSpace: "pre-line",
  margin: 0,
};
const card: CSSProperties = {
  border: `2px solid ${colors.line}`,
  borderRadius: 18,
  background: "#152229",
  padding: "25px 30px",
};

// Every reveal is frame-driven, including scrubbing backwards in Studio.
const Reveal = ({
  at,
  children,
  style,
}: {
  at: number;
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - Math.round(at * fps),
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        ...style,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 14}px)`,
      }}
    >
      {children}
    </div>
  );
};

const ChallengeScene = ({ c, beats }: SceneProps) => {
  const frame = useCurrentFrame();
  const t = frame / useVideoConfig().fps;
  const answered = t >= beats.answer;
  const failed = t >= beats.runtime;
  return (
    <>
      <Kicker>JAVA INTERVIEW</Kicker>
      <h1 style={title}>{c.question}</h1>
      <div style={{ marginTop: 36 }}>
        <CodePanel
          lines={c.code}
          highlight={failed}
          activeLine={failed ? 3 : undefined}
        />
      </div>
      <div style={{ fontSize: 29, color: colors.muted, marginTop: 18 }}>
        {c.codeContext}
      </div>
      {!answered ? (
        <Reveal at={beats.options} style={{ marginTop: 35 }}>
          {c.choices.map((choice, i) => (
            <div
              key={choice}
              style={{
                ...card,
                display: "flex",
                alignItems: "center",
                gap: 24,
                fontSize: 36,
                marginBottom: 14,
              }}
            >
              <span style={{ ...mono, color: colors.accent, fontSize: 33 }}>
                {i === 0 ? "A" : "B"}
              </span>
              {choice}
            </div>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              marginTop: 24,
            }}
          >
            <span style={{ ...mono, fontSize: 38, color: colors.accent }}>
              {Math.max(
                1,
                3 -
                  Math.floor(
                    ((t - beats.options) * 3) / (beats.answer - beats.options),
                  ),
              )}
            </span>
            <div style={{ height: 4, flex: 1, background: colors.line }}>
              <div
                style={{
                  height: 4,
                  background: colors.accent,
                  width: `${Math.max(0, Math.min(1, (beats.answer - t) / (beats.answer - beats.options))) * 100}%`,
                }}
              />
            </div>
          </div>
        </Reveal>
      ) : (
        <div style={{ marginTop: 35 }}>
          <Reveal at={beats.answer}>
            <div
              style={{
                ...card,
                borderColor: colors.accent,
                color: colors.accent,
                fontSize: 56,
                fontWeight: 700,
              }}
            >
              ✓ {c.answer}
            </div>
          </Reveal>
          <Reveal at={beats.but ?? 4.5}>
            <div
              style={{
                fontSize: 29,
                letterSpacing: 4,
                color: colors.muted,
                margin: "22px 0",
              }}
            >
              BUT…
            </div>
          </Reveal>
          <Reveal at={beats.runtime}>
            <div
              style={{
                ...card,
                borderColor: colors.red,
                background: "#392923",
              }}
            >
              <div
                style={{ fontSize: 29, color: colors.red, marginBottom: 12 }}
              >
                RUNTIME ✕ · b = 0
              </div>
              <div style={{ ...mono, fontSize: 42, color: colors.red }}>
                {c.exception}
              </div>
            </div>
          </Reveal>
        </div>
      )}
    </>
  );
};

const ConceptScene = ({ c, beats }: SceneProps) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  return (
    <>
      <Kicker>THE INTERVIEW TRAP</Kicker>
      {t < beats.concept ? (
        <h2 style={{ ...title, fontSize: 72 }}>{c.why}</h2>
      ) : (
        <>
          <Reveal at={beats.concept}>
            <h2 style={{ ...title, color: colors.accent, fontSize: 82 }}>
              {c.concept}
            </h2>
          </Reveal>
          <Reveal at={beats.compiler} style={{ marginTop: 64, fontSize: 59 }}>
            {c.definition.lead}
          </Reveal>
          <Reveal at={beats.emphasis}>
            <div
              style={{
                fontSize: 104,
                fontWeight: 700,
                color: colors.accent,
                letterSpacing: -4,
                marginTop: 12,
              }}
            >
              {c.definition.emphasis}
            </div>
            <div style={{ fontSize: 53, marginTop: 12 }}>
              {c.definition.action}
            </div>
          </Reveal>
          <Reveal at={beats.catch} style={{ marginTop: 40 }}>
            <div style={{ ...card, fontSize: 52, ...mono }}>
              {c.handling[0]}
            </div>
          </Reveal>
          <Reveal at={beats.throws} style={{ marginTop: 18 }}>
            <div style={{ ...card, fontSize: 42, ...mono }}>
              <span style={{ color: colors.muted }}>or </span>
              {c.handling[1]}
            </div>
          </Reveal>
        </>
      )}
    </>
  );
};

const ExecutionScene = ({ c, beats }: SceneProps) => {
  const t = useCurrentFrame() / useVideoConfig().fps;
  const step = beats.execution.filter((at) => t >= at).length - 1;
  const failed = step === 4;
  const activeLine = step === 0 ? 0 : step < 3 ? 1 : 3;
  return (
    <>
      <Kicker>COMPILE TIME ✓ → RUNTIME</Kicker>
      <h2 style={{ ...title, fontSize: 70 }}>Follow one run.</h2>
      <div style={{ marginTop: 42 }}>
        <CodePanel
          lines={c.code}
          activeLine={activeLine}
          highlight={step >= 3}
        />
      </div>
      <div style={{ display: "flex", gap: 18, marginTop: 35 }}>
        <div style={{ ...card, flex: 1, fontSize: 43, ...mono }}>a = 10</div>
        <div
          style={{
            ...card,
            flex: 1,
            fontSize: 43,
            ...mono,
            color: step >= 2 ? colors.red : colors.muted,
          }}
        >
          b = {step >= 2 ? "0" : "?"}
        </div>
      </div>
      <div style={{ fontSize: 33, color: colors.muted, marginTop: 22 }}>
        {c.execution[step]}
      </div>
      <Reveal at={beats.execution[3]} style={{ marginTop: 36 }}>
        <div style={{ fontSize: 70, ...mono }}>
          10 / <span style={{ color: colors.red }}>0</span>
          <span style={{ fontSize: 35, color: colors.muted }}>
            {" "}
            ← integer division
          </span>
        </div>
      </Reveal>
      <Reveal at={beats.execution[4]} style={{ marginTop: 28 }}>
        <div
          style={{
            ...card,
            borderColor: colors.red,
            color: colors.red,
            background: failed ? "#392923" : undefined,
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 3, marginBottom: 12 }}>
            EXECUTION STOPS HERE
          </div>
          <div style={{ fontSize: 43, ...mono }}>{c.exception}</div>
        </div>
      </Reveal>
    </>
  );
};

const HierarchyScene = ({ c, beats }: SceneProps) => (
  <>
    <Kicker>WHY IT IS UNCHECKED</Kicker>
    {c.hierarchy.map((name, i) => (
      <Reveal key={name} at={beats.hierarchy[i]}>
        {i > 0 && (
          <div
            style={{
              fontSize: 34,
              color: colors.muted,
              textAlign: "center",
              lineHeight: "54px",
            }}
          >
            ↓
          </div>
        )}
        <div
          style={{
            ...card,
            textAlign: "center",
            ...mono,
            fontSize: 43,
            background: i === 2 ? colors.accent : card.background,
            color: i === 2 ? colors.ink : colors.text,
            borderColor: i === 2 ? colors.accent : colors.line,
          }}
        >
          {name}
        </div>
      </Reveal>
    ))}
    <Reveal at={beats.examples[0]}>
      <div
        style={{
          fontSize: 26,
          color: colors.accent,
          letterSpacing: 3,
          margin: "25px 0",
        }}
      >
        ↓ SUBCLASSES · UNCHECKED
      </div>
    </Reveal>
    {c.examples.map((name, i) => (
      <Reveal key={name} at={beats.examples[i]}>
        <div
          style={{
            ...mono,
            fontSize: 39,
            borderLeft: `3px solid ${colors.accent}`,
            padding: "16px 0 16px 22px",
          }}
        >
          {name}
        </div>
      </Reveal>
    ))}
    <Reveal at={beats.note ?? 6.5}>
      <div
        style={{
          fontSize: 27,
          lineHeight: 1.5,
          color: colors.muted,
          whiteSpace: "pre-line",
          marginTop: 32,
        }}
      >
        {c.note}
      </div>
    </Reveal>
  </>
);

const RuleScene = ({ c, beats, branded }: SceneProps) => (
  <>
    <Kicker>INTERVIEW RULE</Kicker>
    <div
      style={{
        ...card,
        padding: "40px 20px",
        borderColor: colors.accent,
        textAlign: "center",
      }}
    >
      {c.rule.map((line, i) => (
        <Reveal key={line} at={beats.rule[i]}>
          <div
            style={{
              fontSize: i === 4 ? 81 : i % 2 === 1 ? 53 : 56,
              fontWeight: i === 4 ? 700 : 600,
              lineHeight: 1.5,
              color: i === 4 || i % 2 === 1 ? colors.accent : colors.text,
              letterSpacing: -2,
            }}
          >
            {line}
          </div>
        </Reveal>
      ))}
    </div>
    <Reveal at={beats.support}>
      <div
        style={{
          fontSize: 43,
          lineHeight: 1.4,
          marginTop: 44,
          textAlign: "center",
        }}
      >
        {c.support}
      </div>
    </Reveal>
    {branded && (
      <Reveal at={beats.brand ?? 5.8}>
        <BrandSignature />
      </Reveal>
    )}
  </>
);

// Optional local assets only. Missing files never mount an audio element.
const AudioTracks = ({ audio }: { audio: typeof audioV2 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const files = getStaticFiles();
  const find = (name: string) => files.find((file) => file.name === name)?.src;
  const narration = find(audio.narration);
  const music = find(audio.music);
  return (
    <>
      {narration && (
        <Html5Audio src={narration} volume={audio.volume.narration} />
      )}
      {music && audio.volume.music > 0 && (
        <Html5Audio
          src={music}
          loop
          volume={(frame) =>
            audio.volume.music *
            interpolate(
              frame,
              [0, fps, durationInFrames - fps, durationInFrames - 1],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      )}
      {audio.effects.map((cue, i) => {
        const src = find(cue.file);
        const duration = Math.round(cue.duration * fps);
        return src ? (
          <Sequence
            key={i}
            from={Math.round(cue.at * fps)}
            durationInFrames={duration}
            name={cue.file}
          >
            <Html5Audio
              src={src}
              volume={(frame) =>
                audio.volume.sfx *
                interpolate(
                  frame,
                  [0, 2, duration - 3, duration],
                  [0, 1, 1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                )
              }
            />
          </Sequence>
        ) : null;
      })}
    </>
  );
};

const scenes = [
  ChallengeScene,
  ConceptScene,
  ExecutionScene,
  HierarchyScene,
  RuleScene,
];
export const InterviewShort = ({
  c = contentV2,
  beats: timing = beats,
  audio = audioV2,
  branded = false,
}: Partial<SceneProps> & { audio?: typeof audioV2 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: colors.ink,
        color: colors.text,
        fontFamily: "var(--sans)",
      }}
    >
      {branded ? (
        <BrandWatermark />
      ) : (
        <div
          style={{
            position: "absolute",
            left: 78,
            right: 180,
            top: 155,
            color: colors.muted,
            fontSize: 25,
            letterSpacing: 3,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>JAVA / EXCEPTIONS</span>
          <span>001 / V2</span>
        </div>
      )}
      {c.scenes.map((scene, i) => {
        const Scene = scenes[i];
        return (
          <Sequence
            key={scene.id}
            name={scene.id}
            from={Math.round(scene.start * fps)}
            durationInFrames={Math.round((scene.end - scene.start) * fps)}
          >
            <div
              style={{ position: "absolute", left: 78, right: 180, top: 270 }}
            >
              <Scene c={c} beats={timing} branded={branded} />
            </div>
          </Sequence>
        );
      })}
      <Caption cues={c.captions} compact />
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 180,
          top: 1620,
          height: 4,
          background: colors.line,
        }}
      >
        <div
          style={{
            height: 4,
            background: colors.accent,
            width: `${(100 * frame) / (durationInFrames - 1)}%`,
          }}
        />
      </div>
      <AudioTracks audio={audio} />
    </AbsoluteFill>
  );
};

// Keep the original composition and its defaults unchanged.
export const ShortV2 = () => <InterviewShort />;
