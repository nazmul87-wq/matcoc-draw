# Issue 05: Clear canvas with undoable confirm

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Add the Clear button. On click, show a native `window.confirm()`. If confirmed, push a snapshot to `History` first, then clear the canvas. This makes a confirmed clear recoverable via Undo.

## Acceptance criteria

- [ ] Clear button in the toolbar
- [ ] Clicking Clear shows a native `window.confirm()` prompt
- [ ] On cancel, nothing happens
- [ ] On confirm, a snapshot of the pre-clear canvas is pushed to `History`, then the canvas is cleared
- [ ] After a confirmed clear, Undo restores the canvas to its pre-clear state

## Blocked by

- Issue 04 (history)
