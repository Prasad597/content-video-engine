# Recording and timing

Each Short owns its narration text in `content/<id>/script.txt`, semantic timestamps and audio path in its content folder. Record clean mono PCM WAV (48 kHz, 16/24-bit), preserve the original, then apply chosen cleanup, pacing edits and loudness normalization externally. Do not bake music/SFX into narration. No enhancement provider is hard-coded.

Use `content/<id>/audio/narration.mp3` by default, or change the definition to a WAV filename. Audio and raw recordings under each content folder are Git-ignored. Keep backups. Short 001's existing English master is copied to `content/short-001/audio/narration.wav`; source recordings remain preserved.

Scene start/end and captions follow the approved real recording. Scene-local reveals/countdown/steps/node/row times are also content data. The engine centrally converts seconds to frames. There is no speech recognition or automatic alignment. Check that the last scene covers the full narration: audio beyond the composition end is truncated.

The render and Studio commands stage only referenced local files with exact paths. Restart Studio after adding/changing an audio file. Missing audio renders silently; the render command reports it in the terminal, never in the video. A path typo must be fixed, not substituted with another Short's same-named file.

Independent narration, music and effect gains are optional content settings. The canonical MP4 is `content/<id>/output/<id>.mp4`. Listen to the complete output on a phone, checking caption timing, safe areas and voice dominance before publishing.
