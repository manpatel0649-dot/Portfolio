// Reads a PNG file and returns average luminance (0–255).
// Handles 8-bit RGB and RGBA pngs only (which is what Playwright produces).
import { createInflate } from "zlib";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { Writable } from "stream";

export async function pngBrightness(path) {
  const buf = await new Promise((res, rej) => {
    const chunks = [];
    const s = createReadStream(path);
    s.on("data", c => chunks.push(c));
    s.on("end", () => res(Buffer.concat(chunks)));
    s.on("error", rej);
  });

  // Parse PNG header + IHDR
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a)
    throw new Error("Not a PNG");
  const width  = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth    = buf[24];
  const colorType   = buf[25]; // 2=RGB, 6=RGBA
  if (bitDepth !== 8) throw new Error(`Unsupported bit depth ${bitDepth}`);
  const channels = colorType === 6 ? 4 : 3;

  // Collect all IDAT chunks
  const idatParts = [];
  let pos = 8;
  while (pos < buf.length) {
    const len  = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    if (type === "IDAT") idatParts.push(buf.slice(pos + 8, pos + 8 + len));
    if (type === "IEND") break;
    pos += 12 + len;
  }

  // Decompress
  const raw = await new Promise((res, rej) => {
    const inflate = createInflate();
    const chunks = [];
    inflate.on("data", c => chunks.push(c));
    inflate.on("end", () => res(Buffer.concat(chunks)));
    inflate.on("error", rej);
    for (const p of idatParts) inflate.write(p);
    inflate.end();
  });

  // Unfilter scanlines + compute brightness
  const stride = 1 + width * channels; // 1 filter byte + pixel data
  let sum = 0, count = 0;
  const prev = Buffer.alloc(width * channels, 0);
  const cur  = Buffer.alloc(width * channels, 0);

  for (let y = 0; y < height; y++) {
    const filterType = raw[y * stride];
    const row = raw.slice(y * stride + 1, y * stride + 1 + width * channels);

    // Apply PNG filter (sub=1, up=2, avg=3, paeth=4)
    for (let x = 0; x < row.length; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c2 = x >= channels ? prev[x - channels] : 0;
      switch (filterType) {
        case 0: cur[x] = row[x]; break;
        case 1: cur[x] = (row[x] + a) & 0xff; break;
        case 2: cur[x] = (row[x] + b) & 0xff; break;
        case 3: cur[x] = (row[x] + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const p = a + b - c2;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c2);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c2;
          cur[x] = (row[x] + pr) & 0xff;
          break;
        }
      }
    }

    for (let x = 0; x < width; x++) {
      const R = cur[x * channels], G = cur[x * channels + 1], B = cur[x * channels + 2];
      sum += R * 0.299 + G * 0.587 + B * 0.114;
      count++;
    }
    cur.copy(prev);
  }

  return sum / count;
}
