# matcoc-draw User Guide

A quick tour of every control in the app. The app runs entirely in your browser — nothing is uploaded, nothing is saved between reloads.

## Getting started

Open the app in any modern browser (Chrome, Edge, Firefox, Safari). You see a toolbar at the top and a 1024×768 white canvas centered below it. Start drawing with your mouse, stylus, or finger. There's no sign-in and no setup.

## The toolbar

The toolbar is divided into groups, separated by thin vertical lines. Left to right:

### 1. Tool group — `Pen` / `Eraser`

Click `Pen` to draw with the current color and size. Click `Eraser` to remove pixels from the canvas. The eraser does **not** paint white — it removes pixels, so when you export to PNG the erased areas are transparent.

The active tool is highlighted in blue.

### 2. Style group — color, size slider, size label

- **Color picker** — opens your operating system's native color dialog. Affects the pen only; the eraser ignores it.
- **Size slider** — 1 to 50 pixels. Used by both pen and eraser.
- **Size label** — shows the current size in pixels.

### 3. History group — `Undo` / `Redo`

- **Undo** removes the last stroke. Each page keeps its own undo history of up to **20 strokes**; older strokes drop off as you draw.
- **Redo** restores a stroke you just undid. Drawing a new stroke clears the redo history.

Undo and redo only operate on the page you are currently viewing — they never jump you to a different page.

### 4. Pages group — `◀` / `Page X / Y` / `▶` / `+ Add page` / `Delete page`

This is the multi-page document control.

- **`◀` / `▶`** — navigate to the previous or next page. They grey out at the boundaries; navigation does not wrap.
- **`Page X / Y`** — current page number out of total. The label updates as you navigate, add, or delete pages.
- **`+ Add page`** — inserts a new blank page **immediately after the current one** and jumps to it. Disabled at the **10-page cap**.
- **`Delete page`** — deletes the current page after a confirmation prompt. Disabled when only one page remains. After deleting a page in the middle, the page that shifts up becomes the new current page; after deleting the last page, you land on what's now the new last page.

Each page has its own pixel buffer and its own undo history. Switching pages preserves whatever you drew, exactly.

### 5. Action group — `Clear` / `Export page` / `Export all`

- **`Clear`** — empties the canvas of the current page after a confirmation prompt. The clear itself is undoable on this page (one `Undo` brings the strokes back).
- **`Export page`** — downloads the current page as a PNG. Filename: `matcoc-draw-<timestamp>.png`. Erased areas come out transparent.
- **`Export all`** — downloads every page as its own PNG. All files share one timestamp and end with a 1-indexed, zero-padded page suffix: `matcoc-draw-<timestamp>-page-01.png`, `…-page-02.png`, and so on. Browsers may prompt the first time you trigger N downloads in one click — allow it. Your current page is restored after the export completes.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `B` | Switch to pen |
| `E` | Switch to eraser |
| `[` / `]` | Decrease / increase brush size |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| `PageUp` | Previous page |
| `PageDown` | Next page |

All shortcuts are suppressed while you're typing inside an input — the color picker and the size slider both count, so you can interact with them normally without accidentally switching tools.

## Working with input devices

The app uses [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) under the hood, so a mouse, stylus, and touchscreen all behave the same way. When you start a stroke, the canvas captures the pointer for the duration of the stroke — your line will not break if your finger or stylus briefly leaves the canvas area.

There is no pressure sensitivity or multi-touch gesture support.

## What the app does **not** do

These are deliberately out of scope. Use a heavier tool if you need them:

- **Persistence.** Reloading the page or closing the tab discards everything. The only way to keep your work is to export PNGs. There is no autosave, no localStorage, no cloud sync.
- **Shapes, fill, text, selection, layers, vector export.** Pen and eraser only.
- **Resizable canvas.** The canvas is fixed at 1024×768 logical pixels.
- **Mobile-optimized layout.** The app works on touch, but the toolbar is not redesigned for small screens.
- **Page reordering, duplication, or thumbnails.** Pages are sequential and identified by number only.
- **Wrap-around page navigation.** `◀` at page 1 and `▶` at the last page do nothing.

## Tips

- **Export early, export often.** Because there's no autosave, your only insurance against a browser crash or accidental tab close is the PNG you exported a minute ago.
- **The eraser preserves transparency.** This means you can layer the exported PNG over a photo or another image — erased pixels show what's underneath.
- **`Add page` inserts after the current page**, not at the end. If you realize mid-document that you need a page between page 2 and page 3, navigate to page 2 first, then click `Add page`.
- **HiDPI displays.** The canvas is internally sized at `1024 × DPR` × `768 × DPR` pixels, so strokes stay crisp on Retina-class screens. The exported PNG matches this resolution.

## Troubleshooting

- **"My drawing is gone after I refreshed."** This is expected — the app has no persistence. Always export PNGs before closing the tab.
- **"I clicked `Export all` and only got one file."** Some browsers throttle multiple downloads triggered by a single click. Look for a permission prompt at the top of the browser window the first time it happens, and allow multi-download for this site.
- **"My keyboard shortcut isn't working."** Click somewhere on the canvas first to make sure focus isn't trapped in the color picker or size slider — shortcuts are intentionally suppressed while a form input has focus.
- **"I hit the 10-page cap."** The cap is a memory guardrail. Export the document first, refresh the page (which gives you a clean single-page document), and continue.
