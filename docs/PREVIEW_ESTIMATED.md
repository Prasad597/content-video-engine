# Explicit estimated timing previews

Normal `align-short` still enforces the original word/timestamp, semantic coverage,
ambiguity and 0.6 confidence checks. No speech model or threshold changed.
Flags use the existing **key/value** CLI convention:

```powershell
npm.cmd run align-short -- --content short-012 --preview-estimated true
npm.cmd run render-short -- --content short-012 --preview-estimated true --music content/short-012/audio/music.wav
```

The first command attempts strict alignment using narration only. Its adapter
inputs/results are isolated in `generated/preview-work/`. It writes
`generated/beats.preview-estimated.json` only when all semantic/timestamp checks
pass except the unchanged 0.6 confidence threshold. Ambiguous matches, inadequate
coverage, malformed timestamps, model execution errors and stale input changes
remain hard failures. It never replaces canonical alignment, beats, or human
approval. If strict alignment passes, it asks you to run normal alignment instead;
it does not silently promote anything.

Estimates divide the measured narration duration in proportion to each semantic
section's normalized word count. They are deterministic **pacing placeholders**,
not speech measurements. Silences, speed changes and emphasis can make them wrong.
Both the envelope and nested timing carry `mode: "preview-estimated"` and
`publishable: false`. Exact script/audio hashes, marker order, positive contiguous
intervals and audio bounds are verified before preview.

Preview video is always written to
`.tmp/preview-estimated/<id>/<id>.preview-estimated.mp4` with a persistent burned-in
**ESTIMATED — NOT FOR PUBLICATION** banner. Open that file to review. There is no
production-output override. Existing semantic scenes and captions use the same
numeric resolver. Numeric starter content has no beat-to-scene mapping: it gets
explicitly labelled script-review cards instead, without editing content.ts.
Those cards are not a completed visual storyboard.

Existing configured music works unchanged. `--music <repository-relative-path>`
is an optional preview-only override when content does not yet configure its local
licensed track. It uses the existing staging, fades, crossfades and mix headroom;
music is never sent to Whisper. Preview styling and audio use the existing engine.

## Production boundary

- `produce-short` preflights the strict package loader. Normal render/publish also
  load through it. A pending preview cannot enable numeric starter production.
- A pending preview with no canonical beats is excluded, with a warning, from
  the normal Studio/validation composition catalog so completed Shorts still work.
  This is not a validation pass for the draft. Direct production remains blocked.
- Central production/publishing validation rejects preview/unknown provenance.
- Copying/renaming either the envelope or its nested timing to canonical beats
  fails. Stripping tags is not enough: automatic timing must exactly recompute
  from strictly validated alignment, or match an explicit human approval record.
- Legacy measured artifacts need no new mode field: strict recomputation is their
  existing provenance check. Manual approval retains reviewer/date and both hashes.
- A valid measured or human-approved artifact takes precedence over a separate
  leftover preview suggestion. Corrupt canonical artifacts fail; they are not skipped.

These are local workflow/integrity safeguards, not cryptographic authentication
against someone deliberately forging all approval files or altering engine code.
Never publish the burned-in preview, even after reviewing it; render a new final.

## Human review → existing approval

Listen and check/correct **every** estimated start/end in the preview artifact;
keep adjacent boundaries equal and the final end at measured audio duration.
Do not remove its preview provenance. After explicit human approval only:

```powershell
npm.cmd run approve-timing -- --content short-012 --proposal content/short-012/generated/beats.preview-estimated.json --approve true --reviewer "Your name"
```

The existing approval command validates preview provenance and fresh evidence,
then creates a manual proposal in memory. Only its explicit consent path writes
`manual-timing.json` plus canonical `beats.json`. No confidence is fabricated.
Any script/audio change invalidates approval. Existing manual-proposal JSON and
approval commands continue to work.

Finish authored semantic scenes/captions and publishing metadata in content.ts,
then run `npm.cmd run produce-short -- --content short-012`. Alternatively obtain
successful strict measured alignment using the normal command. No narration
regeneration is required or performed by preview mode.

Tests: `npm.cmd run test:preview-timing`, plus existing alignment/validation,
production, publishing, manual-timing and music suites. Routine fixtures need no
speech-model downloads. Short 012 provides a separate real local integration run.
