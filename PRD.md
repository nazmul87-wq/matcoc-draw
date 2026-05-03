# PRD: matcoc-draw (v1)

**Status:** needs-triage
**Owner:** nazmul87@gmail.com
**Date:** 2026-05-03

## Problem Statement

I want a small, local, no-friction drawing surface I can open in a browser to sketch an idea, mark up a thought, or doodle — without signing in, without uploading anything, and without the heavyweight feel of a full image editor. Existing options either require accounts, push my work to a cloud I didn't ask for, or load a feature-heavy UI that gets in the way of the five things I actually do (pen, erase, undo, clear, save).

## Solution

A single-page web app, built with Vite + TypeScript, that runs entirely in the browser with no backend and no persistence. The user lands on a centered 1024×768 canvas with a top toolbar, draws with mouse/pen/touch, can switch to an eraser, can undo/redo, can clear the canvas, and can export the result as a PNG. Reload returns a blank canvas — explicit export is the save story.

## User Stories

1. As a user, I want to open the app and start drawing immediately, so that I don't lose momentum on the idea I came to capture.
2. As a user, I want a freehand pen that follows my pointer smoothly, so that the strokes feel natural.
3. As a user, I want to pick a stroke color from a color picker, so that I can use color meaningfully.
4. As a user, I want to adjust stroke size on a slider from 1 to 50 pixels, so that I can draw fine lines and broad fills.
5. As a user, I want an eraser tool that removes pixels rather than painting them white, so that the exported PNG keeps a transparent background where I erased.
6. As a user, I want to switch between pen and eraser via toolbar buttons, so that the active tool is always one click away.
7. As a user, I want to switch tools with keyboard shortcuts (`B` for pen, `E` for eraser), so that I don't break flow.
8. As a user, I want to adjust brush size with `[` and `]`, so that I can resize without leaving the canvas.
9. As a user, I want to undo my last stroke with `Ctrl/Cmd+Z`, so that mistakes are cheap.
10. As a user, I want to redo with `Ctrl/Cmd+Shift+Z`, so that I can recover from over-eager undos.
11. As a user, I want undo/redo buttons in the toolbar as well, so that the feature is discoverable without keyboard knowledge.
12. As a user, I want my undo history capped (around 20 steps), so that the app stays fast and bounded in memory.
13. As a user, I want to clear the canvas with a confirmation prompt, so that I don't wipe my work with a stray click.
14. As a user, I want a "clear" to itself be undoable, so that even an accidental confirm is recoverable.
15. As a user, I want to export the canvas as a PNG with a single click, so that I can save or share the drawing.
16. As a user, I want the exported PNG to preserve transparency where I erased, so that I can layer it on other images.
17. As a user, I want strokes to look crisp on a HiDPI display, so that the result doesn't look blurry on a modern laptop.
18. As a user, I want pointer capture during a stroke, so that a stroke doesn't end weirdly when my pointer briefly leaves the canvas.
19. As a user, I want one input path that handles mouse, stylus, and touch, so that the app works on whatever device I'm on.
20. As a user, I want keyboard shortcuts to be ignored when I'm focused in an input element, so that typing in the color picker doesn't switch tools.
21. As a user, I want reload to give me a fresh blank canvas, so that the app's state model is predictable and I never have to wonder where my drawing went.
22. As a user, I want the canvas centered on a neutral page background with the toolbar pinned to the top, so that the layout matches conventions from other drawing tools.
23. As a user, I want the toolbar to use native HTML inputs for color and size, so that the controls behave the way the rest of my OS does.

## Implementation Decisions

- **Stack:** Vite + TypeScript, no UI framework, no extra runtime dependencies. Default Vite config — no custom `vite.config.ts` unless a need emerges.
- **State model:** pixel-based. The `<canvas>` is the source of truth. No stroke list, no scene graph.
- **Canvas dimensions:** fixed 1024×768 logical CSS pixels. Backing store is `1024 * devicePixelRatio × 768 * devicePixelRatio`. The 2D context is scaled by DPR once at setup.
- **Background:** the canvas itself is transparent. A neutral page background shows through. No checkerboard.
- **Input:** Pointer Events (`pointerdown`/`pointermove`/`pointerup`/`pointercancel`) with `setPointerCapture` on the canvas element. Single code path for mouse, pen, and touch.
- **Eraser:** implemented via `globalCompositeOperation = 'destination-out'` for the duration of the eraser stroke, then restored to `'source-over'`.
- **History:** stack of `ImageData` snapshots. A snapshot is captured on `pointerdown` (before the new stroke modifies pixels) and before a confirmed clear. Stack capped at 20 entries; oldest entry is dropped when full. The redo stack is cleared whenever a new snapshot is pushed.
- **Clear:** uses native `window.confirm()`. On confirm, snapshot first, then clear.
- **Export:** `canvas.toDataURL('image/png')` triggered via a hidden anchor download. Filename: `matcoc-draw-<ISO timestamp>.png`.
- **Persistence:** none. No localStorage, no IndexedDB. Reload = blank canvas.

### Modules

