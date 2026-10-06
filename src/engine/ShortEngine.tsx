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
import { GenericScene } from "../scenes/GenericScenes";
import type { ChannelDefinition, ShortDefinition } from "./types";
import { sceneDuration, sceneStart, secondsToFrames } from "./timeline";
import { SafeContentLayer, SafeContentSlot, SafeZoneOverlay } from "../PlatformSafeFrame";
export const ShortEngine = ({
  short,
  channel,
  showSafeZones = false,
}: {
  short: ShortDefinition;
  channel: ChannelDefinition;
  showSafeZones?: boolean;
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const files = getStaticFiles();
  const asset = (name: string) => files.find((file) => file.name === name)?.src;
  const narration = asset(short.narration);
  const music = short.audio?.music;
  const style = {
    ...Object.fromEntries(
      Object.entries(channel.theme).map(([key, value]) => [`--${key}`, value]),
    ),
    background: channel.theme.ink,
    color: channel.theme.text,
    fontFamily: "var(--sans)",
  } as CSSProperties;
  return (
    <AbsoluteFill style={style}>
      <SafeContentLayer>
      <BrandWatermark channel={channel} />
      {short.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          name={scene.id}
          from={sceneStart(scene, fps)}
          durationInFrames={sceneDuration(scene, fps)}
        >
          <SafeContentSlot>
            <GenericScene scene={scene} channel={channel} />
          </SafeContentSlot>
        </Sequence>
      ))}
      <SafeContentSlot caption><Caption cues={short.captions ?? []} /></SafeContentSlot>
      </SafeContentLayer>
      {narration && (
        <Html5Audio
          src={narration}
          volume={short.audio?.narrationVolume ?? 1}
        />
      )}
      {music && music.volume > 0 && asset(music.file) && (
        <Html5Audio src={asset(music.file)!} volume={music.volume} loop />
      )}
      {short.audio?.effects?.map((effect, i) =>
        asset(effect.file) ? (
          <Sequence
            key={i}
            from={secondsToFrames(effect.at, fps)}
            durationInFrames={secondsToFrames(effect.duration, fps)}
          >
            <Html5Audio src={asset(effect.file)!} volume={effect.volume} />
          </Sequence>
        ) : null,
      )}
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 180,
          top: 1620,
          height: 4,
          background: channel.theme.line,
        }}
      >
        <div
          style={{
            height: 4,
            background: channel.theme.accent,
            width: `${(100 * frame) / Math.max(1, durationInFrames - 1)}%`,
          }}
        />
      </div>
      {showSafeZones && <SafeZoneOverlay />}
    </AbsoluteFill>
  );
};
