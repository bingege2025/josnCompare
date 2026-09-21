import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0;

    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 4;
      const corner = (x === 0 || x === width - 1) && (y === 0 || y === height - 1);
      const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;

      if (corner && width > 16) {
        rawData[pixelStart] = 0;
        rawData[pixelStart + 1] = 0;
        rawData[pixelStart + 2] = 0;
        rawData[pixelStart + 3] = 0;
      } else if (isBorder) {
        rawData[pixelStart] = Math.max(0, r - 30);
        rawData[pixelStart + 1] = Math.max(0, g - 30);
        rawData[pixelStart + 2] = Math.max(0, b - 30);
        rawData[pixelStart + 3] = 255;
      } else {
        rawData[pixelStart] = r;
        rawData[pixelStart + 1] = g;
        rawData[pixelStart + 2] = b;
        rawData[pixelStart + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
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

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.resolve('public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'icon-16.png'), createPng(16, 16, 37, 99, 235));
fs.writeFileSync(path.join(iconsDir, 'icon-48.png'), createPng(48, 48, 37, 99, 235));
fs.writeFileSync(path.join(iconsDir, 'icon-128.png'), createPng(128, 128, 37, 99, 235));

console.log('Successfully created public/icons PNG files.');
