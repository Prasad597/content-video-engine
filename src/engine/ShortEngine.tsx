import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getStaticFiles } from "@remotion/studio";
import { Caption } from "../components";
import { BrandWatermark } from "../brand/BrandMark";
import { renderGenericScene } from "../scenes/GenericScenes";
import type { ChannelDefinition, ShortDefinition } from "./types";
import { sceneDuration, sceneStart } from "./timeline";

const progressBar: CSSProperties = {
  position: "absolute",
  left: 78,
  right: 180,
  top: 1620,
  height: 4,
  background: "#334149",
};

export const ShortRenderer = ({
  short,
  channel,
}: {
  short: ShortDefinition;
  channel: ChannelDefinition;
}) => <ShortEngine short={short} channel={channel} />;

export const ShortEngine = ({
  short,
  channel,
}: {
  short: ShortDefinition;
  channel: ChannelDefinition;
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const files = getStaticFiles();

  const narrationPath = short.narration;
  const narrationName = narrationPath.split("/").pop();
  const narrationFile = files.find(
    (file) => file.name === narrationPath || file.name.endsWith(`/${narrationName}`) || file.name === narrationName,
  )?.src;

  const duration = Math.max(
    ...short.scenes.map((scene) => scene.end),
    1,
  );

  return (
    <AbsoluteFill
      style={{
        background: channel.theme.ink,
        color: channel.theme.text,
        fontFamily: "var(--sans)",
      }}
    >
      <BrandWatermark name={channel.name} />
      {short.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={sceneStart(scene, fps)}
          durationInFrames={sceneDuration(scene, fps)}
          name={scene.id}
        >
          <div style={{ position: "absolute", left: 78, right: 180, top: 280 }}>
            {renderGenericScene(scene, channel)}
          </div>
        </Sequence>
      ))}

      {short.captions && short.captions.length > 0 ? <Caption cues={short.captions} compact /> : null}

      {!narrationFile ? (
        <div
          style={{
            position: "absolute",
            left: 78,
            right: 78,
            bottom: 180,
            border: `1px solid ${channel.theme.line}`,
            borderRadius: 12,
            padding: "18px 20px",
            background: "rgba(16,25,31,0.82)",
            color: channel.theme.text,
            fontSize: 28,
            textAlign: "center",
          }}
        >
          Missing narration: place the final audio at <strong>{narrationPath}</strong>.
        </div>
      ) : (
        <Html5Audio src={narrationFile} volume={1} />
      )}

      <div style={progressBar}>
        <div
          style={{
            height: 4,
            background: channel.theme.accent,
            width: `${(100 * frame) / (durationInFrames - 1)}%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const getShortDurationSeconds = (short: ShortDefinition) =>
  Math.max(...short.scenes.map((scene) => scene.end), 1);
