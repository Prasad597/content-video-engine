import { Composition } from "remotion";
import { Short } from "./Short";
import { video } from "./content/unchecked-exception";
import { ShortV2 } from "./ShortV2";
import { videoV2 } from "./content/unchecked-exception-v2";
import { ShortV3, ShortV3Interactive } from "./ShortV3";
import {
  videoV3,
  videoV3Interactive,
} from "./content/unchecked-exception-v3";
export const Root = () => (
  <>
    <Composition {...videoV3} component={ShortV3} />
    <Composition {...videoV3Interactive} component={ShortV3Interactive} />
    <Composition {...videoV2} component={ShortV2} />
    <Composition {...video} component={Short} />
  </>
);
