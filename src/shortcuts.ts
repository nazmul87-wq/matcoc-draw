export interface ShortcutCommands {
  undo: () => void;
  redo: () => void;
  pen: () => void;
  eraser: () => void;
  sizeUp: () => void;
  sizeDown: () => void;
}

const isTextInput = (el: Element | null): boolean => {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
};

export function bindShortcuts(commands: ShortcutCommands): void {
  document.addEventListener("keydown", (event) => {
    if (isTextInput(document.activeElement)) return;

    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (mod && key === "z") {
      event.preventDefault();
      if (event.shiftKey) commands.redo();
      else commands.undo();
      return;
    }

    if (event.shiftKey || mod) return;

    switch (event.key) {
      case "b":
      case "B":
        commands.pen();
        break;
      case "e":
      case "E":
        commands.eraser();
        break;
      case "[":
        commands.sizeDown();
        break;
      case "]":
        commands.sizeUp();
        break;
    }
  });
}
