// Run against a local Vite server: npm run dev -- --host 127.0.0.1 --port 4173
// Pass its displayed URL as the first argument if Vite chooses another port.
// In restricted local QA environments only, --no-sandbox-for-local-qa works
// around Chrome target crashes; never use that option for ordinary browsing.
// Uses an isolated headless Chrome profile and the built-in DevTools Protocol.
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const chromeExecutable = process.env.WHITE_HORSE_CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:4173/white-horse/';
const outputDirectory = await mkdtemp(path.join(tmpdir(), 'white-horse-theme-qa-'));
console.log(`Theme QA artifacts: ${outputDirectory}`);
const profileDirectory = path.join(outputDirectory, 'chrome-profile');
const chrome = spawn(chromeExecutable, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  ...(process.argv.includes('--no-sandbox-for-local-qa') ? ['--no-sandbox'] : []),
  '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profileDirectory}`,
  '--window-size=1440,900', baseUrl
], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
let chromeError = '';
chrome.stderr.on('data', (chunk) => { chromeError += chunk.toString(); });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let websocket;

try {
  let debugPort;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(path.join(profileDirectory, 'DevToolsActivePort'), 'utf8')).trim().split('\n');
      debugPort = Number(port);
      break;
    } catch {
      await delay(100);
    }
  }
  if (!debugPort) throw new Error('Chrome did not expose its DevTools port.');
  let page;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const tabs = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    page = tabs.find((tab) => tab.type === 'page' && tab.url.startsWith(baseUrl));
    if (page) break;
    await delay(100);
  }
  if (!page) throw new Error('The local White Horse page was not opened.');
  websocket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    websocket.addEventListener('open', resolve, { once: true });
    websocket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  websocket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result);
  });
  websocket.addEventListener('close', () => {
    for (const task of pending.values()) task.reject(new Error(`Chrome DevTools disconnected. ${chromeError.slice(-1000)}`));
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`DevTools timed out on ${method}. ${chromeError.slice(-1000)}`)); }, 10_000);
    pending.set(id, { resolve: (result) => { clearTimeout(timeout); resolve(result); }, reject: (error) => { clearTimeout(timeout); reject(error); } });
    websocket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 300; attempt += 1) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Timed out waiting for ${expression}. Page text: ${await evaluate('document.body.innerText.slice(0, 700)')}`);
  };
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const target = path.join(outputDirectory, name);
    await writeFile(target, Buffer.from(result.data, 'base64'));
    return target;
  };

  await waitFor('Boolean(document.querySelector(".login-theme-toggle"))');
  const initialTheme = await evaluate('document.documentElement.dataset.theme');
  if (initialTheme !== 'light') throw new Error(`Expected initial light mode, got ${initialTheme}`);
  const lightLogin = await screenshot('login-light.png');
  await evaluate('document.querySelector(".login-theme-toggle").click()');
  await waitFor('document.documentElement.dataset.theme === "dark"');
  await delay(300);
  const storedDark = await evaluate('localStorage.getItem("white-horse-theme")');
  if (storedDark !== 'dark') throw new Error('The dark-mode choice was not persisted.');
  const darkLogin = await screenshot('login-dark.png');
  await send('Page.reload', { ignoreCache: true });
  await waitFor('document.documentElement.dataset.theme === "dark" && Boolean(document.querySelector(".login-theme-toggle"))');

  await evaluate('sessionStorage.setItem("white-horse-demo-access", "granted")');
  await send('Page.reload', { ignoreCache: true });
  await waitFor('Boolean(document.querySelector(".topbar-right .theme-toggle"))');
  await waitFor('Boolean(document.querySelector(".metric-grid"))');
  const darkWorkspace = await screenshot('workspace-dark.png');
  await evaluate('document.querySelector(".topbar-right .theme-toggle").click()');
  await waitFor('document.documentElement.dataset.theme === "light"');
  await delay(300);
  const lightWorkspace = await screenshot('workspace-light.png');
  await evaluate('document.querySelector(".topbar-right .theme-toggle").click()');
  await waitFor('document.documentElement.dataset.theme === "dark"');
  await evaluate('window.location.hash = "statements"');
  await waitFor('Boolean(document.querySelector(".paper-sheet"))');
  const paperColor = await evaluate('getComputedStyle(document.querySelector(".paper-sheet")).color');
  const paperBackground = await evaluate('getComputedStyle(document.querySelector(".paper-sheet")).backgroundColor');
  if (paperColor !== 'rgb(23, 34, 33)' || paperBackground !== 'rgb(255, 255, 255)') {
    throw new Error(`Statement paper was not light: ${paperColor} on ${paperBackground}`);
  }
  const darkStatement = await screenshot('statement-dark-workspace.png');
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  const printScheme = await evaluate('getComputedStyle(document.documentElement).colorScheme');
  const printBackground = await evaluate('getComputedStyle(document.querySelector(".pdf-page")).backgroundColor');
  if (printScheme !== 'light' || printBackground !== 'rgb(255, 255, 255)') {
    throw new Error(`Print styles were not light: ${printScheme}, ${printBackground}`);
  }
  await send('Emulation.setEmulatedMedia', { media: 'screen' });
  await evaluate('window.location.hash = "trial-balance"');
  await waitFor('Boolean(document.querySelector(".data-table tbody tr"))');
  const darkTrialBalance = await screenshot('trial-balance-dark.png');
  await evaluate('window.location.hash = "notes"');
  await waitFor('Boolean(document.querySelector(".notes-workspace"))');
  const darkNotes = await screenshot('notes-dark.png');
  await evaluate('document.querySelector(".company-switcher").click()');
  await waitFor('Boolean(document.querySelector(".modal[role=dialog]"))');
  const darkModal = await screenshot('modal-dark.png');
  await evaluate('document.querySelector(".modal-header button").click()');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await waitFor('getComputedStyle(document.querySelector(".topbar-right .theme-toggle")).display !== "none"');
  await delay(300);
  const mobileThemeButton = await evaluate('getComputedStyle(document.querySelector(".topbar-right .theme-toggle")).display');
  const mobileWorkspace = await screenshot('workspace-dark-mobile.png');
  await send('Emulation.clearDeviceMetricsOverride');
  console.log(JSON.stringify({ outputDirectory, initialTheme, storedDark, paperColor, paperBackground, mobileThemeButton, printScheme, printBackground, screenshots: [lightLogin, darkLogin, darkWorkspace, lightWorkspace, darkStatement, darkTrialBalance, darkNotes, darkModal, mobileWorkspace] }, null, 2));
} finally {
  websocket?.close();
  chrome.kill();
}
