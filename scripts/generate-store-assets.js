import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0; // Filter: none

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

const assetsDir = path.resolve('store-assets');
const screenshotsDir = path.join(assetsDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

// 复制 128x128 图标到 store-assets
fs.copyFileSync(
  path.resolve('public/icons/icon-128.png'),
  path.join(assetsDir, 'icon-128.png')
);

// 1. 生成 440x280 小型推广横幅 (Small Promo Tile)
console.log('Generating promo-small-440x280.png...');
const promoPng = createPng(440, 280, (x, y, w, h) => {
  // 优雅的蓝青渐变背景
  const t = (x + y) / (w + h);
  const r = Math.round(30 * (1 - t) + 15 * t);
  const g = Math.round(64 * (1 - t) + 90 * t);
  const b = Math.round(175 * (1 - t) + 220 * t);

  // 中间放一个卡片视觉区域
  if (x >= 40 && x <= 400 && y >= 50 && y <= 230) {
    const isBorder = x === 40 || x === 400 || y === 50 || y === 230;
    if (isBorder) return [255, 255, 255, 180];
    // 卡片内微透深色
    return [255, 255, 255, 240];
  }

  return [r, g, b, 255];
});
fs.writeFileSync(path.join(assetsDir, 'promo-small-440x280.png'), promoPng);

// 2. 生成 1280x800 官方标准截图 1：双栏对比与差异高亮
console.log('Generating screenshot-1-compare-diff.png (1280x800)...');
const screenshot1 = createPng(1280, 800, (x, y) => {
  // 背景 #f8fafc
  if (y < 60) {
    // 顶部 Header 区域
    if (y === 59) return [226, 232, 240, 255]; // 底部线条
    if (x >= 30 && x <= 62 && y >= 14 && y <= 46) {
      // 蓝色 Logo
      return [37, 99, 235, 255];
    }
    return [255, 255, 255, 255];
  }

  // 主编辑区背景
  if (y >= 80 && y <= 380) {
    // 左栏卡片 [30, 625]
    if (x >= 30 && x <= 625) {
      if (y === 80 || y === 380 || x === 30 || x === 625) return [226, 232, 240, 255];
      if (y <= 115) return [248, 250, 252, 255]; // 卡片头
      return [255, 255, 255, 255]; // 编辑器内部
    }
    // 右栏卡片 [655, 1250]
    if (x >= 655 && x <= 1250) {
      if (y === 80 || y === 380 || x === 655 || x === 1250) return [226, 232, 240, 255];
      if (y <= 115) return [248, 250, 252, 255]; // 卡片头
      return [255, 255, 255, 255]; // 编辑器内部
    }
  }

  // 下方差异表格区域 [405, 760]
  if (y >= 405 && y <= 760 && x >= 30 && x <= 1250) {
    if (y === 405 || y === 760 || x === 30 || x === 1250) return [226, 232, 240, 255];
    // 表头
    if (y <= 445) return [248, 250, 252, 255];
    // 模拟斑马线与差异色彩
    const rowIdx = Math.floor((y - 445) / 45);
    if (rowIdx % 4 === 0) {
      // 新增行 (微绿色高亮)
      if (x >= 40 && x <= 120 && (y - 445) % 45 >= 12 && (y - 445) % 45 <= 32) return [16, 185, 129, 255];
      return [240, 253, 244, 255];
    }
    if (rowIdx % 4 === 1) {
      // 删除行 (微红色高亮)
      if (x >= 40 && x <= 120 && (y - 445) % 45 >= 12 && (y - 445) % 45 <= 32) return [239, 68, 68, 255];
      return [254, 242, 242, 255];
    }
    if (rowIdx % 4 === 2) {
      // 值变化 (微蓝色高亮)
      if (x >= 40 && x <= 120 && (y - 445) % 45 >= 12 && (y - 445) % 45 <= 32) return [59, 130, 246, 255];
      return [239, 246, 255, 255];
    }
    return [255, 255, 255, 255];
  }

  return [248, 250, 252, 255];
});
fs.writeFileSync(path.join(screenshotsDir, 'screenshot-1-compare-diff.png'), screenshot1);

// 3. 生成 1280x800 官方标准截图 2：使用频次统计与忽略管理
console.log('Generating screenshot-2-ignore-and-stats.png (1280x800)...');
const screenshot2 = createPng(1280, 800, (x, y) => {
  // 底层虚化背景
  const baseR = 230, baseG = 235, baseB = 245;

  // 居中模态框 [340, 940] x [150, 650]
  if (x >= 340 && x <= 940 && y >= 150 && y <= 650) {
    if (x === 340 || x === 940 || y === 150 || y === 650) return [203, 213, 225, 255];
    // 弹窗头部
    if (y <= 200) return [248, 250, 252, 255];
    // 指标卡片区域 [220, 300]
    if (y >= 220 && y <= 300) {
      if (x >= 360 && x <= 480) return [239, 246, 255, 255]; // 今日卡片
      if (x >= 500 && x <= 620) return [240, 253, 244, 255]; // 累计卡片
      if (x >= 640 && x <= 760) return [248, 250, 252, 255]; // 打开卡片
      if (x >= 780 && x <= 900) return [248, 250, 252, 255]; // 活跃卡片
    }
    return [255, 255, 255, 255];
  }

  return [baseR, baseG, baseB, 255];
});
fs.writeFileSync(path.join(screenshotsDir, 'screenshot-2-ignore-and-stats.png'), screenshot2);

console.log('Store assets successfully generated in store-assets/');
