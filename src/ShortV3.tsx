import { InterviewShort } from "./ShortV2";
import {
  audioV3,
  audioV3Interactive,
  beatsV3,
  beatsV3Interactive,
  contentV3,
  contentV3Interactive,
} from "./content/unchecked-exception-v3";

export const ShortV3 = () => (
  <InterviewShort c={contentV3} beats={beatsV3} audio={audioV3} branded />
);

export const ShortV3Interactive = () => (
  <InterviewShort
    c={contentV3Interactive}
    beats={beatsV3Interactive}
    audio={audioV3Interactive}
    branded
  />
);
