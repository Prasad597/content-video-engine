# Optional local background music

Use an instrumental track whose license permits both YouTube and Instagram
publication. No music is selected or downloaded by the engine. Keep the license
and attribution requirements with your production records. Do not commit audio
unless redistribution is permitted: `content/*/audio/` and `public/audio/*` are
already ignored.

Once Short 012 exists, place the licensed file at
`content/short-012/audio/music.wav` (MP3, M4A and OGG also work), then add to its
existing content definition:

```ts
audio: {
  narrationVolume: 1,
  music: {
    file: "content/short-012/audio/music.wav",
    // volume omitted: narration gain * 10 ** (-22 / 20), about 0.0794.
    fadeInSeconds: 0.5,
    fadeOutSeconds: 0.8,
    crossfadeSeconds: 0.25,
    // Optional: use an EXISTING scene id, not a new timing definition.
    // changes: [{ sceneId: "reveal", volume: 0.04, transitionSeconds: 0.5 }],
  },
},
```

`volume` and change volumes are linear source gains in 0..1; 0 mutes music.
The -22 dB default describes a gain ratio, not measured perceptual loudness.
Listen and adjust for the supplied track's mastering. Voice always takes priority.
Changes smoothly ramp at resolved scene starts, including scenes backed by
verified semantic beats; existing visual lead still applies. No beat files,
alignment rules, approvals, captions, or narration timing are changed.

Use the same commands:

```powershell
npm.cmd run dev
npm.cmd run produce-short -- --content short-012
```

Restart Studio after changing music configuration, scene timing or audio files.
Both paths prepare the same full-length, faded WAV bed in disposable asset
staging. Short tracks overlap with complementary crossfades; long tracks trim to
the composition length. Source music should not contain unwanted silence—loop
crossfades do not remove silence already embedded within a recording. Default
crossfade is 0.25s, reduced for very short tracks; an explicit crossfade must fit
within half the track. Pick musically suitable loop points/material and listen
through joins: this is a smooth overlap, not tempo/beat detection.

The staged music envelope is sample-based. Existing Remotion audio components
still mix narration, effects and music. A shared static attenuation uses measured
narration/effect true peaks plus the prepared music peak, conservatively reserving
1 dB for encoding. It never boosts or rewrites original narration and avoids
pumping. Existing clipped source audio cannot be repaired by this gain control;
inspect/listen to the final encoded output before publication. Music preparation
adds a local decoding/peak-analysis step; no Python or new package is needed.

No music configuration means the old audio path and gains are unchanged. A missing
optional music file prints a warning and renders narration normally; an existing
but unreadable/corrupt track fails clearly. Fades must be positive and within the
video; transitions must be >=0.1s, ordered, nonoverlapping, and within its bounds.
No licensed asset or Short 012 package is included in this implementation.

Tests: `npm.cmd run test:music` uses temporary generated tones, checks envelopes,
crossfades, validation and source integrity, then renders a four-second 1080x1920
30 FPS fixture and measures its encoded peak. No external media is fetched.
