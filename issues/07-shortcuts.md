# Issue 07: Keyboard shortcuts (+ tests)

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Introduce the `Shortcuts` module — a global `keydown` handler that maps key combinations to commands. Bind the spec's full set: undo, redo, pen, eraser, brush size up/down. Suppress all shortcuts when the active element is an `<input>` or `<textarea>`. Accept Ctrl and Cmd interchangeably. Ship the test suite in the same slice using Vitest + jsdom.

## Acceptance criteria

- [ ] `Shortcuts` module exposes `bind({ undo, redo, pen, eraser, sizeUp, sizeDown })`
- [ ] `Ctrl+Z` and `Cmd+Z` both trigger undo
- [ ] `Ctrl+Shift+Z` and `Cmd+Shift+Z` both trigger redo (and do NOT trigger undo)
- [ ] `B` switches to pen
- [ ] `E` switches to eraser
- [ ] `[` decreases brush size by 1 (clamped at 1)
- [ ] `]` increases brush size by 1 (clamped at 50)
- [ ] No shortcut fires when the active element is an `<input>` or `<textarea>` — typing in the color picker hex field does not switch tools
- [ ] `Ctrl+Z` calls `preventDefault()` so the browser does not perform its own undo
- [ ] jsdom configured as the Vitest environment for this suite
- [ ] `Shortcuts` tests cover: each shortcut fires its bound command, `Ctrl+Z` and `Cmd+Z` both route to undo, `Ctrl+Shift+Z` routes to redo not undo, shortcuts suppressed when focus is in `<input>` or `<textarea>`
- [ ] All tests pass

## Blocked by

- Issue 04 (history — needed for undo/redo commands; History tests confirm the harness is healthy)
