# Issue 03: Eraser tool

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Wire the Eraser button to `ToolState`. When the eraser is the active tool, the canvas applies `globalCompositeOperation = 'destination-out'` for the duration of the stroke, then restores `'source-over'`. Erased pixels become transparent — the canvas itself is never painted with a background color.

## Acceptance criteria

- [ ] Clicking Eraser sets the active tool to eraser; clicking Pen sets it back
- [ ] The active tool button is visually distinguishable from the inactive one
- [ ] Eraser strokes use `destination-out` and clear pixels to transparent
- [ ] Eraser stroke size honors the `ToolState` size value
- [ ] After an eraser stroke, drawing a pen stroke afterward still works correctly (composite op restored)
- [ ] Visual sanity: erasing over a colored stroke reveals the page background through the canvas, not white

## Blocked by

- Issue 02 (toolbar + ToolState)
