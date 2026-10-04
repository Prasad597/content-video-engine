import { InterviewShort } from "./ShortV2";
import { audioV3, beatsV3, contentV3 } from "./content/unchecked-exception-v3";

export const ShortV3 = () => (
  <InterviewShort c={contentV3} beats={beatsV3} audio={audioV3} branded />
);
