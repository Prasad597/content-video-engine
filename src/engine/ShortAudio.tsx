import { useEffect, useState } from "react";
import { Html5Audio, Sequence, delayRender, continueRender, cancelRender } from "remotion";
import type { ShortDefinition } from "./types";
import { secondsToFrames } from "./timeline";
import { musicFiles } from "./music";

type Props = { short: ShortDefinition; asset: (path: string) => string | undefined; fps: number };
function Layers({ short, asset, fps, gain = 1, bed }: Props & { gain?: number; bed?: string }) {
  const narration = asset(short.narration);
  return <>
    {narration && <Html5Audio src={narration} volume={(short.audio?.narrationVolume ?? 1) * gain} />}
    {bed && <Html5Audio src={bed} volume={gain} />}
    {short.audio?.effects?.map((effect, i) => asset(effect.file) ?
      <Sequence key={i} from={secondsToFrames(effect.at, fps)} durationInFrames={secondsToFrames(effect.duration, fps)}>
        <Html5Audio src={asset(effect.file)!} volume={effect.volume * gain} />
      </Sequence> : null)}
  </>;
}
function WithMusic(props: Props & { metadata: string; bed: string }) {
  const [handle] = useState(() => delayRender("Loading music mix headroom"));
  const [gain, setGain] = useState<number>();
  useEffect(() => {
    let active = true;
    fetch(props.metadata).then((r) => { if (!r.ok) throw new Error("Missing prepared music metadata"); return r.json(); })
      .then((data) => {
        if (!Number.isFinite(data.gain) || data.gain <= 0 || data.gain > 1) throw new Error("Invalid prepared music headroom");
        if (active) { setGain(data.gain); continueRender(handle); }
      }).catch((error) => { if (active) cancelRender(error); });
    return () => { active = false; continueRender(handle); };
  }, [props.metadata, handle]);
  return gain === undefined ? null : <Layers {...props} gain={gain} />;
}
export function ShortAudio(props: Props) {
  const files = musicFiles(props.short.id);
  const bed = props.short.audio?.music && props.asset(files.bed);
  const metadata = props.asset(files.mix);
  if (bed && !metadata) throw new Error("Prepared music requires mix metadata; restart preview/render");
  return bed && metadata ? <WithMusic {...props} bed={bed} metadata={metadata} /> : <Layers {...props} />;
}
