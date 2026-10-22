# Working on Hollow House

Vanilla JS + Vite, no framework. Keep it that way unless the game outgrows it.

- Game data lives in `src/data.js`; mechanics in `src/main.js`; pure logic that can be tested lives in its own module under `src/` with a test in `test/`.
- Run `npm test` and `npm run lint` before committing. CI runs both; a red `main` blocks the Pages deploy.
- The page must work at phone width and on touch (thumbstick on the canvas, USE button). Keyboard is desktop only.
- Design notes and open decisions (difficulty levels, manual journal) are in `docs/design-notes.md`; update it when a decision is made.
- Commit messages: imperative, one line, body only when the why isn't obvious.
