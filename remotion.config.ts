import { Config } from "@remotion/cli/config";
import { timingWebpackOverride } from "./scripts/timing-webpack";
Config.overrideWebpackConfig(timingWebpackOverride);
