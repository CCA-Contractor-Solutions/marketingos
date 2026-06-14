---
name: Welcome Center walkthrough audio/scene sync
description: The in-app animated walkthrough video couples a pre-rendered composite mp3 to hardcoded scene boundaries — change both together
---

The web Welcome Center (`artifacts/web/src/pages/Welcome.tsx`) embeds an in-browser
"video": `WelcomeWalkthrough.tsx` plays a single composite mp3 and switches framer-motion
scenes by watching `audio.currentTime` against hardcoded scene start offsets.

**Rule:** The composite audio
(`artifacts/web/public/audio/welcome_walkthrough.mp3`) is built offline with ffmpeg by
delaying each VO segment (`adelay`) over a ducked, looped music bed. The per-scene VO start
offsets in the ffmpeg `adelay` chain MUST stay in lockstep with the `SCENES` start times and
`TOTAL` constant in `WelcomeWalkthrough.tsx`.

**Why:** Scene transitions are driven purely by audio time, not by any metadata embedded in
the file. If you regenerate or re-time the VO/music without updating the component's
`SCENES`/`TOTAL` (or vice versa), narration and on-screen scenes drift out of sync silently —
nothing errors.

**How to apply:** When regenerating narration or music, recompute each segment's start offset
(lead-in + cumulative prior durations + gaps), rebuild the composite, then update both the
ffmpeg offsets and the `SCENES`/`TOTAL` values in one change. Audio is referenced as
`${import.meta.env.BASE_URL}audio/welcome_walkthrough.mp3` and playback is user-gesture gated
(play overlay) to satisfy browser autoplay policy.
