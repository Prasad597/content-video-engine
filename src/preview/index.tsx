import { AbsoluteFill, Composition, getInputProps, registerRoot } from "remotion";
import { ShortEngine } from "../engine/ShortEngine";
import { durationFrames, FPS } from "../engine/timeline";
import { validateShortDefinition, validateChannel } from "../engine/validateShort";
import type { ShortDefinition, ChannelDefinition } from "../engine/types";
import "../style.css";

type Props = { short: ShortDefinition & { timingProvenance: { mode: "preview-estimated"; publishable: false } }; channel: ChannelDefinition };
function Preview(props: Props) {
  return <AbsoluteFill><ShortEngine {...props} />
    <div style={{ position: "absolute", top: 165, left: 90, right: 180, padding: 18, background: "#8b210e", color: "white", fontFamily: "sans-serif", fontSize: 29, textAlign: "center", fontWeight: 800 }}>ESTIMATED — NOT FOR PUBLICATION</div>
  </AbsoluteFill>;
}
function Root() {
  const props = getInputProps() as Props;
  if (props.short?.timingProvenance?.mode !== "preview-estimated" || props.short.timingProvenance.publishable !== false)
    throw new Error("Explicit preview-estimated provenance required");
  const { timingProvenance: _, ...short } = props.short;
  validateShortDefinition(short); validateChannel(props.channel);
  return <Composition id="preview-estimated" component={Preview} width={1080} height={1920} fps={FPS}
    durationInFrames={durationFrames(short)} defaultProps={props} />;
}
registerRoot(Root);
