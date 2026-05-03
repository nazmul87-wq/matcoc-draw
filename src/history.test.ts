import { describe, it, expect } from "vitest";
import { History } from "./history";

const fakeSnap = (id: number) => ({ id }) as unknown as ImageData;

describe("History", () => {
  it("returns the most recent snapshot when undo is called", () => {
    const history = new History();
    const snap = fakeSnap(1);

    history.snapshot(snap);

    expect(history.undo(fakeSnap(99))).toBe(snap);
  });

  it("redo returns the state that was current at the time of undo", () => {
    const history = new History();
    const before = fakeSnap(1);
    const after = fakeSnap(2);

    history.snapshot(before);
    history.undo(after);

    expect(history.redo(before)).toBe(after);
  });

  it("returns null when undo is called on an empty stack", () => {
    const history = new History();
    expect(history.undo(fakeSnap(1))).toBe(null);
  });

  it("returns null when redo is called on an empty stack", () => {
    const history = new History();
    expect(history.redo(fakeSnap(1))).toBe(null);
  });

  it("does not push onto redo when undo is called on an empty stack", () => {
    const history = new History();
    history.undo(fakeSnap(1));
    expect(history.redo(fakeSnap(2))).toBe(null);
  });

  it("clears redo when a new snapshot is pushed after an undo", () => {
    const history = new History();
    history.snapshot(fakeSnap(1));
    history.undo(fakeSnap(2));

    history.snapshot(fakeSnap(3));

    expect(history.redo(fakeSnap(4))).toBe(null);
  });

  it("drops the oldest snapshot when more than 20 are pushed", () => {
    const history = new History();
    const oldest = fakeSnap(0);
    history.snapshot(oldest);
    for (let i = 1; i <= 20; i++) history.snapshot(fakeSnap(i));

    for (let i = 20; i >= 1; i--) {
      expect(history.undo(fakeSnap(100 + i))).toEqual({ id: i });
    }
    expect(history.undo(fakeSnap(999))).toBe(null);
  });

  it("clear empties both undo and redo stacks", () => {
    const history = new History();
    history.snapshot(fakeSnap(1));
    history.snapshot(fakeSnap(2));
    history.undo(fakeSnap(3));

    history.clear();

    expect(history.undo(fakeSnap(4))).toBe(null);
    expect(history.redo(fakeSnap(5))).toBe(null);
  });
});
