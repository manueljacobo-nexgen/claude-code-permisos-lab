/**
 * Lógica compartida para ejecutar sondas contra el dashboard vía Playwright.
 */

import { probes } from '../probes/index.mjs';
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

  const attrs = {
    'data-verify': await dashboard.getAttribute('data-verify'),
    'data-total-critical': await dashboard.getAttribute('data-total-critical'),
    'data-total-high': await dashboard.getAttribute('data-total-high'),
    'data-total-medium': await dashboard.getAttribute('data-total-medium'),
    'data-total-info': await dashboard.getAttribute('data-total-info'),
    'data-total-findings': await dashboard.getAttribute('data-total-findings'),
    'data-rule-count': await dashboard.getAttribute('data-rule-count'),
    'data-has-settings': await dashboard.getAttribute('data-has-settings'),
    'data-has-conflict': await dashboard.getAttribute('data-has-conflict')
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

  return { state, counts, attrs, dashboard };
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
  const { state, counts, attrs } = await readDashboardState(page);

  const expected = probe.expected;
  const matchesExpected =
    JSON.stringify(state.summary) === JSON.stringify(expected.summary) &&
    state.findings.length === expected.totals.findings &&
    state.totals.rules === expected.totals.rules &&
    state.flags.hasSettings === expected.flags.hasSettings &&
    state.flags.hasConflict === expected.flags.hasConflict;

  const invariant = checkAll(state, counts, attrs);

  return {
    name: probe.name,
    pass: matchesExpected && invariant.pass,
    expected,
    state,
    attrs,
    invariant,
    domCounts: counts
  };
}

export async function runAll(page, path = '/app/index.html') {
  await page.goto(dashboardUrl(path));
  const results = [];
  for (const probe of probes) {
    results.push(await runProbe(page, probe));
  }
  const pass = results.every(r => r.pass);
  return { pass, results };
}
