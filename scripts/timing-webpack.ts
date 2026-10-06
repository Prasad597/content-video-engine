import { resolve } from "node:path";
import type { WebpackOverrideFn } from "@remotion/bundler";

// Node build boundary: only resolved JSON reaches Root/React/Remotion.
export const timingWebpackOverride: WebpackOverrideFn = (config) => ({
  ...config,
  module: { ...config.module, rules: [
    ...(config.module?.rules ?? []),
    { test: /[/\\]content[/\\][^/\\]+[/\\]content\.ts$/, enforce: "pre",
      use: [{ loader: resolve(__dirname, "timing-loader.cjs") }] },
  ] },
});
