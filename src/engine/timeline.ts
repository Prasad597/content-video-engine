export const FPS = 30;
export const secondsToFrames = (seconds: number, fps = FPS) =>
  Math.round(seconds * fps);
export const sceneStart = (scene: { start: number }, fps = FPS) =>
  secondsToFrames(scene.start, fps);
export const sceneEnd = (scene: { end: number }, fps = FPS) =>
  secondsToFrames(scene.end, fps);
// Round boundaries, not the interval, to avoid one-frame holes at fractional times.
export const sceneDuration = (
  scene: { start: number; end: number },
  fps = FPS,
) => sceneEnd(scene, fps) - sceneStart(scene, fps);
export const durationFrames = (
  short: { scenes: { end: number }[] },
  fps = FPS,
) => secondsToFrames(short.scenes[short.scenes.length - 1].end, fps);
export const frameToSeconds = (frame: number, fps = FPS) => frame / fps;
