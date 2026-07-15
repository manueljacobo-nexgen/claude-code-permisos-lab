/**
 * CI helper: levanta un servidor estático, ejecuta la verificación headless
 * y cierra el servidor.
 *
 * Uso:
 *   node verification/surfaces/ci.mjs
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { runAll, dashboardUrl } from '../surfaces/runner.mjs';

const PORT = process.env.PERMADASH_PORT || '3456';
const ROOT = process.cwd();

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
  let filePath = path.join(ROOT, rawPath === '/' ? '/app/index-break-missing-attr.html' : rawPath);
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
console.log(`Servidor CI en http://localhost:${PORT}`);

let pass = false;
let browser;
let page;
try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage();
  const result = await runAll(page, '/app/index-break-missing-attr.html');
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
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}

console.log(`\n${pass ? 'CI: TODAS LAS SONDAS PASARON' : 'CI: ALGUNAS SONDAS FALLARON'}`);
process.exit(pass ? 0 : 1);
