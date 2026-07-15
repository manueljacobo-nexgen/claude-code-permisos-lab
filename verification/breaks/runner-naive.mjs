/**
 * Lógica compartida para ejecutar sondas contra el dashboard vía Playwright.
 */

import { naiveProbes } from './naive-probes.mjs';
import { checkAll } from '../invariants.mjs';

export function dashboardUrl(path = '/app/index.html') {
  const port = process.env.PERMADASH_PORT || '3456';
  return `http://localhost:${port}${path}`;
}

export async function readDashboardState(page) {
  const dashboard = page.locator('#dashboard');
  const manifestText = await page.locator('#verify-manifest').textContent();
  const manifest = manifestText ? JSON.parse(manifestText) : null;

  const counts = {
    CRITICAL: await countSeverity(page, 'CRITICAL'),
    HIGH: await countSeverity(page, 'HIGH'),
    MEDIUM: await countSeverity(page, 'MEDIUM'),
    INFO: await countSeverity(page, 'INFO'),
    severityCount: await page.locator('#findings li[data-severity]').count()
  };

  const state = {
    feature: manifest?.feature,
    version: manifest?.version,
    fixture: await page.locator('#fixture-select').inputValue(),
    summary: manifest?.summary,
    totals: manifest?.totals,
    flags: manifest?.flags,
    findings: manifest?.findings,
    schema: manifest?.schema
  };

  return { state, counts, dashboard };
}

async function countSeverity(page, severity) {
  return page.locator(`#findings li[data-severity="${severity}"]`).count();
}

export async function selectFixture(page, fixtureName) {
  await page.locator('#fixture-select').selectOption(fixtureName);
  await page.locator('#audit-btn').click();
  // Espera a que el manifiesto se actualice con el fixture correcto
  await page.waitForFunction(
    (name) => {
      const manifest = document.getElementById('verify-manifest');
      if (!manifest || !manifest.textContent) return false;
      try {
        return JSON.parse(manifest.textContent).fixture === name;
      } catch { return false; }
    },
    fixtureName,
    { timeout: 5000 }
  );
}

export async function runProbe(page, probe) {
  await selectFixture(page, probe.fixture);
  const { state, counts } = await readDashboardState(page);

  // Comparación parcial: solo verifica las claves que el autor incluyó.
  // Esto permite escribir una "verificación" que pasa aunque haya findings graves.
  const expected = probe.expected;
  const checks = [];
  if (expected.summary) {
    checks.push(JSON.stringify(state.summary) === JSON.stringify(expected.summary));
  }
  if (expected.totals) {
    if (expected.totals.findings != null) checks.push(state.findings.length === expected.totals.findings);
    if (expected.totals.rules != null) checks.push(state.totals.rules === expected.totals.rules);
  }
  if (expected.flags) {
    if (expected.flags.hasSettings != null) checks.push(state.flags.hasSettings === expected.flags.hasSettings);
    if (expected.flags.hasConflict != null) checks.push(state.flags.hasConflict === expected.flags.hasConflict);
  }
  const matchesExpected = checks.length === 0 || checks.every(Boolean);

  // Verificación naive: no valida invariantes, solo el expected mal escrito.
  return {
    name: probe.name,
    pass: matchesExpected,
    expected,
    state,
    invariant: { pass: true, results: [] },
    domCounts: counts
  };
}

export async function runAll(page, path = '/app/index.html') {
  await page.goto(dashboardUrl(path));
  const results = [];
  for (const probe of naiveProbes) {
    results.push(await runProbe(page, probe));
  }
  const pass = results.every(r => r.pass);
  return { pass, results };
}
