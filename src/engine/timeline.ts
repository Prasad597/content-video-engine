export const secondsToFrames = (seconds: number, fps = 30) =>
  Math.round(seconds * fps);

export const sceneStart = (scene: { start: number }, fps = 30) =>
  secondsToFrames(scene.start, fps);

export const sceneDuration = (scene: { start: number; end: number }, fps = 30) =>
  secondsToFrames(scene.end - scene.start, fps);

export const sceneEnd = (scene: { end: number }, fps = 30) =>
  secondsToFrames(scene.end, fps);
