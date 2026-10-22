# Hollow House — design notes

Last updated: 2026-10-23

## Current state
- Eight ghosts, six evidence types, each ghost leaves exactly three.
- Instruments: EMF reader + thermometer are free agency issue; spirit box, UV torch, camera, writing book are purchased; salt line and hearth charm are consumables.
- Evidence is **auto-logged** in the journal when an instrument observes it. Every logged piece pays $20 regardless of outcome; a correct name pays $100 plus an early-leave bonus.
- Journal supports marking evidence as ruled out, which filters the ghost list.
- Patience bar under the house; hunts get longer and faster each night. Closets hide the player if the ghost didn't see them enter. Every room has three throwable objects; the Poltergeist throws constantly, others rarely.
- Camera follows the player (12×9 tile window). Touch: thumbstick on the canvas plus a USE button.

## Procedural houses (branch `procgen-houses`, 2026-10-23)
- Second mode on the welcome screen: a generated house each night, seed shown in the shop, `?seed=N` to replay. Marrow Lane stays as the fixed mode.
- Generator (`src/procgen.js`) is structured rather than free-form so plans read as houses: a hall skeleton first (front-door spine, usually a cross corridor: T, L, + or a straight hall), then the leftover rectangles are split into rooms with one-tile walls, then doors, closets and names. Splits prefer to keep every room on the hall; a room reached only through its neighbour is allowed with `innerRoomChance`.
- Every knob is in `GEN` in `src/data.js`; `?gallery` shows a sheet of plans with the knobs editable. Defaults chosen so 1000 seeds give 6 to 8 rooms (mean about 6.5), no failures, mostly 4 to 5 wide rooms.
- Not yet done, candidates for later tuning: non-rectangular footprints (a notch out of a corner), halls one tile wide (allowed by the knob, but a hunting ghost fills it), archways without doors like the Marrow Lane lounge, more than one closet in big rooms, room size influencing the ghost's choice of room.

## Open decisions

### Auto-logging may make it too easy (deferred)
Suggested middle ground: keep the live readings on screen (EMF needle, temperature, spirit box text, photo result) but make the journal fully manual, so the player has to notice EMF hitting level 5 or the temperature going below zero and tick it themselves. The $20-per-evidence payout would then need a new trigger, probably paying at the end of the night for ticks that were actually correct (and possibly penalising wrong ticks).

### Difficulty levels (to review)
Review all of the above together as candidate knobs for difficulty levels, e.g.:
- Easy: auto-logging, long patience, slow hunts, closets always work.
- Normal: manual journal, current patience and hunt curve.
- Hard: manual journal, shorter patience, ghost can find a hidden player if it hunted in that room, Hollow lies more often, fewer free instruments.

### Later ideas
- Sound (needs a tap to start audio on phones).
- Minimap now that the camera no longer shows the whole house.
