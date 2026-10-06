# Reusable educational Shorts

One engine + channel configuration + typed content + narration = video. The existing seven scene types are domain-neutral: hook, explanation, code, diagram, comparison, rule, outro. Content owns words, code labels/keywords, timing, countdowns, execution steps, reveals, hierarchy nodes and captions. Channel config owns the mark, name, tagline and palette.

## Setup and preview

Node.js 22+ and npm. Install with `npm ci`, then `npm run dev`. Studio automatically discovers `content/*/content.ts` and `channels/*/index.ts`; no registry edits. Restart Studio after creating content or changing audio. Remotion downloads its browser on first render; no separate FFmpeg install is required.

## New Short (Windows PowerShell)

```powershell
npm.cmd run new-short -- --id short-003 --channel noskip-learning
```

The command creates `content.ts`, an empty `script.txt`, and `audio/`, `assets/`, `output/` folders. Edit `content/short-003/content.ts` and `content/short-003/script.txt`, add optional inputs to `assets/`, then place the narration at `content/short-003/audio/narration.mp3` (or change the definition to a WAV path).

```powershell
npm.cmd run render-short -- --content short-003
```

Output: `content/short-003/output/short-003.mp4`. The renderer creates `output/` automatically from the resolved package directory; no output argument or channel-specific path is needed. The scaffold command refuses to overwrite an existing content folder. Use `npm` instead of `npm.cmd` in Bash/macOS/Linux; this machine's PowerShell npm.ps1 strips named script arguments, so use npm.cmd here. Do not modify Root, scenes or render scripts for a normal new Short.

A channel is a default-exported `ChannelDefinition` at `channels/<id>/index.ts`. Select it in content or use `--channel <id>` when rendering. Unknown channels fail clearly; there is no silent fallback. Copy the existing config to add another channel; engine code stays unchanged.

## Content convention

Every `content/<id>/content.ts` default-exports one `ShortDefinition` (numeric timing) or `AuthoredShortDefinition` (semantic timing) from `src/engine/types.ts`. Directory and content IDs must match (the starter folder `_template` is the exception). The canonical starter is `content/_template/content.ts`; it contains no programming-specific lesson.

Legacy `start`/`end` are absolute narration seconds; reveal/node/row/step times are scene-local seconds. Legacy caption times are absolute milliseconds. Times must be finite and scenes contiguous. Duration follows the last scene. See `docs/VOICE_WORKFLOW.md`.

For measured audio timing, annotate `script.txt` with `[SEMANTIC_MARKERS]`, set up the isolated CPU aligner once, then run `npm.cmd run align-short -- --content short-002`. Scenes and captions can use `timing: { from: "STRING_POOL", until: "LITERAL_TRUE" }`. The loader resolves these to numeric times before rendering. Missing/stale alignment fails with a preparation command; rendering never invokes a speech model. See [local alignment setup and contract](docs/ALIGNMENT.md).

Local narration/effect/music paths are exact repository-relative paths under `content/` or `public/`. They are validated and staged for the renderer; identical basenames in different folders cannot collide. WAV, MP3, M4A and OGG are supported. Missing audio produces a silent preview with a terminal warning, not a viewer-facing error banner. Malformed paths fail validation. Optional audio gains and SFX cues are part of the same content definition.

## Existing content

- `content/short-001/content.ts`: migrated challenge, definition, execution, hierarchy and interview rule; 42-second editorial timeline. Narration is `content/short-001/audio/narration.wav`. The preserved recording is 41.326 seconds; final voice/visual synchronization still needs editorial review. The unchanged script is `script.txt`; the runnable Java companion lives alongside content.
- `content/short-002/content.ts`: existing identity/equality visuals, unchanged; semantic scene/caption timing measured against its authoritative 54.595875-second narration. Requires current generated alignment and beats.
- `content/_template/content.ts`: 35-second domain-neutral starter, also visible in Studio.

`npm run render` renders canonical Short 001 to `content/short-001/output/short-001.mp4`. Previous reference MP4s are not overwritten.

## Validation

```powershell
npm run typecheck
npm run validate
```

Validation discovers all content, resolves channels, rejects malformed paths/timings, checks fractional-frame boundaries and semantic/stale-file rules, registers every composition in the browser, renders a representative frame of every scene, and encodes a silent template smoke MP4. Numeric previews still allow missing narration; semantic packages require their authoritative audio and current alignment. A full Short render uses `render-short` above. Generated outputs/audio/raw recordings remain Git-ignored; scripts, beats and optional assets are trackable. Empty assets/output folders use `.gitkeep`; ignored audio folders are created by scaffolding. Temporary validation and staging artifacts use `.tmp/`, never the canonical production destination. Alignment dependencies are isolated in tools/alignment/.venv; no new Node dependencies or credentials.

`docs/CONSOLIDATION.md` records the original import audit, migration decisions and retained owner files. Source is intentionally one engine: no historical specialized implementations, backend, platform, TTS or automatic publishing.
