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

---

# PRD: matcoc-draw v1.1 — Multi-page documents

**Status:** needs-triage
**Owner:** nazmul87@gmail.com
**Date:** 2026-05-03

## Problem Statement

A single fixed canvas is a hard ceiling. A sketch idea often spans more than one surface — a sequence of frames, a before/after, a thought broken across boards. Today the only options are "erase what you have" or "export and start over," both of which break flow. I want to keep the v1 single-canvas feel but be able to flip to a fresh page without losing the page I just left.

## Solution

The document becomes a small ordered list of pages, each one its own 1024×768 canvas with its own undo history. A toolbar shows `◀ Page X / Y ▶`, an "Add page" button, and a "Delete page" button. `PageDown` / `PageUp` navigate. Adding a page inserts after the current page and jumps to it. Deleting prompts for confirmation and lands on the page that shifts into the slot. The existing "Export PNG" stays as "Export page" and a sibling "Export all" exports every page to its own PNG. Reload still wipes everything — the no-persistence v1 stance carries forward unchanged.

## User Stories

1. As a user, I want to add a new blank page to my document, so that I can keep sketching without erasing the page I'm on.
2. As a user, I want a new page to be inserted right after the page I'm currently viewing, so that I can build a sequence in the order I think of it.
3. As a user, I want adding a page to immediately move me onto that new page, so that I can start drawing without an extra click.
4. As a user, I want to navigate between pages with `◀` and `▶` buttons in the toolbar, so that page switching is one click and discoverable.
5. As a user, I want a `Page X / Y` indicator in the toolbar, so that I always know where I am in the document.
6. As a user, I want `PageDown` / `PageUp` keys to navigate to the next/previous page, so that I don't break flow with the mouse.
7. As a user, I want each page to have its own undo history, so that `Ctrl+Z` undoes the stroke I just made on this page and never teleports me to a different page.
8. As a user, I want navigating between pages to never consume undo, so that switching pages is free and reversible.
9. As a user, I want to delete the current page, so that I can recover from a sketch I no longer want.
10. As a user, I want a confirmation prompt before a page is deleted, so that a stray click doesn't lose work.
11. As a user, I want the delete button to be disabled when only one page remains, so that the document is never empty.
12. As a user, I want deleting a non-last page to land me on the page that shifts into its slot, so that the cursor follows the natural file-explorer convention.
13. As a user, I want deleting the last page to land me on the new last page, so that I'm always somewhere valid.
14. As a user, I want a soft cap of 10 pages, so that the app stays bounded in memory and predictable in performance.
15. As a user, I want the "Add page" button to be disabled at the cap, so that the limit is visible rather than a silent failure.
16. As a user, I want my existing "Export PNG" button to keep working unchanged and export only the page I'm viewing, so that the single-page workflow doesn't regress.
17. As a user, I want a separate "Export all" button that exports every page to its own PNG, so that I can save a multi-page document in one click.
18. As a user, I want the multi-page export filenames to be zero-padded (`page-01`, `page-02`, …), so that they sort correctly in my file manager.
19. As a user, I want navigation at the boundaries to clamp (no wrap-around), so that hitting `PageDown` on the last page is a no-op rather than teleporting me to page 1.
20. As a user, I want the existing "Clear canvas" action to scope to the current page only, so that it matches the v1 mental model and doesn't wipe pages I'm not looking at.
21. As a user, I want `PageDown` / `PageUp` to be suppressed when focus is in an input, so that they don't fight with text-field cursor movement.
22. As a user, I want the active page's pixel state preserved when I navigate away and back, so that pages feel persistent within the session.
23. As a user, I want reload to still produce a single blank page, so that the app's state model stays predictable and matches v1.

## Implementation Decisions

