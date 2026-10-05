import assert from "node:assert/strict";
import { bundle } from "@remotion/bundler";
import { getCompositions } from "@remotion/renderer";
import { short001Content } from "../content/short-001/content";
import { short002Content } from "../content/short-002/content";
import { validateShortDefinition } from "../src/engine/validateShort";

async function main() {
  validateShortDefinition(short001Content);
  validateShortDefinition(short002Content);

  const serveUrl = await bundle({ entryPoint: "src/index.ts" });
  const compositions = await getCompositions(serveUrl);

  assert.equal(
    compositions.length,
    2,
    "Only the generic Short #001 and #002 compositions should be registered",
  );

  for (const id of ["short-001", "short-002"]) {
    const match = compositions.find((composition) => composition.id === id);
    assert(match, `Missing registered composition: ${id}`);
    assert.equal(match.width, 1080);
    assert.equal(match.height, 1920);
    assert.equal(match.fps, 30);
  }

  assert(short001Content.scenes.length > 0);
  assert(short002Content.scenes.length > 0);
  console.log(
    `PASS: content schema validation and generic Remotion registration for ${short001Content.id} + ${short002Content.id}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
