export type Tool = "pen" | "eraser";

export interface ToolSnapshot {
  tool: Tool;
  color: string;
  size: number;
}

type Subscriber = (snapshot: ToolSnapshot) => void;

export class ToolState {
  private state: ToolSnapshot = { tool: "pen", color: "#000000", size: 4 };
  private subscribers: Subscriber[] = [];

  setTool(tool: Tool): void {
    this.state = { ...this.state, tool };
    this.notify();
  }

  setColor(color: string): void {
    this.state = { ...this.state, color };
    this.notify();
  }

  setSize(size: number): void {
    const clamped = Math.max(1, Math.min(50, size));
    this.state = { ...this.state, size: clamped };
    this.notify();
  }

  current(): ToolSnapshot {
    return this.state;
  }

  subscribe(fn: Subscriber): void {
    this.subscribers.push(fn);
  }

  private notify(): void {
    for (const fn of this.subscribers) fn(this.state);
  }
}
