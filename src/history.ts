const MAX_UNDO = 20;

export class History {
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  snapshot(image: ImageData): void {
    this.undoStack.push(image);
    if (this.undoStack.length > MAX_UNDO) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(current: ImageData): ImageData | null {
    const previous = this.undoStack.pop();
    if (previous === undefined) return null;
    this.redoStack.push(current);
    return previous;
  }

  redo(current: ImageData): ImageData | null {
    const next = this.redoStack.pop();
    if (next === undefined) return null;
    this.undoStack.push(current);
    return next;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
