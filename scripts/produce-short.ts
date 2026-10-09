import { args, loadContentPackage } from "./project";
import { produceShort, reportFailure } from "./production/workflow";

async function main() {
  const options = args(["content"]);
  if (!options.content) throw new Error("Use --content <short-id>");
  await loadContentPackage(options.content); // Production provenance preflight before any work.
  await produceShort(options.content);
}
main().catch(reportFailure);
