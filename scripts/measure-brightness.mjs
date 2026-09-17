// Measures average canvas brightness at each progress value 0.28→0.40
// Run with: node scripts/measure-brightness.mjs

import { chromium } from "playwright";

const values = Array.from({ length: 13 }, (_, i) => +(0.28 + i * 0.01).toFixed(2));

const page_brightness = async (page) => {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return -1;
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return -2;
    const w = canvas.width, h = canvas.height;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      sum += px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
    }
    return sum / (w * h);
  });
};

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

const results = [];

for (const p of values) {
  await page.goto(`http://localhost:3000/?progress=${p}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000); // let canvas settle
  const b = await page_brightness(page);
  results.push({ p, b: +b.toFixed(2) });
  process.stdout.write(`p=${p.toFixed(2)}  brightness=${b.toFixed(2)}\n`);
}

console.log("\n--- Brightness steps ---");
for (let i = 1; i < results.length; i++) {
  const delta = Math.abs(results[i].b - results[i - 1].b);
  const flag = delta > 8 ? " *** EXCEEDS 8 ***" : "";
  console.log(`${results[i - 1].p.toFixed(2)}→${results[i].p.toFixed(2)}  Δ=${delta.toFixed(2)}${flag}`);
}

const maxStep = Math.max(...results.slice(1).map((r, i) => Math.abs(r.b - results[i].b)));
console.log(`\nLargest single-step Δ: ${maxStep.toFixed(2)}`);

await browser.close();
