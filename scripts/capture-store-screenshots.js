import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const outputDir = path.resolve('store-assets', 'screenshots');
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-compare-chrome-'));

fs.mkdirSync(outputDir, { recursive: true });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeDirWithRetry(dir) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 150 });
      return;
    } catch {
      await delay(250);
    }
  }
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  const found = candidates.find((item) => fs.existsSync(item));
  if (!found) {
    throw new Error('Chrome executable not found. Set CHROME_BIN to run screenshot capture.');
  }
  return found;
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on('error', reject);
  });
}

async function isReachable(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function isJsonCompareApp(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const html = await res.text();
    return html.includes('JSON Compare') && html.includes('/src/main.tsx');
  } catch {
    return false;
  }
}

async function waitForJson(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // Target may still be starting.
    }
    await delay(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isReachable(url)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function ensureAppServer() {
  if (process.env.APP_URL) {
    await waitForHttp(process.env.APP_URL);
    return { appUrl: process.env.APP_URL, server: null };
  }

  const defaultUrl = 'http://127.0.0.1:5173/';
  if (await isJsonCompareApp(defaultUrl)) {
    return { appUrl: defaultUrl, server: null };
  }

  const port = await findFreePort();
  const appUrl = `http://127.0.0.1:${port}/`;
  const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
    stdio: 'ignore',
  });
  await waitForHttp(appUrl);
  if (!(await isJsonCompareApp(appUrl))) {
    throw new Error(`Started server at ${appUrl}, but it is not serving JSON Compare`);
  }
  return { appUrl, server };
}

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }

  close() {
    this.ws.close();
  }
}

async function createPage(remotePort, appUrl) {
  const target = await fetch(
    `http://127.0.0.1:${remotePort}/json/new?${encodeURIComponent(appUrl)}`,
    { method: 'PUT' }
  ).then((res) => res.json());
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send('Page.navigate', { url: appUrl });
  await waitForAppReady(client);
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description;
    throw new Error(description || result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result.value;
}

async function waitForAppReady(client, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await evaluate(client, `
      Boolean(document.querySelector('.app-container') && document.querySelectorAll('button').length > 0)
    `);
    if (ready) return;
    await delay(150);
  }
  throw new Error('Timed out waiting for the React app to render');
}

async function clickButton(client, labels) {
  const list = JSON.stringify(labels);
  await evaluate(client, `
    (() => {
      const labels = ${list};
      const btn = [...document.querySelectorAll('button')]
        .find((item) => labels.some((label) => item.textContent.includes(label)));
      if (!btn) throw new Error('Button not found: ' + labels.join(', '));
      btn.click();
      return true;
    })()
  `);
  await delay(700);
}

async function setLocale(client, locale) {
  await evaluate(client, `
    (() => {
      const select = document.querySelector('.language-select');
      if (!select) throw new Error('Language select not found');
      select.value = '${locale}';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);
  await delay(700);
}

async function loadSample(client) {
  await clickButton(client, ['加载示例', 'Load sample', 'Beispiel laden', 'Charger exemple', 'Загрузить пример']);
}

async function capture(client, filename) {
  await evaluate(client, 'window.scrollTo(0, 0)');
  await delay(250);
  const result = await client.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true,
  });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}

async function withPage(remotePort, appUrl, filename, run) {
  const page = await createPage(remotePort, appUrl);
  try {
    await run(page);
    await capture(page, filename);
  } finally {
    page.close();
  }
}

for (const entry of fs.readdirSync(outputDir)) {
  if (entry.endsWith('.png')) fs.unlinkSync(path.join(outputDir, entry));
}

let chrome;
let devServer;

try {
  const { appUrl, server } = await ensureAppServer();
  devServer = server;

  const remotePort = await findFreePort();
  chrome = spawn(findChrome(), [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${remotePort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,800',
    'about:blank',
  ], { stdio: 'ignore' });

  await waitForJson(`http://127.0.0.1:${remotePort}/json/version`);

  await withPage(remotePort, appUrl, 'screenshot-1-structured-compare.png', async (page) => {
    await loadSample(page);
  });

  await withPage(remotePort, appUrl, 'screenshot-2-multilingual-interface.png', async (page) => {
    await setLocale(page, 'en');
    await loadSample(page);
  });

  await withPage(remotePort, appUrl, 'screenshot-3-ignore-noise-fields.png', async (page) => {
    await setLocale(page, 'en');
    await loadSample(page);
    await evaluate(page, `
      (() => {
        const ignore = [...document.querySelectorAll('button')].find((item) => item.textContent.includes('Ignore'));
        if (!ignore) throw new Error('Ignore button not found');
        ignore.click();
        return true;
      })()
    `);
    await delay(800);
    await evaluate(page, `
      (() => {
        const manage = document.querySelector('.ignore-manage-btn');
        if (!manage) throw new Error('Ignored paths button not found');
        manage.click();
        return true;
      })()
    `);
    await delay(700);
  });

  await withPage(remotePort, appUrl, 'screenshot-4-usage-statistics.png', async (page) => {
    await setLocale(page, 'en');
    await loadSample(page);
    await clickButton(page, ['Usage stats']);
  });

  await withPage(remotePort, appUrl, 'screenshot-5-russian-interface.png', async (page) => {
    await setLocale(page, 'ru');
    await loadSample(page);
  });
} finally {
  if (chrome) chrome.kill('SIGTERM');
  if (devServer) devServer.kill('SIGTERM');
  await removeDirWithRetry(userDataDir);
}
