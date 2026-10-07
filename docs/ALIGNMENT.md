# Local audio timing

Decision before model download: faster-whisper 1.2.1, English base.en, CPU INT8, four threads. The model is approximately 145 MB; dependency wheels approximately 85 MB. The reviewed dependency list has no PyTorch or NVIDIA packages. WhisperX adds a second alignment model and a larger stack; whisper.cpp is also CPU-capable but would add a native toolchain/binary installation here. Start with base.en and stop if semantic anchors are unreliable rather than silently scaling up.

References: [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [model files](https://huggingface.co/Systran/faster-whisper-base.en/tree/main).

Existing timing flow: content.ts numeric seconds → project loader / Root → validated ShortDefinition → ShortEngine Sequences and captions → rounded 30 FPS boundaries. Semantic timing is resolved on the Node side, before browser bundling. Rendering components remain numeric and unchanged.

This adapter uses recognized word timestamps and matches the known script; it is not a phoneme forced aligner. Word probabilities are preserved, not presented as calibrated boundary accuracy. Ambiguous or insufficient script matches fail preparation.

## Isolated setup (once)

```powershell
python -m venv tools/alignment/.venv
tools/alignment/.venv/Scripts/python.exe -m pip install --only-binary=:all: -r tools/alignment/requirements.txt
```

Only the virtual environment is modified, even if the base interpreter is supplied by Anaconda. The first explicit alignment downloads the model into ignored tools/alignment/models/. Subsequent use runs locally. Rendering never invokes Python, installs dependencies or downloads speech models.

PyAV is pinned to 16.1.0: version 19 removed an API used by faster-whisper 1.2.1. requirements-lock.txt records the tested Windows/Python 3.13 dependency versions (use it instead of requirements.txt for this exact environment). No Node dependencies were added. Model/network setup is only for downloading software/weights, not a cloud speech API. No subscription, credentials, synthesis or CUDA is needed.

## Owner workflow

1. Edit `content/<short>/script.txt`. Use `[UPPERCASE_BEAT_IDS]` before semantic phrases. Lowercase `[curious]`, `[slowly]`, etc. are unspoken delivery directions. Markers must be unique, and each section needs at least three spoken words.
2. Generate/record narration externally at `content/<short>/audio/narration.mp3` (or the package's configured path).
3. Run `npm.cmd run align-short -- --content <short>`.
4. Author the existing visuals in content.ts using `AuthoredShortDefinition` and semantic timing:

```ts
timing: { from: "EXAMPLE", until: "RULE" }
// Final scene, ending at this beat's end (audio duration for the final beat):
timing: { from: "RULE" }
// Caption: same timing object, existing text/emphasis unchanged.
```

5. Run `npm.cmd run render-short -- --content <short>`; result is `content/<short>/output/<short>.mp4`.

Existing `ShortDefinition` start/end and caption startMs/endMs remain supported. The Node content loader and a small webpack pre-loader resolve data for normal rendering and Studio; Root, ShortEngine, scenes and branding remain unchanged. Restart Studio after changing narration, as before. No provider code enters the browser.

## Timing and validity

The normalized version-1 alignment contract contains package-relative audio path, SHA-256 audio hash, normalized marked-script hash, duration, language and word text/start/end/optional confidence. Provider-specific benchmark data is separate. Symbol/punctuation tokens are not timing anchors. The generic tokenizer retains letters/numbers, removes punctuation, and ignores delivery directions. Semantic IDs participate in the script hash, so marker moves invalidate timing too.

The resolver monotonically matches script words to recognized words. A section requires its first token, at least 70% word coverage, at least three of its first five tokens, a first-phrase span no longer than five seconds, and mean anchor probability >=0.6 when supplied. Confidence is the arithmetic mean of supplied probabilities for those matched opening tokens; coverage is a separate gate, not a substitute confidence score. Equally optimal global text matches with different opening-word locations fail explicitly as ambiguous; traversal order is not boundary evidence. Failure identifies the beat and never substitutes guessed seconds. These checks establish a useful anchor, not sample-perfect phoneme alignment; inspect the word timestamps and listen before publication. Unknown probabilities remain absent.

Production model policy remains **base.en / CPU INT8 / four threads**, with no automatic fallback. A controlled small.en comparison on Shorts 003, 006, 007, 008 and 009 did not improve acceptance: base passed the four historical Shorts; small passed only 003 and 007, lost opening-word evidence on 006/008, and still gave 009's HOOK confidence 0.467980 (<0.6), plus an unbounded point observation. Small used about 706 MiB versus base's 329 MiB and took 4.5–9.3s versus 2.3–4.5s. Model weights were 486 MB versus 148 MB. Its accepted historical boundary shifts were up to 0.24s (003) and 0.16s (007); no historical artifacts were replaced. Larger weights or automatic escalation are therefore not justified by this sample. Keep the existing local model and fail when the evidence is insufficient; do not change narration or thresholds merely to make ASR pass. No new model-selection setting or dependency is required.

Each beat begins at its first matched spoken word and ends at the next marker; the last ends at measured audio duration. Visual lead defaults to 200 ms, configurable as `visualLeadMs`. Per-scene `leadMs`/`tailMs` allow finite adjustments within +/-500 ms. A shared scene cut uses the incoming scene's lead plus outgoing scene's tail; both scenes use the same boundary. Adjacent semantic references must meet. The first visual starts at zero to cover opening silence. The final scene cannot extend beyond the audio duration. Frame rounding can change the encoded end by half a frame.

Captions use spoken boundaries with zero default lead. Explicit lead/tail offsets are available; overlap, invalid order, missing beats, negative/out-of-range times and invalid scene content fail the existing validator. Two extra Short 002 markers (HOOK_FALSE and SAME_OBJECT) preserve its existing caption chunks without guessed times.

`generated/alignment.json`, `alignment-input.json` and `benchmark.json` are ignored reproducible intermediates. Small `generated/beats.json` is tracked. Rendering verifies current audio/script hashes, normalized alignment validity and exact recomputation of beats; a missing, stale or edited file instructs the owner to rerun align-short. Rendering does not realign automatically. Keep the authoritative audio backed up.

## Short 002 benchmark, 2026-10-05

On this Windows CPU-only machine: base.en INT8/four threads, 54.595875-second narration, 129 timestamped recognized words, 13 beats (11 story beats plus 2 caption boundaries). Measured warm alignment including model load: 3.040 seconds; cached model lookup: 0.706 seconds; peak process working set: 348,041,216 bytes (~332 MiB). Installed virtual environment: 296,109,074 bytes (~282 MiB); model files: 147,769,510 bytes (~141 MiB). Dependency installation took 60.23 seconds after wheel inspection/cache download, plus the PyAV compatibility correction.

The initial cold model transfer was approximately 37 seconds based on file creation/completion times; a full cold-start stopwatch result was not captured because the initial run failed at the PyAV compatibility issue. Do not treat this estimate as a precise setup benchmark. These measurements support practical CPU use for this recording only.

An additional offline-cache run took 3.759 seconds including model load, plus 0.180 seconds cache lookup, with 342,994,944 bytes (~327 MiB) peak working set. Cached model discovery now uses local_files_only and makes no network lookup. All 129 recognized words have timestamps; script matching tolerates spoken operators omitted by punctuation normalization. The opening word probability is low (0.15) while its five-word phrase mean is 0.817; probabilities remain available for editorial review rather than being hidden.

## Acceptance result

Short 002: H.264 1080×1920, 30 FPS, 1,638 frames, 54.600-second video, AAC audio, 54.613-second mux duration (encoder padding). Authoritative narration SHA-256 remains `2ddb5a86604b69bd2a47b6270d9b61a57f12d8ee60bc1c40e5f35c40ec583067`. Short 001 numeric regression: 42.005-second mux, H.264/AAC, 1080×1920, 30 FPS. Its content, source narration, and all renderer/scene/channel files are unchanged; only the shared types file gained authored timing types.

| Beat | Spoken start → end (seconds) |
|---|---|
| HOOK | 0.000 → 2.740 |
| HOOK_FALSE | 2.740 → 7.760 |
| REFERENCE_IDENTITY | 7.760 → 11.500 |
| SAME_OBJECT | 11.500 → 16.260 |
| LITERAL_EXAMPLE | 16.260 → 22.260 |
| STRING_POOL | 22.260 → 27.160 |
| LITERAL_TRUE | 27.160 → 30.080 |
| NEW_STRING | 30.080 → 33.480 |
| DIFFERENT_OBJECT | 33.480 → 35.900 |
| IDENTITY_FALSE | 35.900 → 38.020 |
| EQUALS_TRUE | 38.020 → 41.120 |
| WHY_EQUALS | 41.120 → 45.480 |
| FINAL_RULE | 45.480 → 54.595875 |

Rendered frames inspected at each of the nine teaching beats +350 ms show the expected literal code, pool, TRUE comparison, new String code, different-object diagram, FALSE caption, equals TRUE caption, WHY explanation and final rule. The existing comparison intentionally still displays FALSE and equals TRUE together; only its two captions switch separately. No new visual reveal was added. Final-rule visual time is approximately 9.316 seconds with the default lead. This is a frame/timestamp review, not a claimed human listening assessment of phoneme-perfect boundaries.

Typecheck and the full existing validation passed, including numeric/missing-audio template coverage and focused semantic tests: missing/invalid/reversed beats, captions, offsets, bounds, low-confidence rejection, absent confidence, missing alignment, altered beats, and both audio/script hash changes using disposable files. No production audio was modified for stale tests. Source comparison excluding timing fields confirmed identical Short 002 visual data. Script comparison excluding semantic markers/whitespace confirmed identical spoken words and delivery directions.

## Bounded word timestamp recovery

At the adapter boundary, missing/non-finite timestamps are represented as JSON null. TypeScript can recover at most three malformed words per narration, only between unchanged positive-duration neighboring words with a strictly positive gap no larger than one second. Consecutive invalid words divide that gap equally; text and confidence are preserved. Each repaired word logs its index and bounds. First/last malformed words, zero-width recovery gaps, reversed/overlapping valid neighbors, invalid confidence, excessive damage and larger unexplained gaps fail explicitly. Finite valid intervals are never shifted. Repaired output is persisted only after strict semantic matching succeeds; all existing confidence, hashes, bounds and beat checks remain mandatory. Rendering does not repair stored alignments.

Zero-duration observations are a separate case: faster-whisper 1.2.1's `add_word_timestamps` explicitly excludes zero durations from its median and emits rounded word boundaries without enforcing positive duration. Monotonic, finite point records bounded by positive-duration neighbors within one second are retained unchanged, not interpolated or counted against the malformed-word repair budget. Their text/probability stays in diagnostics, but they contribute **no semantic matching, coverage, confidence or anchor evidence**. This prevents a point-only repetition from displacing a later measured phrase. No count limit is needed for such excluded evidence: each beat must still meet the unchanged measured-text coverage, opening-word, anchor-count, confidence, span and ordering requirements. Unbounded point regions and missing semantic openings still fail. One diagnostic is emitted per point run during preparation, not during normal rendering.

In Short 009 Generation 2, indices 62–66 (`a snapshot of the array`) all have start=end=29.98; indices 67–71 repeat that phrase with positive durations from 29.98 to 31.18. This is not serialization damage. Generation 1 had a single point-only `iterator` at 30.24. These observations need not invalidate the entire transcript. However Generation 2's HOOK anchor confidence is 0.428960, below the unchanged 0.6 threshold, so preparation still correctly refuses to write beats. Segment fallback would not resolve that independent confidence failure and was not added. No narration regeneration or model/configuration changes are part of this correction.

## Files in this change

Generic infrastructure: scripts/align-short.ts, alignment.ts, timing.ts, timing-loader.cjs, timing-webpack.ts, validate-alignment.ts; tools/alignment/align.py, requirements.txt, requirements-lock.txt; remotion.config.ts. Modified scripts/project.ts, scripts/validate.ts, src/engine/types.ts, package.json, tsconfig.json and .gitignore. Documentation: this file, README.md, VOICE_WORKFLOW.md.

Short 002 only: content.ts timing representation, script.txt semantic markers, generated/beats.json; ignored alignment/input/benchmark JSON and rendered MP4. No visual content changed. No Short 003, commit or push. The pre-existing untracked owner MP3 in the repository root is untouched.
