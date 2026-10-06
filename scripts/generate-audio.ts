import { args } from "./project";
import { generateNarration, loadProductionEnv, narrationPackage } from "./production/narration";
import { regenerationFlag, reportFailure } from "./production/workflow";

async function main() {
  const options = args(["content", "regenerate"]);
  if (!options.content) throw new Error("Use --content <short-id> [--regenerate true]");
  const regenerate = regenerationFlag(options.regenerate);
  const content = await narrationPackage(options.content);
  loadProductionEnv();
  await generateNarration(content, regenerate);
}
main().catch(reportFailure);
