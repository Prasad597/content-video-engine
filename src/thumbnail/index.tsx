import { Composition, getInputProps, registerRoot } from "remotion";
import { Thumbnail, type ThumbnailProps } from "./Thumbnail";
import { MASTER } from "../PlatformSafeFrame";
import { validateChannel, validatePublishingAssets } from "../engine/validateShort";
import "../style.css";

const ThumbnailRoot = () => {
  const props = getInputProps() as ThumbnailProps;
  validatePublishingAssets({ thumbnail: props.thumbnail });
  validateChannel(props.channel);
  return <Composition id="publishing-thumbnail" component={Thumbnail} width={MASTER.width} height={MASTER.height} fps={30} durationInFrames={1} defaultProps={props} />;
};
registerRoot(ThumbnailRoot);
