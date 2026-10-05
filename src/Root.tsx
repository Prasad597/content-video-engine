import { Composition } from "remotion";
import { noskipLearningChannel } from "../channels/noskip-learning";
import { short001Content } from "../content/short-001/content";
import { short002Content } from "../content/short-002/content";
import { ShortRenderer } from "./engine/ShortEngine";

const durationFromShort = (short: { scenes: { end: number }[] }) =>
  Math.round(Math.max(...short.scenes.map((scene) => scene.end)) * 30);

export const Root = () => (
  <>
    <Composition
      id="short-001"
      component={ShortRenderer}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={durationFromShort(short001Content)}
      defaultProps={{ short: short001Content, channel: noskipLearningChannel }}
    />
    <Composition
      id="short-002"
      component={ShortRenderer}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={durationFromShort(short002Content)}
      defaultProps={{ short: short002Content, channel: noskipLearningChannel }}
    />
  </>
);
