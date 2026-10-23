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

## Pacing and creepiness (brainstorm, 2026-10-23)
Playtest verdict: the game is too fast to be scary. Nothing below is decided yet; it's a list to pick from over time. Many items are knobs that could also feed the difficulty levels below.

### Why it feels fast
- **Movement.** The player walks at 4.2 tiles/s (`movePlayer`), so crossing the 20×14 house takes about 5 s. Nothing is ever far away.
- **The EMF reader is a radar.** It gives five levels of straight-line distance through walls, all the time, so the ghost's room is found in seconds.
- **The thermometer is just as strong.** Every room reads 13.5 °C except the ghost's room, which reads about 4.5 °C (or below zero for cold ghosts) whether or not the ghost leaves cold evidence. Winning strategy: equip it on entry and walk room to room until the number drops. One pass through the house finds the room every time.
- **Evidence is quick.** The spirit box answers 65% of the time in the room, the camera shows orbs 75% of the time, and the book writes after 10 to 12 s. A competent night lasts about a minute.
- **Hunts are too frequent to dread.** After a hunt, patience resets to 50%, so the next one comes about 45 s later. Base patience falls 8 s a night to a 45 s floor.
- **The UI says exactly when you are safe.** The bar label steps through quiet / restless / about to hunt, and a hunt shows `HUNT · 12s`. That certainty removes the fear.
- **No sound.**

### Ideas
**Slower tempo, dread in the gaps**
- Walk at about 2.5 to 3 tiles/s. Maybe add a run that is noisy and costs patience.
- Make patience longer, but make the house escalate through the three phases instead of being silent until the hunt:
  - quiet: genuinely nothing happens;
  - restless: a door you left open is now shut, footsteps in the hall, an object has moved since you last looked;
  - about to hunt: lantern flickers, breathing on the readout, the doll is now facing you.
- False alarms: sometimes the lantern gutters and nothing comes. At present gutter always means hunt, so players learn it.
- Let the ghost occasionally wander out of its room when not hunting (heard, not seen).

**Less precise information**
- Remove the hunt countdown and blur or remove the patience bar. "Something is moving" and nothing more.
- EMF reacts to events (the ghost doing something near you) rather than distance. Mostly level 1 or 2 otherwise, so the player has to search.
- Thermometer stops being a room finder: rooms vary in temperature (a cold cellar, a warm kitchen) and drift, and only a cold ghost pushes its room clearly lower. A non-cold ghost's room should read like any other room. Possibly the reading needs time to settle, so the player has to stand still in a room rather than sweep through it.
- Room labels hidden until the player has entered the room.

**Visibility: lantern radius and window size**
Two separate knobs, both hard-coded at present:
- **Lantern radius** (`rad` in `draw`): 4.2 tiles while walking, about 2.6 (flickering) during a hunt, 1.6 while hidden. The darkness is drawn over everything, ghost included, and is near-black beyond the radius, so this is what the player really sees. At 4.2 tiles it shows most of a room at once; 3 or so would make rooms feel bigger and corners worth fearing. It could also shrink as patience falls, or gutter during the restless phase.
- **Window size** (the canvas, 384×288 in `index.html`, so 12×9 tiles at T=32). The canvas is scaled to fit the screen, so a smaller window means a closer zoom: bigger sprites on a phone and less of the house in frame. With the current lantern the window matters little: a 4.2-tile lantern already nearly fills the 9-tile height. The two need tuning together; a smaller lantern makes a large window mostly black, and a smaller window puts the edge of the frame inside the lantern.
- Things to try: lantern 3 tiles with a 10×7 window; or keep the window and only shrink the lantern. Check at phone width: the thumbstick is sized in canvas pixels (40 px radius), so a smaller window also makes it bigger on screen.
- Candidate difficulty knob (bigger lantern on Easy).

**Scarier hunts, not more of them**
- A pre-roll before the ghost moves: 3 to 4 s of lights dying and a noise from its room, so the player has to decide where to go.
- During a hunt the darkness already hides the ghost beyond the 2.6-tile lantern. Going further: make it blink in and out even inside the light, so the player can't track it steadily.
- While hidden in a closet, don't draw the ghost unless it is adjacent. Darker screen and a heartbeat instead.

**Make the ghost notes true**
- Banshee "keens before it hunts", Mare "hates the lantern" and Phantom "vanishes when photographed" are written in the notes but not implemented. Doing them gives each ghost a personality and gives careful players tells to read.

**Sound (Web Audio, synthesised, no assets)**
- A low drone that thickens as patience falls; footsteps panned towards the ghost during a hunt; a heartbeat when it's close; static on the spirit box.
- The "Enter the house" tap is the user gesture phones need to start audio.

**Slower evidence**
- Lower the spirit box and camera odds; the book takes 30 to 60 s. More time in the dark per clue.
- Pairs with the manual journal (below): noticing a reading yourself is slower and tenser than being told.

### Suggested order
1. Remove the countdown and add false alarms (small change, big gain in dread).
2. Slower walking, longer patience, restless-phase events. Also take the room-finding power away from the EMF and thermometer. Constants are in `startRound`, `movePlayer`, `endHunt` and the passive tool block in `update`.
3. Sound, as its own branch.

## Open decisions

### Auto-logging may make it too easy (deferred)
Suggested middle ground: keep the live readings on screen (EMF needle, temperature, spirit box text, photo result) but make the journal fully manual, so the player has to notice EMF hitting level 5 or the temperature going below zero and tick it themselves. The $20-per-evidence payout would then need a new trigger, probably paying at the end of the night for ticks that were actually correct (and possibly penalising wrong ticks).

### Difficulty levels (to review)
Review all of the above together as candidate knobs for difficulty levels, e.g.:
- Easy: auto-logging, long patience, slow hunts, closets always work.
- Normal: manual journal, current patience and hunt curve.
- Hard: manual journal, shorter patience, ghost can find a hidden player if it hunted in that room, Hollow lies more often, fewer free instruments.

### Later ideas
- Sound (needs a tap to start audio on phones). See Pacing and creepiness above.
- Minimap now that the camera no longer shows the whole house.
