import { Composition } from "remotion";
import { ShortEngine } from "./engine/ShortEngine";
import { durationFrames, FPS } from "./engine/timeline";
import { MASTER } from "./PlatformSafeFrame";
import {
  validateChannel,
  validateShortDefinition,
} from "./engine/validateShort";
import type { ChannelDefinition, ShortDefinition } from "./engine/types";
// Webpack's context includes new content/channel folders without editing this file.
declare const require: {
  context(
    path: string,
    recursive: boolean,
    filter: RegExp,
  ): { keys(): string[]; (key: string): { default: unknown } };
};
const contentFiles = require.context(
  "../content",
  true,
  /^\.\/[^/]+\/content\.ts$/,
);
const channelFiles = require.context(
  "../channels",
  true,
  /^\.\/[^/]+\/index\.ts$/,
);
const channels = Object.fromEntries(
  channelFiles.keys().map((key) => {
    const channel = channelFiles(key).default as ChannelDefinition;
    validateChannel(channel);
    return [channel.id, channel];
  }),
);
const shorts = contentFiles
  .keys()
  .sort()
  .map((key) => contentFiles(key).default as ShortDefinition)
  .filter((short) => short !== null);
export const Root = () => (
  <>
    {shorts.map((short) => {
      validateShortDefinition(short);
      const channel = channels[short.channel];
      if (!channel) throw new Error(`Unknown channel: ${short.channel}`);
      return (
        <Composition
          key={short.id}
          id={short.id}
          component={ShortEngine}
          width={MASTER.width}
          height={MASTER.height}
          fps={FPS}
          durationInFrames={durationFrames(short)}
          defaultProps={{ short, channel, showSafeZones: false }}
          calculateMetadata={({ props }) => {
            validateShortDefinition(props.short);
            validateChannel(props.channel);
            return { durationInFrames: durationFrames(props.short) };
          }}
        />
      );
    })}
  </>
);
