# Issue 06: Export PNG (+ CanvasSurface tests)

**Labels:** needs-triage
**Type:** AFK

## Parent

PRD.md

## What to build

Add the Export button. On click, generate a PNG via `canvas.toDataURL('image/png')` and trigger a download via a hidden anchor. Filename is `matcoc-draw-<ISO timestamp>.png`. Erased regions are transparent in the exported PNG.

This slice also lands the `CanvasSurface` test suite. Export is the last `CanvasSurface` capability to be added, so this is the natural point to install `vitest-canvas-mock` and cover the wiring logic for the whole module — pointer event dispatch, composite-op switching for the eraser, snapshot get/apply, clear, and export-trigger.

## Acceptance criteria

- [ ] Export button in the toolbar
- [ ] Clicking Export downloads a PNG file
- [ ] Filename matches the pattern `matcoc-draw-<ISO timestamp>.png`
- [ ] Pixels erased via the eraser tool are transparent in the exported PNG (verifiable by opening the file in any tool that respects PNG alpha)
- [ ] Exported PNG dimensions equal the DPR-scaled backing-store dimensions
- [ ] `vitest-canvas-mock` installed and registered in the Vitest setup
- [ ] `CanvasSurface` tests cover: pointerdown fires `onStrokeStart`, pointerup fires `onStrokeEnd`, eraser tool switches `globalCompositeOperation` to `'destination-out'`, op restored to `'source-over'` after eraser stroke ends, `getSnapshot()` returns object with DPR-scaled dimensions, `applySnapshot` calls `putImageData`, `clear()` calls `clearRect` over full canvas, `exportPNG()` triggers a download with the expected filename pattern
- [ ] All tests pass

## Blocked by

- Issue 03 (eraser — transparency verification depends on it)
