# NoSkipLearning — Java Short #001

V3 prepares **What is an Unchecked Exception in Java?** as an English-first public Short, preserving V2's challenge, code execution, hierarchy and final rule. A programmatic NSL mark adds subtle branding, with no logo intro or promotional CTA.

The **39-second visual preview** is 1080 × 1920 at 30 FPS. **OWNER'S REAL ENGLISH NARRATION is pending.** This is not the final upload artifact. V1 (41 seconds) and V2 (39 seconds) remain available.

## Run

Node.js 22+ and npm are required. Installation and Remotion's first browser download need internet access. No separate FFmpeg installation is needed.

```sh
npm ci
npm run dev
npm run typecheck
npm run validate
npm run render
```

Select `JavaUncheckedExceptionV3` in Studio. Default rendering writes **`out/video_001_v3.mp4`**, preserving `out/video_001.mp4` and `out/video_001_v2.mp4`. Explicit `render:v1` and `render:v2` scripts re-render the historical versions; do not run them if preserving those existing files. Generated output is Git-ignored.

## Owner's narration

Record [scripts/narration-v3-en.txt](scripts/narration-v3-en.txt), which contains spoken words only. Follow [docs/VOICE_WORKFLOW.md](docs/VOICE_WORKFLOW.md) for recording, cleanup, pacing, normalization and handoff. The processed master goes at **`public/audio/narration-v3-en.wav`**. It starts at time zero and is detected through Remotion's public-file manifest; absent narration mounts no audio track. Restart Studio after adding it.

The real narration sets the final timing. Do not force the recording into 39 seconds. In `src/content/unchecked-exception-v3.ts`, adjust `scenesV3` (seconds), `beatsV3` (seconds relative to each scene), and captions (absolute milliseconds). Duration follows the last scene; SFX follow scene/beat positions. Longer audio is otherwise cut off at the composition end. No automatic alignment, TTS, voice cloning, enhancement provider, credentials or API keys are implemented.

Provisional scenes: 0–7 challenge/reveal, 7–17 concept/definition, 17–24 execution, 24–32 hierarchy, 32–39 final rule. Captions are selective English phrases, not a full transcript; prominent technical text carries the rest. They are not yet synchronized to a real recording.

V1 still uses `public/audio/narration.mp3`; V2 uses `public/audio/narration-v2.mp3`. Their original content remains available for comparison.

## Optional sound and safe areas

No sound assets are required or downloaded. Supply only your own or royalty-safe `question.wav`, `tick.wav`, `reveal.wav`, `exception.wav`, and `takeaway.wav` under `public/audio/sfx/` if wanted. Missing files are skipped. `audioV3` independently controls narration (1), SFX (0.12), and optional `audio/music-v3.wav` (0/muted). Effects have short fade envelopes. Keep music/SFX out of the processed narration and check actual loudness by ear. There is no automatic ducking or complex audio engine.

The watermark begins at x=78/y=150, above the unchanged teaching area. Teaching content uses x=78–900 and captions around y=1460–1600, leaving the far right and bottom clear. YouTube overlays vary; review the final upload on a phone. Branding provides provenance; it does not technically prevent copying or infringement.

## Files

- `src/ShortV2.tsx` — existing retention scenes with small content/timing/audio/branding props; V2 retains its defaults.
- `src/ShortV3.tsx` — V3 props for the same scenes; no duplicated scene implementation.
- `src/content/unchecked-exception-v3.ts` — English captions, editable timings, audio cues and internal provenance, never displayed.
- `src/BrandMark.tsx` — scalable vector NSL mark, watermark and closing signature; no image dependency.
- `src/components.tsx` — existing code panel, captions, colors and typography accents.
- `src/Short.tsx` and earlier content files — retained original versions.
- `src/Root.tsx`, `src/index.ts` — three registered compositions.
- `src/style.css` — bundled open-source Inter and JetBrains Mono fonts.
- `scripts/validate.ts` — content, scene/beat/caption/audio timing, output guard and actual browser registration checks.
- `scripts/fixtures/UncheckedExample.java` — runnable companion to the on-screen excerpt.

The Java example obtains an integer through `getValue()` at runtime. This run returns zero; integer division throws `ArithmeticException`. With a JDK, run `javac -d out/java scripts/fixtures/UncheckedExample.java` then `java -cp out/java UncheckedExample` to see the exception. `java -Ddivisor=2 -cp out/java UncheckedExample` prints `5`. A JDK is not required to render. The hierarchy focuses on RuntimeException; Error subclasses are also unchecked, as noted on screen.

Dependencies, output and local audio remain Git-ignored. Raw takes may temporarily live under `out/recordings/raw/`, with separate backups. V3 adds no dependencies or binary assets.

Intentionally pending: the owner's voice, enhancement/editing, final loudness and synchronization, listening checks with supplied SFX, and a separately named FINAL artifact. No uploading, analytics, backend, database, cloud, multilingual platform or generic workflow is implemented.

[Remotion license](https://www.remotion.dev/license) applies. Font licenses are included in the installed Fontsource packages. Technical references: [Java exception checking](https://docs.oracle.com/javase/specs/jls/se22/html/jls-11.html) and [ArithmeticException](https://docs.oracle.com/en/java/javase/26/docs/api/java.base/java/lang/ArithmeticException.html).
