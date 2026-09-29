import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

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

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunks = [];
  let crcTable;

  function crc32(buf) {
    if (!crcTable) {
      crcTable = [];
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        crcTable[i] = c;
      }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) | 0;
  }

  function pushChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);
    chunks.push(Buffer.concat([len, body, crcBuf]));
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  pushChunk('IHDR', ihdr);
  pushChunk('IDAT', zlib.deflateSync(rawData, { level: 6 }));
  pushChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ...chunks]);
}

function mix(a, b, t) {
  return Math.round(a * (1 - t) + b * t);
}

function inRect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

const assetsDir = path.resolve('store-assets');
fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(path.join(assetsDir, 'screenshots'), { recursive: true });

fs.copyFileSync(path.resolve('public/icons/icon-128.png'), path.join(assetsDir, 'icon-128.png'));

console.log('Generating promo-small-440x280.png...');
fs.writeFileSync(
  path.join(assetsDir, 'promo-small-440x280.png'),
  createPng(440, 280, (x, y, w, h) => {
    const t = (x * 0.7 + y * 0.5) / (w * 0.7 + h * 0.5);
    const bg = [mix(239, 236, t), mix(246, 253, t), mix(255, 245, t), 255];
    if (inRect(x, y, 54, 54, 172, 172)) return [14, 116, 144, 255];
    if (inRect(x, y, 210, 82, 382, 102)) return [15, 23, 42, 255];
    if (inRect(x, y, 210, 126, 360, 138)) return [71, 85, 105, 255];
    if (inRect(x, y, 210, 154, 330, 166)) return [14, 116, 144, 255];
    return bg;
  })
);

console.log('Capturing real 1280x800 extension screenshots...');
execFileSync('node', ['scripts/capture-store-screenshots.js'], { stdio: 'inherit' });

console.log('Store assets successfully generated in store-assets/.');
