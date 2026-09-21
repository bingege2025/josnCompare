import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0;

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 4;
      const [r, g, b, a = 255] = drawPixel(x, y, width, height);
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
      rawData[pixelStart + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  let crcTable;
  function crc32(buf) {
    if (!crcTable) {
      crcTable = [];
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) | 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a, b, t) {
  return Math.round(a * (1 - t) + b * t);
}

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function insideCircle(x, y, cx, cy, radius) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function drawLogoPixel(x, y, width, height) {
  const s = width;
  const nx = x / s;
  const ny = y / s;

  const cardLeft = 0.04 * s;
  const cardTop = 0.04 * s;
  const cardRight = 0.96 * s;
  const cardBottom = 0.96 * s;
  const radius = 0.2 * s;

  if (!insideRoundedRect(x, y, cardLeft, cardTop, cardRight, cardBottom, radius)) {
    return [0, 0, 0, 0];
  }

  const bgT = Math.min(1, Math.max(0, (nx * 0.72 + ny * 0.48)));
  let r = mix(20, 13, bgT);
  let g = mix(101, 148, bgT);
  let b = mix(242, 196, bgT);

  // Subtle lower-right depth.
  if (nx > 0.62 && ny > 0.56) {
    r = mix(r, 7, 0.18);
    g = mix(g, 89, 0.18);
    b = mix(b, 133, 0.18);
  }

  // Two translucent JSON panes.
  const paneTop = 0.24 * s;
  const paneBottom = 0.74 * s;
  const leftPane = insideRoundedRect(x, y, 0.18 * s, paneTop, 0.46 * s, paneBottom, 0.06 * s);
  const rightPane = insideRoundedRect(x, y, 0.54 * s, paneTop, 0.82 * s, paneBottom, 0.06 * s);
  if (leftPane || rightPane) {
    r = mix(r, 255, 0.18);
    g = mix(g, 255, 0.18);
    b = mix(b, 255, 0.18);
  }

  // Center split line.
  if (Math.abs(nx - 0.5) < 0.018 && ny > 0.2 && ny < 0.8) {
    r = 226;
    g = 232;
    b = 240;
  }

  const white = [255, 255, 255, 255];
  const stroke = width <= 16 ? 0.105 : 0.07;

  // Left brace: { made from compact geometric strokes.
  const leftBrace =
    (nx > 0.235 && nx < 0.37 && ny > 0.255 && ny < 0.255 + stroke) ||
    (nx > 0.185 && nx < 0.285 && ny > 0.45 && ny < 0.45 + stroke) ||
    (nx > 0.235 && nx < 0.37 && ny > 0.67 && ny < 0.67 + stroke) ||
    (nx > 0.215 && nx < 0.285 && ny > 0.29 && ny < 0.47) ||
    (nx > 0.215 && nx < 0.285 && ny > 0.53 && ny < 0.7);

  // Right brace: }.
  const rightBrace =
    (nx > 0.63 && nx < 0.765 && ny > 0.255 && ny < 0.255 + stroke) ||
    (nx > 0.715 && nx < 0.815 && ny > 0.45 && ny < 0.45 + stroke) ||
    (nx > 0.63 && nx < 0.765 && ny > 0.67 && ny < 0.67 + stroke) ||
    (nx > 0.715 && nx < 0.785 && ny > 0.29 && ny < 0.47) ||
    (nx > 0.715 && nx < 0.785 && ny > 0.53 && ny < 0.7);

  if (leftBrace || rightBrace) return white;

  // Difference markers, visible on 48/128 and simplified at 16.
  if (width > 16) {
    if (insideCircle(x, y, 0.34 * s, 0.35 * s, 0.055 * s)) return [16, 185, 129, 255];
    if (insideCircle(x, y, 0.66 * s, 0.64 * s, 0.055 * s)) return [239, 68, 68, 255];

    if (nx > 0.315 && nx < 0.365 && ny > 0.343 && ny < 0.357) return white;
    if (nx > 0.343 && nx < 0.357 && ny > 0.315 && ny < 0.365) return white;
    if (nx > 0.638 && nx < 0.682 && ny > 0.633 && ny < 0.647) return white;
  }

  return [r, g, b, 255];
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  fs.writeFileSync(
    path.join(iconsDir, `icon-${size}.png`),
    createPng(size, size, drawLogoPixel)
  );
}

console.log('Successfully created JSON Compare logo icons in public/icons.');
