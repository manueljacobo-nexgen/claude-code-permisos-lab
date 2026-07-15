/**
 * Superficie agente: corre las sondas contra el dashboard con Playwright.
 * Levanta un servidor estático, graba video de la sesión y ejecuta las
 * mismas sondas que headless y la superficie humana.
 *
 * Uso:
 *   node verification/surfaces/agent.mjs
 * Video de salida: docs/evidencia/agent-video/
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { runAll } from './runner.mjs';

const PORT = process.env.PERMADASH_PORT || '3456';
const ROOT = process.cwd();
const videoDir = process.env.PERMADASH_VIDEO_DIR || 'docs/evidencia/agent-video';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const rawPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, rawPath === '/' ? '/app/index.html' : rawPath);
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath);
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

await new Promise(resolve => server.listen(PORT, resolve));
console.log(`Servidor agente en http://localhost:${PORT}`);

async function launchBrowser() {
  const options = [
    { headless: false },
    { headless: true }
  ];
  let lastErr;
  for (const opt of options) {
    try {
      const browser = await chromium.launch(opt);
      console.log(`Navegador lanzado headless=${opt.headless}`);
      return browser;
    } catch (err) {
      lastErr = err;
      console.log(`No se pudo lanzar con headless=${opt.headless}: ${err.message}`);
    }
  }
  throw lastErr;
}

let browser;
let context;
let page;
let pass = false;
try {
  browser = await launchBrowser();
  context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1280, height: 900 } }
  });
  page = await context.newPage();

  console.log(`Agente: navegando a http://localhost:${PORT}/app/index.html`);
  const result = await runAll(page, '/app/index.html');
  pass = result.pass;

  for (const r of result.results) {
    const icon = r.pass ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    if (!r.pass) {
      console.log('  expected:', JSON.stringify(r.expected));
      console.log('  state  :', JSON.stringify({
        summary: r.state.summary,
        totals: r.state.totals,
        flags: r.state.flags
      }));
      console.log('  invariants:', JSON.stringify(r.invariant.results.filter(i => !i.pass)));
    }
  }
} finally {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

console.log(`\n${pass ? 'AGENTE: TODAS LAS SONDAS PASARON' : 'AGENTE: ALGUNAS SONDAS FALLARON'}`);
console.log(`Video guardado en ${videoDir}/`);
if (!pass) process.exit(1);
