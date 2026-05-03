import { describe, it, expect, vi } from "vitest";
import { ToolState } from "./tools";

describe("ToolState", () => {
  it("returns the color that was set via setColor", () => {
    const tools = new ToolState();
    tools.setColor("#ff0000");
    expect(tools.current().color).toBe("#ff0000");
  });

  it("clamps size below 1 to 1", () => {
    const tools = new ToolState();
    tools.setSize(0);
    expect(tools.current().size).toBe(1);
  });

  it("clamps size above 50 to 50", () => {
    const tools = new ToolState();
    tools.setSize(99);
    expect(tools.current().size).toBe(50);
  });

  it("stores in-range size unchanged", () => {
    const tools = new ToolState();
    tools.setSize(25);
    expect(tools.current().size).toBe(25);
  });

  it("returns the tool that was set via setTool", () => {
    const tools = new ToolState();
    tools.setTool("eraser");
    expect(tools.current().tool).toBe("eraser");
  });

  it("notifies subscribers when state changes", () => {
    const tools = new ToolState();
    const fn = vi.fn();
    tools.subscribe(fn);

    tools.setColor("#abcdef");
    tools.setSize(10);
    tools.setTool("eraser");

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
