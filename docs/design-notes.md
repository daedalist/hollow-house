# Hollow House — design notes

Last updated: 2026-10-22

## Current state
- Eight ghosts, six evidence types, each ghost leaves exactly three.
- Instruments: EMF reader + thermometer are free agency issue; spirit box, UV torch, camera, writing book are purchased; salt line and hearth charm are consumables.
- Evidence is **auto-logged** in the journal when an instrument observes it. Every logged piece pays $20 regardless of outcome; a correct name pays $100 plus an early-leave bonus.
- Journal supports marking evidence as ruled out, which filters the ghost list.
- Patience bar under the house; hunts get longer and faster each night. Closets hide the player if the ghost didn't see them enter. Every room has three throwable objects; the Poltergeist throws constantly, others rarely.
- Camera follows the player (12×9 tile window). Touch: thumbstick on the canvas plus a USE button.

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
