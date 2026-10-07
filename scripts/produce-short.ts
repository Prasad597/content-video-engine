import { args, loadAuthoredPackage } from "./project";
import { produceShort, reportFailure } from "./production/workflow";

async function main() {
  const options = args(["content"]);
  if (!options.content) throw new Error("Use --content <short-id>");
  await loadAuthoredPackage(options.content);
  await produceShort(options.content);
}
main().catch(reportFailure);
