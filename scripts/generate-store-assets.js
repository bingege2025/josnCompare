import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';

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

function inRect(x, y, left, top, right, bottom) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function inCircle(x, y, cx, cy, radius) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function mix(a, b, t) {
  return Math.round(a * (1 - t) + b * t);
}

function base(x, y, w, h, palette = 'blue') {
  const t = (x * 0.7 + y * 0.5) / (w * 0.7 + h * 0.5);
  const palettes = {
    blue: [[239, 246, 255], [236, 253, 245]],
    slate: [[248, 250, 252], [230, 244, 255]],
    green: [[240, 253, 244], [239, 246, 255]],
    amber: [[255, 251, 235], [239, 246, 255]],
    violet: [[245, 243, 255], [236, 253, 245]],
  };
  const [from, to] = palettes[palette] || palettes.blue;
  return [
    mix(from[0], to[0], t),
    mix(from[1], to[1], t),
    mix(from[2], to[2], t),
    255,
  ];
}

function shell(x, y, w, h) {
  if (inRect(x, y, 48, 42, w - 48, 116)) return y === 115 ? [226, 232, 240, 255] : [255, 255, 255, 255];
  if (inRect(x, y, 74, 64, 108, 98)) return [14, 116, 144, 255];
  if (inRect(x, y, 126, 69, 270, 77)) return [15, 23, 42, 255];
  if (inRect(x, y, w - 500, 66, w - 380, 92)) return [219, 234, 254, 255];
  if (inRect(x, y, w - 360, 66, w - 240, 92)) return [220, 252, 231, 255];
  if (inRect(x, y, w - 220, 66, w - 84, 92)) return [254, 226, 226, 255];
  return null;
}

function card(x, y, left, top, right, bottom, fill = [255, 255, 255, 255], border = [226, 232, 240, 255]) {
  if (!inRect(x, y, left, top, right, bottom)) return null;
  if (x === left || x === right || y === top || y === bottom) return border;
  return fill;
}

function lineRows(x, y, left, top, widths, color = [148, 163, 184, 255]) {
  for (let i = 0; i < widths.length; i++) {
    const yy = top + i * 22;
    if (inRect(x, y, left, yy, left + widths[i], yy + 6)) return color;
  }
  return null;
}

function screenshotCompare(x, y, w, h) {
  const shellColor = shell(x, y, w, h);
  if (shellColor) return shellColor;

  const leftEditor = card(x, y, 64, 150, 612, 438);
  if (leftEditor) {
    if (inRect(x, y, 64, 150, 612, 192)) return y === 192 ? [226, 232, 240, 255] : [248, 250, 252, 255];
    const row = lineRows(x, y, 96, 224, [240, 180, 320, 220, 280, 150], [71, 85, 105, 255]);
    return row || leftEditor;
  }

  const rightEditor = card(x, y, 668, 150, 1216, 438);
  if (rightEditor) {
    if (inRect(x, y, 668, 150, 1216, 192)) return y === 192 ? [226, 232, 240, 255] : [248, 250, 252, 255];
    const row = lineRows(x, y, 700, 224, [240, 180, 320, 220, 280, 150], [71, 85, 105, 255]);
    if (inRect(x, y, 920, 286, 1070, 302)) return [219, 234, 254, 255];
    return row || rightEditor;
  }

  const table = card(x, y, 64, 480, 1216, 738);
  if (table) {
    if (inRect(x, y, 64, 480, 1216, 528)) return [248, 250, 252, 255];
    const row = Math.floor((y - 528) / 42);
    if (row >= 0) {
      if (row % 4 === 0) return inRect(x, y, 90, 542 + row * 42, 168, 562 + row * 42) ? [16, 185, 129, 255] : [240, 253, 244, 255];
      if (row % 4 === 1) return inRect(x, y, 90, 542 + row * 42, 168, 562 + row * 42) ? [239, 68, 68, 255] : [254, 242, 242, 255];
      if (row % 4 === 2) return inRect(x, y, 90, 542 + row * 42, 168, 562 + row * 42) ? [59, 130, 246, 255] : [239, 246, 255, 255];
    }
    return table;
  }

  return base(x, y, w, h, 'blue');
}

function screenshotLanguages(x, y, w, h) {
  const shellColor = shell(x, y, w, h);
  if (shellColor) return shellColor;

  const panel = card(x, y, 200, 160, 1080, 650);
  if (panel) {
    if (inRect(x, y, 250, 208, 420, 230)) return [15, 23, 42, 255];
    const languages = [
      [300, 300, 450, 360, [219, 234, 254, 255]],
      [480, 300, 630, 360, [220, 252, 231, 255]],
      [660, 300, 810, 360, [254, 243, 199, 255]],
      [840, 300, 990, 360, [237, 233, 254, 255]],
      [480, 400, 800, 470, [255, 255, 255, 255]],
    ];
    for (const [l, t, r, b, c] of languages) {
      const item = card(x, y, l, t, r, b, c, [203, 213, 225, 255]);
      if (item) return item;
    }
    if (inRect(x, y, 390, 535, 890, 548)) return [14, 116, 144, 255];
    if (inRect(x, y, 440, 570, 840, 580)) return [100, 116, 139, 255];
    return panel;
  }

  return base(x, y, w, h, 'violet');
}