- **`History`** *(deep)* — pure logic. Interface: `snapshot(ImageData)`, `undo() → ImageData | null`, `redo() → ImageData | null`, `clear()`. Hides: cap enforcement, redo-stack invalidation on new snapshot, allocation policy. No DOM dependencies.
- **`ToolState`** *(deep-ish)* — observable holder for current tool, color, and size. Interface: `setTool`, `setColor`, `setSize`, `current()`, `subscribe(fn)`. Validates size to the 1–50 range. No DOM dependencies.
- **`CanvasSurface`** *(shallow but unavoidable)* — owns the `<canvas>`, DPR scaling, pointer wiring, stroke rendering, composite-op switching, snapshot get/apply, PNG export, full clear. Interface: `onStrokeStart(fn)`, `onStrokeEnd(fn)`, `getSnapshot()`, `applySnapshot(ImageData)`, `clear()`, `exportPNG()`.
- **`Shortcuts`** *(shallow)* — global keydown handler. Interface: `bind({ undo, redo, pen, eraser, sizeUp, sizeDown })`. Guards against firing when the active element is an `<input>` or `<textarea>`. Normalizes Ctrl/Cmd.
- **`main.ts`** — wiring only. Builds toolbar DOM, instantiates the four modules, connects events. No logic worth extracting.

### File layout

Flat `src/`, one file per module: `main.ts`, `canvas.ts`, `history.ts`, `tools.ts`, `shortcuts.ts`, `style.css`. `index.html` at the root. No `components/`, `utils/`, or `lib/` folders. Files are split when one grows past ~150 lines, not preemptively.

## Testing Decisions

A good test here verifies external behavior at the module's interface, not its internal data structures. For `History`, that means asserting the sequence of `ImageData` references returned by `undo`/`redo` after a series of `snapshot` calls — not asserting the shape of the internal arrays. For DOM-bound modules, it means asserting observable outcomes (a stroke ends after `pointerup`; the canvas pixel buffer matches an expected snapshot after a clear) — not that a particular handler was registered.

**Modules to test:** all of them, per user request.

- **`History`** — straightforward. Vitest, no DOM, fake `ImageData` (a tagged object with an `id`). Cases: snapshot/undo round-trip, redo after undo, redo cleared on new snapshot, cap enforcement (push 21, oldest dropped), undo on empty stack returns `null`, redo on empty stack returns `null`, clear empties both stacks.
- **`ToolState`** — Vitest, no DOM. Cases: subscribers fire on change, size clamped to 1–50, no-op updates don't fire subscribers (if we decide to dedupe).
- **`CanvasSurface`** — Vitest + jsdom is **not** sufficient: jsdom does not implement `CanvasRenderingContext2D`. Two viable options: (a) `vitest-canvas-mock` / `jest-canvas-mock` for unit-style tests of the wrapper logic without real pixel verification; (b) Playwright component tests for true end-to-end pointer-event-and-pixel verification. Recommendation: start with (a) for stroke wiring and tool-switch logic, add (b) only if we hit a bug that (a) can't catch. **Cost flag:** this is more scaffolding than the rest of the app combined.
- **`Shortcuts`** — Vitest + jsdom, dispatching `KeyboardEvent`s. Cases: each shortcut fires its command, shortcuts are suppressed when focus is in an `<input>`, Ctrl and Cmd are both accepted on the same binding, Shift+Ctrl+Z routes to redo not undo.

**Prior art:** none in this repo — this is a greenfield project. The Vitest + jsdom pattern is standard; the canvas-mock approach is the conventional workaround for the canvas/jsdom gap.

## Out of Scope

- Shapes (rectangle, circle, line), fill bucket, text, selection/move, layers, pressure sensitivity, multi-touch gestures.
- Saving/loading native project files (`.json`, `.psd`, etc.). Export is PNG only, one-way.
- Persistence across reloads (localStorage, IndexedDB, autosave, file-system access API).
- Sharing, accounts, multi-user, cloud sync, share-via-URL.
- Theming, dark mode, custom toolbar layout.
- Resizable / responsive canvas. Canvas size is fixed.
- Keyboard shortcuts beyond the listed set. No `Ctrl+S`, no `Ctrl+N`.
- Mobile-optimized UI. The app should work on touch devices via Pointer Events, but the toolbar is not redesigned for small screens.
- Accessibility audit beyond using native inputs and semantic buttons.
- Internationalization.

## Further Notes

- The pixel-based state model was chosen deliberately over stroke-based to keep the eraser, export, and undo implementations small. The cost is that we cannot later add features like "edit a previous stroke's color" or "vector export" without a substantial rework — those would require a stroke list and would effectively be a v2 rewrite. That tradeoff is accepted.
- The 20-snapshot history cap implies a worst-case memory cost of roughly `1024 * 768 * 4 * (DPR^2) * 20` bytes — about 60 MB at DPR=2. Acceptable on desktop, would need revisiting if the canvas size ever grows.
- The decision to skip persistence means a browser crash mid-session loses work. This is a known cost; the mitigation is "export early, export often" and the explicit save-as-PNG model. If users find this painful, IndexedDB-backed autosave is the right v2 move (not localStorage — the 5 MB cap is too tight for canvas data URLs).
- This PRD was produced from a `/grill-me` interview on 2026-05-03; every decision listed above corresponds to a resolved branch of that interview.
