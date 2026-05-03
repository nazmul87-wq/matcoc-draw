// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { bindShortcuts } from "./shortcuts";

const press = (key: string, opts: KeyboardEventInit = {}) => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...opts }));
};

const noop = () => {};
const allNoop = () => ({
  undo: vi.fn(),
  redo: vi.fn(),
  pen: vi.fn(),
  eraser: vi.fn(),
  sizeUp: vi.fn(),
  sizeDown: vi.fn(),
});

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("Shortcuts", () => {
  it("fires undo on Ctrl+Z", () => {
    const cmds = allNoop();
    bindShortcuts(cmds);
    press("z", { ctrlKey: true });
    expect(cmds.undo).toHaveBeenCalledTimes(1);
  });

  it("fires undo on Cmd+Z", () => {
    const cmds = allNoop();
    bindShortcuts(cmds);
    press("z", { metaKey: true });
    expect(cmds.undo).toHaveBeenCalledTimes(1);
  });

  it("fires redo on Ctrl+Shift+Z and does NOT fire undo", () => {
    const cmds = allNoop();
    bindShortcuts(cmds);
    press("z", { ctrlKey: true, shiftKey: true });
    expect(cmds.redo).toHaveBeenCalledTimes(1);
    expect(cmds.undo).not.toHaveBeenCalled();
  });

  it("fires pen on B and eraser on E", () => {
    const cmds = allNoop();
    bindShortcuts(cmds);
    press("b");
    press("e");
    expect(cmds.pen).toHaveBeenCalledTimes(1);
    expect(cmds.eraser).toHaveBeenCalledTimes(1);
  });

  it("fires sizeDown on [ and sizeUp on ]", () => {
    const cmds = allNoop();
    bindShortcuts(cmds);
    press("[");
    press("]");
    expect(cmds.sizeDown).toHaveBeenCalledTimes(1);
    expect(cmds.sizeUp).toHaveBeenCalledTimes(1);
  });

  it("does not fire shortcuts when focus is in an input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const cmds = allNoop();
    bindShortcuts(cmds);

    press("b");
    press("z", { ctrlKey: true });

    expect(cmds.pen).not.toHaveBeenCalled();
    expect(cmds.undo).not.toHaveBeenCalled();
  });

  it("does not fire shortcuts when focus is in a textarea", () => {
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.focus();
    const cmds = allNoop();
    bindShortcuts(cmds);

    press("e");

    expect(cmds.eraser).not.toHaveBeenCalled();
  });
});

void noop;
