import type { SceneDefinition, ShortDefinition } from "./types";

export const validateShortDefinition = (short: ShortDefinition) => {
  const definition = short as ShortDefinition;
  const scenes = Array.isArray(definition.scenes) ? (definition.scenes as SceneDefinition[]) : [];
  const shortId = typeof definition.id === "string" ? definition.id : "unknown";

  if (!definition.id || !definition.title || !definition.topic || !definition.narration) {
    throw new Error(`Short ${shortId} is missing required metadata.`);
  }

  if (!scenes.length) {
    throw new Error(`Short ${shortId} must define at least one scene.`);
  }

  const ids = new Set<string>();
  for (const scene of scenes) {
    const sceneId = typeof scene?.id === "string" ? scene.id : "unknown";
    if (ids.has(sceneId)) {
      throw new Error(`Duplicate scene id in ${shortId}: ${sceneId}`);
    }
    ids.add(sceneId);

    if (!scene?.type) {
      throw new Error(`Scene ${sceneId} in ${shortId} is missing a type.`);
    }

    if (scene.start >= scene.end) {
      throw new Error(`Scene ${sceneId} in ${shortId} has invalid timing.`);
    }
  }

  for (let i = 1; i < scenes.length; i += 1) {
    const previous = scenes[i - 1];
    const current = scenes[i];
    if (current.start < previous.end) {
      throw new Error(`Scene overlap detected in ${shortId}: ${previous.id} and ${current.id}`);
    }
  }

  const validSceneTypes = new Set([
    "hook",
    "explanation",
    "code",
    "diagram",
    "comparison",
    "rule",
    "outro",
  ]);

  for (const scene of scenes) {
    const sceneId = typeof scene?.id === "string" ? scene.id : "unknown";
    if (!validSceneTypes.has(scene.type)) {
      throw new Error(`Unknown scene type in ${shortId}: ${scene.type}`);
    }
    if (scene.type === "code" && (!scene.code || !scene.code.length)) {
      throw new Error(`Code scene ${sceneId} in ${shortId} is missing code lines.`);
    }
  }

  return true;
};

export const validateSceneTiming = (scenes: SceneDefinition[]) => {
  const total = scenes[scenes.length - 1]?.end ?? 0;
  return total;
};
