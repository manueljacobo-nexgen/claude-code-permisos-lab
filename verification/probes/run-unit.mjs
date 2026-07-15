/**
 * Ejecuta todas las sondas contra la lógica pura de auditoría (sin DOM).
 * Uso: node verification/probes/run-unit.mjs
 */

import { audit } from '../../app/audit.mjs';
import * as fixtures from '../fixtures.mjs';
import { probes } from './index.mjs';

function runProbe(probe) {
  const raw = fixtures[probe.fixture];
  let settings = null;
  if (raw && typeof raw === 'string') {
    // invalid JSON
    settings = raw;
  } else {
    settings = raw;
  }

  let result;
  if (typeof settings === 'string') {
    result = {
      findings: [{ severity: 'CRITICAL', rule: 'parse-error', detail: `JSON invalido: ${settings}` }],
      summary: { CRITICAL: 1, HIGH: 0, MEDIUM: 0, INFO: 0 },
      hasSettings: false,
      ruleCount: 0,
      hasConflict: false
    };
  } else {
    result = audit(settings);
  }

  const pass =
    JSON.stringify(result.summary) === JSON.stringify(probe.expected.summary) &&
    result.findings.length === probe.expected.totals.findings &&
    result.ruleCount === probe.expected.totals.rules &&
    result.hasSettings === probe.expected.flags.hasSettings &&
    result.hasConflict === probe.expected.flags.hasConflict;

  return { probe, result, pass };
}

const results = probes.map(runProbe);
let failed = 0;
for (const r of results) {
  const icon = r.pass ? '✓' : '✗';
  console.log(`${icon} ${r.probe.name}: ${r.probe.description}`);
  if (!r.pass) {
    failed++;
    console.log('  expected:', JSON.stringify(r.probe.expected));
    console.log('  got     :', JSON.stringify({
      summary: r.result.summary,
      totals: { findings: r.result.findings.length, rules: r.result.ruleCount },
      flags: { hasSettings: r.result.hasSettings, hasConflict: r.result.hasConflict }
    }));
  }
}

console.log(`\n${results.length - failed}/${results.length} sondas pasaron`);
if (failed > 0) process.exit(1);
