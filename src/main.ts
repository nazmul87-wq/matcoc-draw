import "./style.css";
import { ToolState, type Tool } from "./tools";
import { CanvasSurface } from "./canvas";
import { bindShortcuts } from "./shortcuts";
import { Pages } from "./pages";

const tools = new ToolState();
const pages = new Pages();

const toolbar = document.createElement("div");
toolbar.className = "toolbar";
document.body.appendChild(toolbar);

const button = (label: string): HTMLButtonElement => {
  const b = document.createElement("button");
  b.textContent = label;
  return b;
};
const divider = (): HTMLDivElement => {
  const d = document.createElement("div");
  d.className = "divider";
  return d;
};
const group = (...children: HTMLElement[]): HTMLDivElement => {
  const g = document.createElement("div");
  g.className = "group";
  children.forEach((c) => g.appendChild(c));
  return g;
};

const penBtn = button("Pen");
const eraserBtn = button("Eraser");

const colorInput = document.createElement("input");
colorInput.type = "color";
colorInput.value = tools.current().color;

const sizeInput = document.createElement("input");
sizeInput.type = "range";
sizeInput.min = "1";
sizeInput.max = "50";
sizeInput.value = String(tools.current().size);

const sizeLabel = document.createElement("label");
sizeLabel.textContent = `Size: ${tools.current().size}`;

const undoBtn = button("Undo");
const redoBtn = button("Redo");
const clearBtn = button("Clear");
const exportBtn = button("Export PNG");

const prevPageBtn = button("◀");
const nextPageBtn = button("▶");
const addPageBtn = button("+ Add page");
const pageLabel = document.createElement("span");
pageLabel.className = "page-label";

toolbar.append(
  group(penBtn, eraserBtn),
  divider(),
  group(colorInput, sizeInput, sizeLabel),
  divider(),
  group(undoBtn, redoBtn),
  divider(),
  group(prevPageBtn, pageLabel, nextPageBtn, addPageBtn),
  divider(),
  group(clearBtn, exportBtn),
);

const wrap = document.createElement("div");
wrap.className = "canvas-wrap";
document.body.appendChild(wrap);

const surface = new CanvasSurface({
  parent: wrap,
  getTool: () => tools.current(),
});

const refreshActiveTool = () => {
  const t = tools.current().tool;
  penBtn.classList.toggle("active", t === "pen");
  eraserBtn.classList.toggle("active", t === "eraser");
};
refreshActiveTool();

const setTool = (t: Tool) => {
  tools.setTool(t);
  refreshActiveTool();
};

penBtn.addEventListener("click", () => setTool("pen"));
eraserBtn.addEventListener("click", () => setTool("eraser"));
colorInput.addEventListener("input", () => tools.setColor(colorInput.value));
sizeInput.addEventListener("input", () => {
  const n = Number(sizeInput.value);
  tools.setSize(n);
  sizeLabel.textContent = `Size: ${tools.current().size}`;
});

surface.onStrokeStart(() => {
  pages.current().history.snapshot(surface.getSnapshot());
});

const doUndo = () => {
  const snap = pages.current().history.undo(surface.getSnapshot());
  if (snap) surface.applySnapshot(snap);
};
const doRedo = () => {
  const snap = pages.current().history.redo(surface.getSnapshot());
  if (snap) surface.applySnapshot(snap);
};
undoBtn.addEventListener("click", doUndo);
redoBtn.addEventListener("click", doRedo);

clearBtn.addEventListener("click", () => {
  if (!window.confirm("Clear the canvas?")) return;
  pages.current().history.snapshot(surface.getSnapshot());
  surface.clear();
});

exportBtn.addEventListener("click", () => surface.exportPNG());

const adjustSize = (delta: number) => {
  const next = tools.current().size + delta;
  tools.setSize(next);
  sizeInput.value = String(tools.current().size);
  sizeLabel.textContent = `Size: ${tools.current().size}`;
};

const loadCurrentPage = () => {
  const incoming = pages.current().snapshot;
  if (incoming) surface.applySnapshot(incoming);
  else surface.clear();
};

const switchPage = (move: () => boolean) => {
  pages.storeOutgoing(surface.getSnapshot());
  if (move()) loadCurrentPage();
};

const refreshPageUi = () => {
  const idx = pages.currentIndex();
  const total = pages.count();
  pageLabel.textContent = `Page ${idx + 1} / ${total}`;
  prevPageBtn.disabled = idx === 0;
  nextPageBtn.disabled = idx === total - 1;
  addPageBtn.disabled = total >= 10;
};

pages.subscribe(refreshPageUi);
refreshPageUi();

prevPageBtn.addEventListener("click", () => switchPage(() => pages.prev()));
nextPageBtn.addEventListener("click", () => switchPage(() => pages.next()));
addPageBtn.addEventListener("click", () => switchPage(() => pages.add()));

bindShortcuts({
  undo: doUndo,
  redo: doRedo,
  pen: () => setTool("pen"),
  eraser: () => setTool("eraser"),
  sizeUp: () => adjustSize(1),
  sizeDown: () => adjustSize(-1),
  pageNext: () => switchPage(() => pages.next()),
  pagePrev: () => switchPage(() => pages.prev()),
});
