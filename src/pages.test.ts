import { describe, it, expect } from "vitest";
import { Pages } from "./pages";
import { History } from "./history";

const fakeSnap = (id: number) => ({ id }) as unknown as ImageData;

describe("Pages", () => {
  it("starts with one page whose snapshot is null", () => {
    const pages = new Pages();

    expect(pages.count()).toBe(1);
    expect(pages.current().snapshot).toBe(null);
    expect(pages.current().history).toBeInstanceOf(History);
  });

  it("next moves to the following page and prev moves back", () => {
    const pages = new Pages();
    const first = pages.current();
    pages.add();
    const second = pages.current();

    expect(pages.prev()).toBe(true);
    expect(pages.current()).toBe(first);

    expect(pages.next()).toBe(true);
    expect(pages.current()).toBe(second);
  });

  it("next returns false at the last page and prev returns false at the first", () => {
    const pages = new Pages();
    pages.add();
    const second = pages.current();

    expect(pages.next()).toBe(false);
    expect(pages.current()).toBe(second);

    pages.prev();
    expect(pages.prev()).toBe(false);
  });

  it("subscribe fires on add, next, and prev — but not on no-op next/prev", () => {
    const pages = new Pages();
    let calls = 0;
    pages.subscribe(() => calls++);

    pages.prev();
    expect(calls).toBe(0);

    pages.add();
    expect(calls).toBe(1);

    pages.next();
    expect(calls).toBe(1);

    pages.prev();
    expect(calls).toBe(2);
  });

  it("currentIndex reflects the current page position", () => {
    const pages = new Pages();
    expect(pages.currentIndex()).toBe(0);

    pages.add();
    expect(pages.currentIndex()).toBe(1);

    pages.prev();
    expect(pages.currentIndex()).toBe(0);
  });

  it("storeOutgoing writes the snapshot into the current slot before navigation", () => {
    const pages = new Pages();
    const snap = fakeSnap(1);

    pages.storeOutgoing(snap);
    pages.add();

    expect(pages.current().snapshot).toBe(null);
    pages.prev();
    expect(pages.current().snapshot).toBe(snap);
  });

  it("goto navigates to a valid index, fires subscribers, and rejects out-of-range or no-op", () => {
    const pages = new Pages();
    pages.add();
    pages.add();
    let calls = 0;
    pages.subscribe(() => calls++);

    expect(pages.goto(0)).toBe(true);
    expect(calls).toBe(1);

    expect(pages.goto(0)).toBe(false);
    expect(calls).toBe(1);

    expect(pages.goto(5)).toBe(false);
    expect(pages.goto(-1)).toBe(false);
    expect(calls).toBe(1);
  });

  it("delete returns false and does not mutate or notify when only one page remains", () => {
    const pages = new Pages();
    let calls = 0;
    pages.subscribe(() => calls++);

    expect(pages.delete()).toBe(false);

    expect(pages.count()).toBe(1);
    expect(calls).toBe(0);
  });

  it("delete on a non-last page keeps the index and lands on the page that shifted in", () => {
    const pages = new Pages();
    pages.storeOutgoing(fakeSnap(0));
    pages.add();
    pages.storeOutgoing(fakeSnap(1));
    pages.add();
    pages.storeOutgoing(fakeSnap(2));
    pages.prev();
    expect(pages.currentIndex()).toBe(1);

    expect(pages.delete()).toBe(true);

    expect(pages.count()).toBe(2);
    expect(pages.currentIndex()).toBe(1);
    expect(pages.current().snapshot).toEqual({ id: 2 });
  });

  it("delete on the last page decrements the index and lands on the new last page", () => {
    const pages = new Pages();
    pages.storeOutgoing(fakeSnap(0));
    pages.add();
    pages.storeOutgoing(fakeSnap(1));
    pages.add();
    pages.storeOutgoing(fakeSnap(2));
    expect(pages.currentIndex()).toBe(2);

    expect(pages.delete()).toBe(true);

    expect(pages.count()).toBe(2);
    expect(pages.currentIndex()).toBe(1);
    expect(pages.current().snapshot).toEqual({ id: 1 });
  });

  it("delete fires subscribers exactly once on success", () => {
    const pages = new Pages();
    pages.add();
    let calls = 0;
    pages.subscribe(() => calls++);

    pages.delete();

    expect(calls).toBe(1);
  });

  it("each page owns a distinct History instance", () => {
    const pages = new Pages();
    const firstHistory = pages.current().history;
    pages.add();
    const secondHistory = pages.current().history;

    expect(secondHistory).not.toBe(firstHistory);

    pages.prev();
    expect(pages.current().history).toBe(firstHistory);
  });

  it("add returns false and does not mutate when at the 10-page cap", () => {
    const pages = new Pages();
    for (let i = 0; i < 9; i++) pages.add();
    expect(pages.count()).toBe(10);

    expect(pages.add()).toBe(false);

    expect(pages.count()).toBe(10);
  });

  it("add inserts a new page after the current one and navigates to it", () => {
    const pages = new Pages();
    const firstPage = pages.current();

    expect(pages.add()).toBe(true);

    expect(pages.count()).toBe(2);
    expect(pages.current()).not.toBe(firstPage);
    expect(pages.current().snapshot).toBe(null);
  });
});
