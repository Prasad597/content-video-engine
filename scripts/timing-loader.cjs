require("tsx/cjs");
const { dirname, resolve, join } = require("node:path");
module.exports = function () {
  this.cacheable(false); // Hash checks must run on every build, including Studio rebuilds.
  const root = resolve(__dirname, "..");
  delete require.cache[this.resourcePath];
  const authored = require(this.resourcePath).default;
  const { resolvePackageTiming, hasSemanticTiming, pendingEstimatedPreview } = require("./timing.ts");
  const directory = dirname(this.resourcePath);
  this.addDependency(join(directory, "generated/beats.preview-estimated.json"));
  this.addDependency(join(directory, "generated/manual-timing.json"));
  this.addDependency(join(directory, "generated/beats.json"));
  if (pendingEstimatedPreview(directory)) return "export default null;";
  if (hasSemanticTiming(authored)) {
    for (const file of ["script.txt", "generated/beats.json", "generated/alignment.json"])
      this.addDependency(join(directory, file));
    this.addDependency(resolve(root, authored.narration));
  }
  return `export default ${JSON.stringify(resolvePackageTiming(authored, directory, root))};`;
};
