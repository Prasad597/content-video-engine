# Recording and timing

Each Short owns its narration text in `content/<id>/script.txt`, semantic timestamps and audio path in its content folder. Record clean mono PCM WAV (48 kHz, 16/24-bit), preserve the original, then apply chosen cleanup, pacing edits and loudness normalization externally. Do not bake music/SFX into narration. No enhancement provider is hard-coded.

Use `content/<id>/audio/narration.mp3` by default, or change the definition to a WAV filename. Audio and raw recordings under each content folder are Git-ignored. Keep backups. Short 001's existing English master is copied to `content/short-001/audio/narration.wav`; source recordings remain preserved.

Scene start/end and captions follow the approved real recording. For semantic timing, annotate script sections with uppercase beat markers and run `npm.cmd run align-short -- --content <id>`; see [local alignment](ALIGNMENT.md). This reads the existing audio without modifying it. Use measured beat references in scenes/captions; rerun preparation after narration or semantic script changes. Legacy numeric timing remains supported for Short 001. Scene-local reveals/countdown/steps/node/row times remain content data. The engine centrally converts resolved seconds to frames.

The render and Studio commands stage only referenced local files with exact paths. Restart Studio after adding/changing an audio file. Numeric packages can preview silently when audio is missing. Semantic packages fail preparation/rendering when their authoritative narration or current alignment is missing; they never use guessed timing. A path typo must be fixed, not substituted with another Short's same-named file.

Independent narration, music and effect gains are optional content settings. The canonical MP4 is `content/<id>/output/<id>.mp4`. Listen to the complete output on a phone, checking caption timing, safe areas and voice dominance before publishing.
