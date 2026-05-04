import { History } from "./history";

const MAX_PAGES = 10;

export interface Page {
  snapshot: ImageData | null;
  history: History;
}

export class Pages {
  private pages: Page[] = [{ snapshot: null, history: new History() }];
  private curIndex = 0;
  private subscribers: Array<() => void> = [];

  subscribe(fn: () => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  private notify(): void {
    for (const fn of this.subscribers) fn();
  }

  current(): Page {
    return this.pages[this.curIndex];
  }

  count(): number {
    return this.pages.length;
  }

  currentIndex(): number {
    return this.curIndex;
  }

  goto(index: number): boolean {
    if (index < 0 || index >= this.pages.length) return false;
    if (index === this.curIndex) return false;
    this.curIndex = index;
    this.notify();
    return true;
  }

  storeOutgoing(snapshot: ImageData): void {
    this.pages[this.curIndex].snapshot = snapshot;
  }

  next(): boolean {
    if (this.curIndex >= this.pages.length - 1) return false;
    this.curIndex += 1;
    this.notify();
    return true;
  }

  prev(): boolean {
    if (this.curIndex <= 0) return false;
    this.curIndex -= 1;
    this.notify();
    return true;
  }

  add(): boolean {
    if (this.pages.length >= MAX_PAGES) return false;
    const newPage: Page = { snapshot: null, history: new History() };
    this.pages.splice(this.curIndex + 1, 0, newPage);
    this.curIndex += 1;
    this.notify();
    return true;
  }
}
