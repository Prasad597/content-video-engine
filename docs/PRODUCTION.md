# V1 narration and production automation

## One-time setup

Use Node 22+ and the existing [CPU alignment setup](ALIGNMENT.md). Copy `.env.example` to `.env`, then set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`. Use the actual ID of your chosen **Abhi - Authentic Telugu Male** voice, not the display name. `ELEVENLABS_MODEL_ID` is optional; blank uses `eleven_multilingual_v2`. Existing shell variables take precedence over `.env`.

The adapter uses Node's built-in fetch and the official [ElevenLabs convert endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert), producing `mp3_44100_128`. No SDK or dotenv dependency is needed. This generation step uses your ElevenLabs quota; alignment remains local. Requests are never automatically retried. After a network failure, check ElevenLabs history before retrying: an interrupted request may still have consumed credits.

`.env`, audio and generated narration metadata (including voice ID) are ignored. Never commit keys or real voice IDs. Narration metadata is local reproducibility state, not an asset to share.

## Per Short

```powershell
npm.cmd run new-short -- --id short-007 --channel noskip-learning
# Edit content/short-007/script.txt
npm.cmd run prepare-short -- --content short-007
# Author content/short-007/content.ts using generated/beats.json
npm.cmd run produce-short -- --content short-007
```

Output: `content/short-007/output/short-007.mp4`.

Semantic `[MARKERS]` remain in `script.txt` for alignment but are never sent to TTS. Lowercase delivery directions are also omitted. Original section wording, case and punctuation are retained (backtick formatting removed). Existing alignment requires at least three spoken words per section; preparation checks this before generation. Finalize your script before preparing it.

`prepare-short` generates missing narration, then invokes the unchanged `align-short`. Existing generated audio is reused only when script and audio hashes match `generated/narration.json`. Even punctuation edits require restoration or intentional regeneration. Missing metadata on old/manual audio is supported; existing alignment hashes are checked when available. If neither metadata nor alignment exists, you must verify that the manual recording matches the script. Existing manual `align-short`, `validate`, and `render-short` remain available without TTS credentials or metadata.

`produce-short` runs existing typecheck, repository-wide validation, then the selected Short's renderer, stopping at the first failure. It does not generate content or narration.

## Intentional regeneration

```powershell
npm.cmd run generate-audio -- --content short-007 --regenerate true
npm.cmd run prepare-short -- --content short-007
```

`generate-audio` alone is also available, but refuses existing narration unless `--regenerate true` is explicitly supplied. Successful responses are written to a temporary file, checked with the existing ffprobe, then atomically replaced; ordinary failures preserve the old audio. A lock prevents concurrent generation. If interrupted during the audio/metadata commit, preparation refuses the pending transaction: inspect `generated/narration.pending.json`, restore matching files, and remove the pending marker only after recovery. Remove a leftover lock only after confirming no generation process is running.

Generated audio changes make the existing alignment stale; run preparation before rendering. Script editing, visual authoring and publishing remain manual.

Tests: `npm.cmd run test:production` uses mocked responses and cannot spend ElevenLabs credits.

## Publishing assets (optional, explicitly authored)

Add `publishing: { youtube: { title, description }, instagram: { caption } }` to the existing `content.ts`. Add `thumbnail: { eyebrow?, headline, subheadline?, diagram? }` for a deterministic 1080×1920 PNG. Headlines allow up to two lines of 26 characters each; the optional diagram has `left`/`right` nodes (`label`, `expression`, `value`), a `destination`, and optional `verdict`. Short #007 demonstrates the small debugger layout.

After typecheck → validate → successful MP4 rendering, `produce-short` renders the thumbnail with the existing local Remotion/font stack and writes exact UTF-8 text to `youtube-title.txt`, `youtube-description.txt`, and `instagram-caption.txt`, beside `thumbnail.png` in the package's `output/`. No AI/API calls are involved. Missing optional configuration warns and skips those artifacts, preserving legacy Shorts. Previously generated files are not deleted when configuration is removed; remove obsolete artifacts deliberately before publishing.

Artifacts are staged before individual atomic replacements. Generation failure preserves existing artifacts; a filesystem failure during the replacement sequence can leave a mix of complete old/new files and fails the command. Correct the filesystem issue and rerun production before publishing. Completion is reported only after every configured artifact succeeds.

Thumbnail essentials stay within the central square with inset padding; this is a conservative cover crop policy, separate from video playback safe areas, not a platform guarantee. Review the actual platform crop before uploading. `npm.cmd run test:publishing` checks metadata, failure behavior, legacy compatibility and an actual local PNG render.
