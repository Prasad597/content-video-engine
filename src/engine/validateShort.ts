import type {
  ChannelDefinition,
  ShortDefinition,
  SceneDefinition,
  ThumbnailDefinition,
  PublishingDefinition,
} from "./types";
import { sceneDuration, secondsToFrames } from "./timeline";
const text = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;
export const validateId = (id: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(`Invalid id: ${id}`);
  return id;
};
export const validateAssetPath = (path: string) => {
  if (
    !text(path) ||
    path.includes("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    !/^(content|public)\/[\w./-]+\.(wav|mp3|m4a|ogg)$/i.test(path)
  )
    throw new Error(`Invalid local audio path: ${path}`);
  return path;
};
export const validateChannel = (channel: ChannelDefinition) => {
  validateId(channel.id);
  if (
    !text(channel.name) ||
    !text(channel.mark) ||
    channel.mark.length > 4 ||
    !text(channel.tagline)
  )
    throw new Error("Invalid channel branding");
  for (const key of ["ink", "muted", "text", "accent", "line", "red"] as const)
    if (!/^#[0-9a-f]{6}$/i.test(channel.theme?.[key] ?? ""))
      throw new Error(`Invalid channel color: ${key}`);
};
export const validatePublishingAssets = (short: { publishing?: PublishingDefinition; thumbnail?: ThumbnailDefinition }) => {
  const p = short.publishing;
  if (p !== undefined && (!p || !text(p.youtube?.title) || !text(p.youtube?.description) || !text(p.instagram?.caption)))
    throw new Error("Publishing requires a YouTube title/description and Instagram caption");
  const t = short.thumbnail;
  if (t === undefined) return;
  const fits = (value: unknown, max: number) => text(value) && (value as string).length <= max && !/[\r\n]/.test(value as string);
  if (!t || !text(t.headline) || t.headline.split("\n").length > 2 || !t.headline.split("\n").every((line) => fits(line, 26)))
    throw new Error("Thumbnail headline needs one or two non-empty lines, at most 26 characters each");
  if ((t.eyebrow !== undefined && !fits(t.eyebrow, 38)) || (t.subheadline !== undefined && !fits(t.subheadline, 48)))
    throw new Error("Thumbnail eyebrow/subheadline must be short single-line text (38/48 characters)");
  if (t.diagram) {
    const d = t.diagram;
    if (![d.left, d.right].every((n) => n && fits(n.label, 12) && fits(n.expression, 24) && fits(n.value, 8)) || !fits(d.destination, 28) || (d.verdict !== undefined && !fits(d.verdict, 2)))
      throw new Error("Invalid thumbnail diagram: use short labels, expressions, values and destination");
  }
};
export const validateShortDefinition = (short: ShortDefinition) => {
  if (
    !short ||
    !text(short.id) ||
    !text(short.title) ||
    !text(short.topic) ||
    !text(short.channel)
  )
    throw new Error("Missing short metadata");
  validateId(short.id);
  validateId(short.channel);
  validateAssetPath(short.narration);
  validatePublishingAssets(short);
  if (!Array.isArray(short.scenes) || !short.scenes.length)
    throw new Error("At least one scene is required");
  let previous = 0;
  const ids = new Set<string>();
  const assert = (ok: unknown, message: string) => {
    if (!ok) throw new Error(`${short.id}: ${message}`);
  };
  for (const scene of short.scenes) {
    assert(
      scene && text(scene.id) && !ids.has(scene.id),
      "Missing/duplicate scene id",
    );
    ids.add(scene.id);
    assert(
      Number.isFinite(scene.start) &&
        Number.isFinite(scene.end) &&
        scene.start === previous &&
        sceneDuration(scene) > 0,
      "Scenes must cover the timeline contiguously with finite increasing times",
    );
    previous = scene.end;
    const duration = scene.end - scene.start;
    const beat = (at: number) =>
      assert(
        Number.isFinite(at) && at >= 0 && at < duration,
        "Beat outside scene",
      );
    const sequence = (times: number[]) => {
      times.forEach((at, i) => {
        beat(at);
        if (i) assert(at >= times[i - 1], "Beats must be ordered");
      });
    };
    const code = (lines: string[], line?: number) => {
      assert(
        Array.isArray(lines) &&
          lines.length &&
          lines.every((l) => typeof l === "string"),
        "Missing code",
      );
      if (line !== undefined)
        assert(
          Number.isInteger(line) && line >= 0 && line < lines.length,
          "Invalid active code line",
        );
    };
    switch (scene.type) {
      case "hook":
        assert(text(scene.title), "Missing hook title");
        if (scene.code) code(scene.code.code, scene.code.activeLine);
        if (scene.choices)
          assert(
            scene.choices.length >= 2 && scene.choices.every(text),
            "Invalid choices",
          );
        if (scene.countdown) {
          beat(scene.countdown.start);
          beat(scene.countdown.end);
          assert(
            scene.countdown.end > scene.countdown.start &&
              Number.isInteger(scene.countdown.count) &&
              scene.countdown.count > 0,
            "Invalid countdown",
          );
        }
        scene.reveals?.forEach((c) => {
          beat(c.at);
          assert(text(c.text), "Empty reveal");
        });
        break;
      case "explanation":
        assert(text(scene.title), "Missing explanation title");
        if (scene.titleAt !== undefined) beat(scene.titleAt);
        if (scene.question) {
          beat(scene.question.until);
          assert(text(scene.question.text), "Missing question");
        }
        scene.reveals?.forEach((c) => {
          beat(c.at);
          assert(text(c.text), "Empty reveal");
        });
        break;
      case "code":
        code(scene.code, scene.activeLine);
        if (scene.steps) {
          sequence(scene.steps.map((s) => s.at));
          scene.steps.forEach((step) => {
            code(scene.code, step.activeLine);
            assert(text(step.status), "Missing step status");
            if (step.result) {
              beat(step.result.at);
              assert(text(step.result.text), "Missing result");
            }
          });
        }
        break;
      case "diagram":
        assert(
          Array.isArray(scene.nodes) && scene.nodes.length > 0,
          "Missing diagram nodes",
        );
        scene.nodes.forEach((n) => {
          assert(text(n.label), "Missing node label");
          if (n.at !== undefined) beat(n.at);
        });
        scene.examples?.forEach((n) => {
          assert(text(n.label), "Missing example label");
          beat(n.at);
        });
        if (scene.noteAt !== undefined) beat(scene.noteAt);
        break;
      case "comparison":
        assert(
          [
            scene.leftLabel,
            scene.rightLabel,
            scene.leftValue,
            scene.rightValue,
          ].every(text),
          "Incomplete comparison",
        );
        break;
      case "rule":
        assert(
          text(scene.title) && scene.rows?.length > 0 && scene.rows.every(text),
          "Incomplete rule",
        );
        if (scene.rowTimes) {
          assert(
            scene.rowTimes.length === scene.rows.length,
            "Row timing mismatch",
          );
          sequence(scene.rowTimes);
        }
        if (scene.noteAt !== undefined) beat(scene.noteAt);
        if (scene.signatureAt !== undefined) beat(scene.signatureAt);
        break;
      case "outro":
        assert(text(scene.title), "Missing outro title");
        break;
      default:
        throw new Error(
          `Unknown scene type: ${(scene as SceneDefinition).type}`,
        );
    }
  }
  let captionEnd = 0;
  for (const cue of short.captions ?? []) {
    assert(
      Number.isFinite(cue.startMs) &&
        Number.isFinite(cue.endMs) &&
        cue.startMs >= captionEnd &&
        cue.endMs > cue.startMs &&
        cue.endMs <= previous * 1000 &&
        text(cue.text),
      "Invalid caption timing/text",
    );
    if (cue.emphasis)
      assert(cue.text.includes(cue.emphasis), "Caption emphasis absent");
    captionEnd = cue.endMs;
  }
  const volume = (n: number) =>
    assert(Number.isFinite(n) && n >= 0 && n <= 1, "Audio volume must be 0..1");
  if (short.audio?.narrationVolume !== undefined)
    volume(short.audio.narrationVolume);
  if (short.audio?.music) {
    validateAssetPath(short.audio.music.file);
    volume(short.audio.music.volume);
  }
  for (const cue of short.audio?.effects ?? []) {
    validateAssetPath(cue.file);
    volume(cue.volume);
    assert(
      Number.isFinite(cue.at) &&
        cue.at >= 0 &&
        cue.duration > 0 &&
        secondsToFrames(cue.duration) > 0 &&
        cue.at + cue.duration <= previous,
      "Invalid effect timing",
    );
  }
  return true;
};
export const validateSceneTiming = (scenes: SceneDefinition[]) =>
  scenes.at(-1)?.end ?? 0;
