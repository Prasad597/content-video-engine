# Content Video Engine

This repository is now a reusable, audio-first short-form content engine rather than a Java-only experimental repo.

## Architecture

The engine is intentionally split into three concerns:

- Engine: layout, timing, rendering, captions, audio playback, composition registration
- Channel: identity, branding, theme, watermark, signature
- Content: short-specific text, scene order, code, narration path, captions

The generic scene system supports:

- hook
- explanation
- code
- diagram
- comparison
- rule
- outro

No new Short should require editing engine or scene code.

## Channel configuration

The first configured channel is NoSkipLearning:

- name: NoSkipLearning
- tagline: Understand it. Then move on.
- theme: accent, ink, muted, line, red

The engine receives branding through channel config instead of hard-coded values.

## Adding a new Short

1. Copy the template in `content/_template/content.ts`
2. Edit the Short ID, title, topic, narration path, scenes, and captions
3. Add the narration file at the referenced path
4. Render with:

```sh
npm run render-short -- --content short-003 --channel noskip-learning
```

## Rendering and validation

```sh
npm ci
npm run typecheck
npm run validate
npm run render
```

The default render targets the reusable Short #001 composition.

## Short definitions

Current content definitions:

- `content/short-001/content.ts`
- `content/short-002/content.ts`
- `content/_template/content.ts`

Short #002 intentionally uses a preview narration path that is not yet present so the engine produces a clear actionable message instead of pretending the narration exists.

## Production workflow

Creating a normal Short should be:

- content + narration
- render

Not engine edits, scene rewrites, or custom Java logic.

## Notes

- Narration is the master timeline.
- Scene timing is centralized in the content object.
- Missing narration is surfaced clearly with the exact file path expected.
- Historical experimental files are still present for reference but do not define the runtime path.