function screenshotIgnore(x, y, w, h) {
  const shellColor = shell(x, y, w, h);
  if (shellColor) return shellColor;

  const workspace = card(x, y, 72, 144, 1208, 724);
  if (workspace) {
    if (inRect(x, y, 112, 190, 500, 220)) return [15, 23, 42, 255];
    const drawer = card(x, y, 112, 250, 1168, 340, [248, 250, 252, 255]);
    if (drawer) {
      if (inRect(x, y, 146, 282, 300, 310)) return [226, 232, 240, 255];
      if (inRect(x, y, 330, 282, 505, 310)) return [226, 232, 240, 255];
      if (inRect(x, y, 535, 282, 700, 310)) return [226, 232, 240, 255];
      return drawer;
    }
    for (let i = 0; i < 5; i++) {
      const top = 390 + i * 52;
      const bg = i % 2 === 0 ? [255, 255, 255, 255] : [248, 250, 252, 255];
      const row = card(x, y, 112, top, 1168, top + 42, bg);
      if (row) {
        if (inRect(x, y, 960, top + 10, 1052, top + 32)) return [219, 234, 254, 255];
        if (inRect(x, y, 1066, top + 10, 1142, top + 32)) return [220, 252, 231, 255];
        return row;
      }
    }
    return workspace;
  }

  return base(x, y, w, h, 'green');
}

function screenshotPrivacy(x, y, w, h) {
  const shellColor = shell(x, y, w, h);
  if (shellColor) return shellColor;

  if (inCircle(x, y, 640, 330, 146)) return [14, 116, 144, 255];
  if (inCircle(x, y, 640, 330, 112)) return [255, 255, 255, 255];
  if (inRect(x, y, 595, 290, 625, 386)) return [14, 116, 144, 255];
  if (inRect(x, y, 625, 356, 704, 386)) return [14, 116, 144, 255];
  if (inRect(x, y, 690, 260, 722, 386)) return [14, 116, 144, 255];

  const left = card(x, y, 130, 520, 392, 630, [255, 255, 255, 255]);
  if (left) return inRect(x, y, 168, 552, 340, 565) ? [15, 23, 42, 255] : left;
  const mid = card(x, y, 508, 520, 772, 630, [255, 255, 255, 255]);
  if (mid) return inRect(x, y, 548, 552, 720, 565) ? [15, 23, 42, 255] : mid;
  const right = card(x, y, 888, 520, 1150, 630, [255, 255, 255, 255]);
  if (right) return inRect(x, y, 928, 552, 1100, 565) ? [15, 23, 42, 255] : right;

  return base(x, y, w, h, 'slate');
}

function screenshotStats(x, y, w, h) {
  const shellColor = shell(x, y, w, h);
  if (shellColor) return shellColor;

  const modal = card(x, y, 300, 138, 980, 690);
  if (modal) {
    if (inRect(x, y, 300, 138, 980, 194)) return [248, 250, 252, 255];
    const cards = [
      [330, 230, 470, 320, [239, 246, 255, 255]],
      [490, 230, 630, 320, [240, 253, 244, 255]],
      [650, 230, 790, 320, [248, 250, 252, 255]],
      [810, 230, 950, 320, [255, 251, 235, 255]],
    ];
    for (const [l, t, r, b, c] of cards) {
      const stat = card(x, y, l, t, r, b, c);
      if (stat) return stat;
    }
    const table = card(x, y, 330, 360, 950, 580);
    if (table) {
      if (inRect(x, y, 330, 360, 950, 400)) return [248, 250, 252, 255];
      const row = Math.floor((y - 400) / 36);
      if (row >= 0 && row < 5) return row % 2 === 0 ? [255, 255, 255, 255] : [248, 250, 252, 255];
      return table;
    }
    if (inRect(x, y, 330, 610, 950, 646)) return [236, 253, 245, 255];
    return modal;
  }

  return base(x, y, w, h, 'amber');
}

const assetsDir = path.resolve('store-assets');
const screenshotsDir = path.join(assetsDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

fs.copyFileSync(path.resolve('public/icons/icon-128.png'), path.join(assetsDir, 'icon-128.png'));

console.log('Generating promo-small-440x280.png...');
fs.writeFileSync(
  path.join(assetsDir, 'promo-small-440x280.png'),
  createPng(440, 280, (x, y, w, h) => {
    const bg = base(x, y, w, h, 'blue');
    const icon = card(x, y, 54, 54, 172, 172, [14, 116, 144, 255], [14, 116, 144, 255]);
    if (icon) return icon;
    if (inRect(x, y, 210, 82, 380, 102)) return [15, 23, 42, 255];
    if (inRect(x, y, 210, 126, 360, 138)) return [71, 85, 105, 255];
    if (inRect(x, y, 210, 154, 330, 166)) return [14, 116, 144, 255];
    return bg;
  })
);

console.log('Capturing real 1280x800 extension screenshots...');
execFileSync('node', ['scripts/capture-store-screenshots.js'], { stdio: 'inherit' });

console.log('Store assets successfully generated in store-assets/.');
