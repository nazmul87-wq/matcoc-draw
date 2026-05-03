# Issue 01: Scaffold + draggable line on canvas

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Stand up the Vite + TypeScript project and get a black 4px pen drawing on a fixed 1024×768 canvas via Pointer Events. No toolbar, no tools, no state — just the minimum that proves the input → render pipeline works end-to-end on mouse, stylus, and touch, with crisp output on HiDPI displays.

## Acceptance criteria

- [ ] `npm create vite` (vanilla-ts) project committed at the repo root, runs via `npm run dev`
- [ ] `index.html` shows a centered 1024×768 canvas on a neutral page background
- [ ] Canvas backing store is scaled by `devicePixelRatio`; strokes look crisp on HiDPI
- [ ] Drawing uses `pointerdown`/`pointermove`/`pointerup`/`pointercancel` with `setPointerCapture`
- [ ] A stroke that begins on the canvas continues correctly when the pointer briefly leaves the canvas before release
- [ ] Pen color is hardcoded black, size hardcoded 4px (will become dynamic in Issue 02)
- [ ] Works with mouse, stylus, and finger touch through the same code path

## Blocked by

None — can start immediately.
