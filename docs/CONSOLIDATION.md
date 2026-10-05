# Repository audit and consolidation

Audit performed before source edits. Initial Git status contained only the owner's untracked MP3; no tracked edits were present.

## Findings

The repository already had seven generic scene types, a typed definition, channel folder, starter, and content for Shorts 001 and 002. Root registered only those two IDs. The render script repeated that fixed registry; new-short accepted a positional argument, overwrote existing content, and did not register its output. Thus the documented new-content workflow did not work.

The generic scene migration removed the original challenge/countdown and progressive execution/hierarchy. Generic branding still defaulted to one channel and derived the wrong monogram from its name. CodePanel hard-coded a Java filename, language and division expression. Caption imported a type from historical content. Narration used ambiguous basename matching; files outside public were not staged. Missing-narration diagnostics were visible in the video. Validation did not cover these cases, NaN timing, captions or complete type-specific requirements. The generic entrypoint also did not load bundled font CSS.

## Why the old files existed

| Old file                              | Imports / role                                                                                                                                                   | Disposition after replacement validation                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| src/content/unchecked-exception.ts    | Imported by inactive Short.tsx, historical v2 data, and the active components.tsx CaptionCue type. Mixed lesson/schema/old composition metadata.                 | CaptionCue uses engine/types.ts; lesson is standard content. Delete.                                                |
| src/content/unchecked-exception-v2.ts | Imported by inactive ShortV2.tsx and v3 data. Lesson, scene-relative beats, audio cues.                                                                          | Timed generic hook/code/diagram/rule options now represent this behavior. Delete.                                   |
| src/content/unchecked-exception-v3.ts | Imported only by inactive ShortV3.tsx. Both normal and interactive historical timing/audio data, including beats beyond scene bounds in the interactive variant. | Canonical lesson/timing lives in content/short-001/content.ts. No reusable engine logic required this file. Delete. |

Short.tsx, ShortV2.tsx and ShortV3.tsx were absent from Root's active import graph. Their obsolete brand component was only used by that chain. Their reusable retention behavior was extracted into options on the existing generic scenes before removal. No new rendering platform or separate domain schema was added.

## Retained / migrated

- Short 002 already existed; retain it in the same schema, with its content intact and a default export for discovery.
- English spoken script and Java companion move into content/short-001/.
- Canonical narration is copied byte-for-byte to content/short-001/audio/narration.wav. Original public recordings are retained because their provenance matters; the interactive recording is not treated as an interchangeable duplicate.
- Existing FINAL, FINAL_INTERACTIVE and historical MP4s are retained. FINAL is a historical reference, not the source architecture. New generic renders now use content/short-001/output/short-001.mp4.
- The untracked owner MP3 is untouched. No automatic TTS, transcription or narration synchronization is performed. Content timing remains editorial and should be verified with the approved recording.
- Dependencies were checked against imports: Remotion CLI/bundler/renderer/studio, React/DOM, bundled fonts, TypeScript/tsx and type packages remain in use. No dependency removals are justified.
- Old generated frame/debug helpers are reproducible and reference retired composition IDs; they may be removed after replacement checks. Unknown output/audio assets are left alone.

## Verification completed

- TypeScript and discovery/content/channel/path/timeline validation passed. Template and both canonical Shorts register automatically at 1080×1920 / 30 FPS.
- Every canonical scene was rendered for visual inspection; a template MP4 smoke render passed without production narration.
- Temporary content-only String-immutability and deadlock examples each rendered a complete 6-second acceptance fixture. The deadlock example used a second channel and theme. No engine/scene/Root edits were needed. Temporary definitions were removed afterward so short-003 remains available.
- Existing-content overwrite protection passed. On this Windows PowerShell installation use npm.cmd to preserve named arguments; README contains the exact tested workflow.
- Canonical Short 001 renders to content/short-001/output/short-001.mp4 with the preserved narration; its timeline is 42 seconds. The earlier FINAL/reference MP4s and source WAV checksums remain unchanged.
- 51 obsolete generated frame/helper files and two verified synthetic audio-test directories were removed. Existing reference/final MP4s, real recordings and the owner's untracked MP3 were retained.
- No matching lesson/brand terms remain in generic source or scripts: lesson-specific terms are confined to content/short-001, and brand strings to channel configuration. No commit or push was performed.

## Package output organization

The loader returns the resolved content directory; the renderer creates output/ there and names the MP4 after the validated content ID. Engine, scenes, channel config, lesson definitions and audio are unchanged. The existing Short 001 script was renamed byte-for-byte to script.txt. Short 002 and the template have empty script placeholders; no narration or lesson was invented.

Temporary validation/staging files live under `.tmp/`; canonical production renders remain under `content/<id>/output/`. Root-level `out/` is not used. Historical reference files are kept only in the relevant content package output folder, not at repository root.
