# Hollow House

A browser game of ghost deduction. Buy instruments, search a haunted house for evidence, and name the spirit before its patience runs out and it hunts you through the rooms.

## Develop
```
npm install
npm run dev      # local server with hot reload
npm test         # unit tests (vitest)
npm run lint
npm run build    # static site in dist/
```

## Layout
- `src/data.js` — evidence, ghosts, instruments, the Marrow Lane plan, and `GEN`, the knobs for generated houses. Edit here to add a ghost or a tool.
- `src/house.js` — walls, doors, closets, rooms, pathfinding, for whichever house is current.
- `src/procgen.js` — procedural house plans: hall skeleton, rooms by binary space partition, doors, closets, names, validation.
- `src/gallery.js` — open the game with `?gallery` for a sheet of generated plans with the knobs editable; click one to play it.
- `scripts/print-houses.js` — `node scripts/print-houses.js 6 1` prints six plans as ASCII, starting at seed 1.
- `src/deduction.js` — the journal's filtering logic.
- `src/main.js` — game loop, shop, journal, rendering, input.
- `test/` — tests for the pure modules.

## Deploy
Every push to `main` runs lint, tests and build, then publishes `dist/` to GitHub Pages (`.github/workflows/deploy.yml`). Pull requests run the same checks without deploying. One-time setup: repo Settings → Pages → Source: **GitHub Actions**.

## Play
- Move: WASD / arrows, or drag on the house on a touch screen
- Use the equipped tool, or hide in a closet: `E` / USE
- Journal: `J` · Select tools: `1`–`8`

Eight ghosts, six kinds of evidence; each ghost leaves exactly three. What a ghost does not leave is evidence too.

Two modes from the welcome screen: Marrow Lane, the same house every night, or a new generated house each night. `?seed=N` replays a generated house (night two is seed N+1, and so on).
