# Issue 04: Undo / redo (History module + buttons + tests)

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Introduce the `History` module — a capped stack of `ImageData` snapshots with a separate redo stack. Capture a snapshot on `pointerdown` (before any pixels of the new stroke are drawn). Wire Undo and Redo toolbar buttons that apply the returned snapshot to the canvas. Pushing a new snapshot clears the redo stack. Ship full unit test coverage for the `History` module in the same slice.

## Acceptance criteria

- [ ] `History` module with `snapshot(ImageData)`, `undo() → ImageData | null`, `redo() → ImageData | null`, `clear()`
- [ ] Undo stack capped at 20 entries; oldest dropped when full
- [ ] Snapshot taken on `pointerdown`, before the new stroke modifies pixels
- [ ] Undo button restores the previous snapshot to the canvas
- [ ] Redo button re-applies the snapshot that was undone
- [ ] Drawing a new stroke after an undo clears the redo stack
- [ ] Undo with empty stack is a no-op (returns null, button does nothing)
- [ ] Redo with empty stack is a no-op
- [ ] `History` module has no DOM dependencies
- [ ] `History` test suite covers: snapshot/undo round-trip, snapshot/undo/redo round-trip, redo cleared on new snapshot after undo, cap enforcement (push 21 → oldest dropped), undo on empty returns null, redo on empty returns null, `clear()` empties both stacks
- [ ] All tests pass

## Blocked by

- Issue 02 (test harness lands here)
