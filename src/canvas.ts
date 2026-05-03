import type { ToolSnapshot } from "./tools";

const LOGICAL_WIDTH = 1024;
const LOGICAL_HEIGHT = 768;

export interface CanvasSurfaceOptions {
  parent: HTMLElement;
  getTool: () => ToolSnapshot;
}

export class CanvasSurface {
  readonly element: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private getTool: () => ToolSnapshot;
  private strokeStartHandlers: (() => void)[] = [];
  private strokeEndHandlers: (() => void)[] = [];
  private lastX = 0;
  private lastY = 0;

  constructor({ parent, getTool }: CanvasSurfaceOptions) {
    this.getTool = getTool;
    this.dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement("canvas");
    canvas.width = LOGICAL_WIDTH * this.dpr;
    canvas.height = LOGICAL_HEIGHT * this.dpr;
    canvas.style.width = `${LOGICAL_WIDTH}px`;
    canvas.style.height = `${LOGICAL_HEIGHT}px`;
    canvas.className = "drawing-canvas";
    canvas.style.touchAction = "none";

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    ctx.scale(this.dpr, this.dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    this.element = canvas;
    this.ctx = ctx;
    parent.appendChild(canvas);

    this.wirePointerEvents();
  }

  onStrokeStart(fn: () => void): void {
    this.strokeStartHandlers.push(fn);
  }

  onStrokeEnd(fn: () => void): void {
    this.strokeEndHandlers.push(fn);
  }

  getSnapshot(): ImageData {
    return this.ctx.getImageData(
      0,
      0,
      this.element.width,
      this.element.height,
    );
  }

  applySnapshot(snap: ImageData): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
    this.ctx.putImageData(snap, 0, 0);
    this.ctx.restore();
  }

  clear(): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
    this.ctx.restore();
  }

  exportPNG(): void {
    const url = this.element.toDataURL("image/png");
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `matcoc-draw-${stamp}.png`;
    a.click();
  }

  private wirePointerEvents(): void {
    this.element.addEventListener("pointerdown", (e) => {
      this.element.setPointerCapture(e.pointerId);
      this.strokeStartHandlers.forEach((fn) => fn());

      const tool = this.getTool();
      this.ctx.globalCompositeOperation =
        tool.tool === "eraser" ? "destination-out" : "source-over";
      this.ctx.strokeStyle = tool.color;
      this.ctx.lineWidth = tool.size;

      const { x, y } = this.localCoords(e);
      this.lastX = x;
      this.lastY = y;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + 0.01, y + 0.01);
      this.ctx.stroke();
    });

    this.element.addEventListener("pointermove", (e) => {
      if (!this.element.hasPointerCapture(e.pointerId)) return;
      const { x, y } = this.localCoords(e);
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.lastX = x;
      this.lastY = y;
    });

    const end = (e: PointerEvent) => {
      if (!this.element.hasPointerCapture(e.pointerId)) return;
      this.element.releasePointerCapture(e.pointerId);
      this.ctx.globalCompositeOperation = "source-over";
      this.strokeEndHandlers.forEach((fn) => fn());
    };
    this.element.addEventListener("pointerup", end);
    this.element.addEventListener("pointercancel", end);
  }

  private localCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
}