- **New module: `Pages`** *(deep, pure logic)*. Owns an ordered list of `{ snapshot: ImageData | null, history: History }` and a `currentIndex`. Interface: `current()`, `count()`, `next()`, `prev()`, `goto(i)`, `add()`, `delete()`, `storeOutgoing(ImageData)`, `subscribe(fn)`. No DOM dependencies. Boundary actions (`next` past end, `prev` before start, `add` at cap, `delete` at count 1) are silent no-ops that return `false`; successful mutations return `true`. Subscribers fire only on actual changes, not on no-ops.
- **`History` module unchanged.** Each page holds its own `History` instance; the per-page 20-snapshot cap is unchanged.
- **`CanvasSurface` unchanged.** The existing `getSnapshot()` / `applySnapshot(ImageData)` / `clear()` interface is exactly what page-switch needs. No structural additions to this module.
- **`ToolState` unchanged.** Tool / color / size are document-wide, not per-page.
- **`Shortcuts` extension.** Add `pageNext` and `pagePrev` bindings on `PageDown` / `PageUp`. The existing input-focus guard covers them automatically.
- **`main.ts` wiring.** On page-switch: `pages.storeOutgoing(canvas.getSnapshot())`, then `pages.next()` / `prev()` / `goto()`, then either `canvas.applySnapshot(pages.current().snapshot)` if non-null or `canvas.clear()` if the incoming page has never been drawn on. Undo/redo handlers always read `pages.current().history` rather than holding a long-lived reference. The toolbar subscribes to `pages` and re-renders the counter and the enabled state of `◀ ▶ + Delete`.
- **Storage model.** One live `<canvas>` element, reused for every page. Inactive pages live as `ImageData` in the `Pages` array. New pages start with `snapshot: null`, which `main.ts` interprets as "show a blank canvas."
- **Page lifecycle.** `add()` inserts after `currentIndex` and bumps the index to the new page. `delete()` of a non-last page keeps the index pointing at the same slot (so the page that shifted in becomes current). `delete()` of the highest-index page decrements the index. `delete()` is disallowed when `count() === 1`.
- **Cap.** Soft cap of 10 pages enforced inside `Pages.add()`. The toolbar uses the boolean return to keep "Add page" disabled at the cap.
- **Clear scope.** "Clear canvas" continues to mean "clear the current page," undoable on the current page's history.
- **Export.** Two buttons. "Export page" keeps the v1 behavior (`canvas.toDataURL('image/png')` of the live canvas). "Export all" iterates `pages`: for each page other than the current, swap its `ImageData` onto the live canvas, call `toDataURL`, then restore. Filenames: `matcoc-draw-<ISO>-page-<NN>.png` with `NN` zero-padded to 2 digits. No zip; multi-download via repeated hidden-anchor clicks within one user gesture is accepted, with the v2 fallback being a small zip lib (`fflate`-class) if browser throttling proves to be a real problem.
- **Memory budget.** Worst case at DPR=2: ~6 MB live `ImageData` per page × 10 pages, plus 20 history snapshots × 6 MB per page, ≈ 1.2 GB ceiling. The realistic case with sparse history is far smaller. Documented as accepted; the soft cap is the lever if a user complains.
- **Persistence.** Unchanged from v1: none. Reload = single blank page.

## Testing Decisions

The v1 testing posture carries forward: pure-logic modules are unit-tested at their interface with no DOM and no real pixels; `CanvasSurface` is verified manually.

- **`Pages`** *(new)* — Vitest, no DOM, fake `ImageData` (a tagged object with an `id`). Cases: starts with one page whose snapshot is null; `add()` inserts after current and bumps index; `add()` at cap returns false and does not mutate; `delete()` of non-last lands on the shifted page; `delete()` of last decrements index; `delete()` at count 1 returns false and does not mutate; `next()` / `prev()` clamp at boundaries (return false, no subscriber fires); each page's `history` is a distinct instance; `subscribe(fn)` fires on every successful mutation and never on no-ops; `storeOutgoing(snapshot)` writes into the current slot before navigation.
- **`History`** — existing tests unchanged.
- **`ToolState`** — existing tests unchanged.
- **`Shortcuts`** — extend the existing test file with cases for `PageDown` / `PageUp` firing their bindings and being suppressed when focus is in an `<input>`.
- **`CanvasSurface`** — still not unit-tested, same reasoning as v1 (jsdom lacks `CanvasRenderingContext2D`). The page-switch snapshot/restore round-trip is verified by drawing on page 1, switching to page 2, drawing, switching back, and confirming page 1's pixels are intact.

**Prior art:** the `History` and `ToolState` test files in this repo. `Pages` is structurally most similar to `History` — both are pure stack-like state machines exposed through a small command interface.

## Out of Scope

- Page thumbnails or any visual page strip. The toolbar shows `Page X / Y` text only.
- Reordering, duplicating, or copy-pasting pages.
- Cross-page undo or a document-level undoable timeline of page operations (add / delete / reorder).
- Zip export of all pages as a single download.
- Stitched / composite export (vertical strip, grid, PDF).
- Persistence across reloads. Pages live in memory only.
- Per-page tool / color / size memory. Tool state is document-wide.
- Page templates, named pages, or page-level metadata.
- Wrap-around navigation at the page boundaries.
- Mobile-redesigned multi-page UI.
- Raising the 10-page soft cap or making it configurable.

## Further Notes

- The decision tree for v1.1 was resolved across `/grill-me` questions Q1–Q9 on 2026-05-03; every decision in this section corresponds to a resolved branch.
- The 10-page soft cap was chosen as a memory guardrail, not a UX one. If a user hits it, the right v2 move is on-demand compression of inactive pages (e.g. PNG-encoded `Blob` instead of `ImageData`) before raising the cap, so that the worst-case footprint scales sub-linearly with page count.
- Multi-download via repeated user-gesture clicks is brittle across browsers. If "Export all" produces flaky results in practice, ship the `fflate`-class zip path as the fix; it's the smallest credible dependency for the job and stays consistent with the "no runtime deps unless forced" stance.
- The pixel-based state model continues to constrain the design: pages are pixel buffers, not stroke lists, and that's why per-page reordering / duplication / cross-page undo are all deferred to the v2 rewrite called out in v1's Further Notes.
- The PRD-first / implement-second order of operations is being followed deliberately — implementation should produce a small, reviewable diff against this document.
