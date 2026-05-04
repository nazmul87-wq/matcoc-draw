// Capture user-guide screenshots and an animated demo GIF.
// Run with: npm run docs:screenshots
// Requires the dev server to be running on http://localhost:5174.

import { chromium } from "playwright";
import { PNG } from "pngjs";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const APP_URL = process.env.APP_URL || "http://localhost:5174/";
const OUT_DIR = "docs/screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const drawStroke = async (canvas, points, page) => {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas not found");
  await page.mouse.move(box.x + points[0][0], box.y + points[0][1]);
  await page.mouse.down();
  for (const [x, y] of points.slice(1)) {
    await page.mouse.move(box.x + x, box.y + y, { steps: 8 });
  }
  await page.mouse.up();
};

const decodePng = (buf) => PNG.sync.read(buf);

const main = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 920 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());

  await page.goto(APP_URL);
  await page.waitForSelector(".toolbar");
  await page.waitForSelector(".drawing-canvas");
  const canvas = page.locator(".drawing-canvas");

  // ----- still screenshots -----

  await page.screenshot({ path: join(OUT_DIR, "01-empty-app.png"), fullPage: false });

  // Toolbar close-up
  const toolbar = page.locator(".toolbar");
  await toolbar.screenshot({ path: join(OUT_DIR, "02-toolbar.png") });

  // After drawing — pen
  await drawStroke(
    canvas,
    [
      [120, 200],
      [220, 240],
      [320, 280],
      [420, 320],
      [520, 280],
      [620, 240],
      [720, 200],
    ],
    page,
  );
  await page.screenshot({ path: join(OUT_DIR, "03-pen-stroke.png") });

  // Switch to eraser, erase a piece
  await page.locator("button", { hasText: "Eraser" }).click();
  await drawStroke(
    canvas,
    [
      [380, 240],
      [380, 320],
    ],
    page,
  );
  await page.screenshot({ path: join(OUT_DIR, "04-after-erase.png") });

  // Multi-page: add a second page, draw, switch back
  await page.locator("button", { hasText: "Pen" }).click();
  await page.locator("button", { hasText: "+ Add page" }).click();
  await page.waitForTimeout(150);
  await drawStroke(
    canvas,
    [
      [200, 350],
      [400, 350],
      [400, 450],
      [200, 450],
      [200, 350],
    ],
    page,
  );
  await page.screenshot({ path: join(OUT_DIR, "05-page-2.png") });
  // Show the pages group prominently — cropped to a band including the toolbar
  await toolbar.screenshot({ path: join(OUT_DIR, "06-pages-toolbar.png") });

  // ----- GIF demo: scripted multi-page workflow -----

  // Reset to a clean state by reloading
  await page.goto(APP_URL);
  await page.waitForSelector(".drawing-canvas");
  const canvas2 = page.locator(".drawing-canvas");

  const frames = [];
  const captureFrame = async () => {
    const buf = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 920 },
    });
    frames.push(decodePng(buf));
  };

  await captureFrame();

  // Pen stroke 1
  await drawStroke(
    canvas2,
    [
      [180, 260],
      [280, 220],
      [380, 280],
      [480, 240],
      [580, 300],
    ],
    page,
  );
  await page.waitForTimeout(150);
  await captureFrame();

  // Switch to eraser
  await page.locator("button", { hasText: "Eraser" }).click();
  await page.waitForTimeout(100);
  await captureFrame();

  // Erase a bit
  await drawStroke(
    canvas2,
    [
      [340, 240],
      [340, 320],
    ],
    page,
  );
  await page.waitForTimeout(100);
  await captureFrame();

  // Switch back to pen
  await page.locator("button", { hasText: "Pen" }).click();
  await page.waitForTimeout(100);
  await captureFrame();

  // Add a page
  await page.locator("button", { hasText: "+ Add page" }).click();
  await page.waitForTimeout(150);
  await captureFrame();

  // Draw on page 2
  await drawStroke(
    canvas2,
    [
      [220, 340],
      [420, 340],
      [420, 460],
      [220, 460],
      [220, 340],
    ],
    page,
  );
  await page.waitForTimeout(150);
  await captureFrame();

  // Navigate back to page 1
  await page.locator(".toolbar").locator("button", { hasText: "◀" }).click();
  await page.waitForTimeout(150);
  await captureFrame();

  // Navigate forward to page 2
  await page.locator(".toolbar").locator("button", { hasText: "▶" }).click();
  await page.waitForTimeout(150);
  await captureFrame();

  await browser.close();

  // ----- assemble GIF -----

  const { width, height } = frames[0];
  const gif = GIFEncoder();
  const fps = 1.5;
  const delayMs = Math.round(1000 / fps);
  for (const f of frames) {
    const rgba = new Uint8ClampedArray(f.data.buffer, f.data.byteOffset, f.data.length);
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);
    gif.writeFrame(indexed, width, height, { palette, delay: delayMs });
  }
  gif.finish();
  const gifBytes = gif.bytes();
  writeFileSync(join(OUT_DIR, "demo.gif"), gifBytes);

  console.log(
    `wrote ${frames.length} frames into demo.gif (${width}x${height}, ${gifBytes.length} bytes) and 6 PNG screenshots.`,
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
