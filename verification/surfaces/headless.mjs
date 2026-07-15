/**
 * Superficie headless: corre las mismas sondas que el agente pero sin UI.
 * Pensado para CI.
 *
 * Uso:
 *   PERMADASH_PORT=3456 node verification/surfaces/headless.mjs
 * Requiere un servidor estático sirviendo la raíz del repo en el puerto dado.
 */

import { chromium } from '@playwright/test';
import { runAll } from './runner.mjs';

const port = process.env.PERMADASH_PORT || '3456';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

console.log(`Headless: navegando a http://localhost:${port}/app/index.html`);
const { pass, results } = await runAll(page, '/app/index.html');

for (const r of results) {
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

console.log(`\n${pass ? 'TODAS LAS SONDAS PASARON' : 'ALGUNAS SONDAS FALLARON'}`);

await context.close();
await browser.close();

if (!pass) process.exit(1);
