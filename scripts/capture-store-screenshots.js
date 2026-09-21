import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const remotePort = 9333;
const appUrl = process.env.APP_URL || 'http://127.0.0.1:5173/';
const outputDir = path.resolve('store-assets', 'screenshots');
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-compare-chrome-'));

fs.mkdirSync(outputDir, { recursive: true });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJson(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // Chrome may still be starting.
    }
    await delay(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
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

async function createPage() {
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
  await delay(900);
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result.value;
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

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${remotePort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,800',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await waitForJson(`http://127.0.0.1:${remotePort}/json/version`);

    let page = await createPage();
    await loadSample(page);
    await capture(page, 'screenshot-1-structured-compare.png');
    page.close();

    page = await createPage();
    await setLocale(page, 'en');
    await loadSample(page);
    await capture(page, 'screenshot-2-multilingual-interface.png');
    page.close();

    page = await createPage();
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
    await capture(page, 'screenshot-3-ignore-noise-fields.png');
    page.close();

    page = await createPage();
    await setLocale(page, 'en');
    await loadSample(page);
    await clickButton(page, ['Usage stats']);
    await capture(page, 'screenshot-4-usage-statistics.png');
    page.close();

    page = await createPage();
    await setLocale(page, 'ru');
    await loadSample(page);
    await capture(page, 'screenshot-5-russian-interface.png');
    page.close();
  } finally {
    chrome.kill('SIGTERM');
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
