# Issue 02: Toolbar shell + tool/color/size state (+ test harness)

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Add the top toolbar with Pen button, native color input, and native range slider (1–50). Introduce the `ToolState` module that holds current tool, color, and size, and notifies subscribers on change. Wire the pen stroke renderer to read live color and size from `ToolState`. The Eraser button is present but inert (wired in Issue 03).

This is also the project's first testable module, so this slice installs and configures Vitest and ships the `ToolState` test suite.

## Acceptance criteria

- [ ] Toolbar pinned to the top of the page, canvas centered below
- [ ] Toolbar layout matches PRD: `[Pen] [Eraser] | <color> <size> | (placeholders for undo/redo/clear/export)`
- [ ] `ToolState` module with `setTool`, `setColor`, `setSize`, `current()`, `subscribe(fn)`
- [ ] `setSize` clamps to the inclusive 1–50 range
- [ ] Pen strokes render with the color and size currently in `ToolState`
- [ ] Changing the color picker updates the next stroke's color without page reload
- [ ] Changing the size slider updates the next stroke's size without page reload
- [ ] Color and size inputs are native HTML elements (`<input type="color">`, `<input type="range">`)
- [ ] Vitest installed; `npm test` runs the suite
- [ ] `ToolState` tests cover: subscribers fire on change, `setSize(0)` clamps to 1, `setSize(51)` clamps to 50, `setSize(25)` stores 25, `current()` returns latest values
- [ ] All tests pass

## Blocked by

- Issue 01 (scaffold + pen)
