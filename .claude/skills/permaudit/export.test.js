#!/usr/bin/env node
// Self-check de export.js — node export.test.js. Sin dependencias npm.
const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EXPORT = path.join(__dirname, 'export.js');

function makeFixture(settings) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'permaudit-export-'));
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify(settings, null, 2));
  return dir;
}

function runExport(args) {
  return spawnSync(process.execPath, [EXPORT, ...args], { encoding: 'utf8' });
}

const fixtures = [];
try {
  const rmAllow = makeFixture({ permissions: { allow: ['Bash(rm -rf *)'], ask: [], deny: [] } });
  fixtures.push(rmAllow);

  // 1. md con hallazgos reales (CRITICAL por rm en allow).
  {
    const res = runExport([rmAllow, '--format=md', '--min-severity=INFO']);
    assert.strictEqual(res.status, 0, 'md con hallazgos: exit 0');
    assert.ok(res.stdout.includes('| CRITICAL |'), 'md con hallazgos: tabla incluye fila CRITICAL');
    assert.ok(res.stdout.includes('destructive-allow'), 'md con hallazgos: incluye la regla');
  }

  // 2. csv con el mismo fixture.
  {
    const res = runExport([rmAllow, '--format=csv', '--min-severity=INFO']);
    assert.strictEqual(res.status, 0, 'csv con hallazgos: exit 0');
    assert.ok(res.stdout.includes('severity,rule,detail'), 'csv: header presente');
    assert.ok(res.stdout.includes('CRITICAL,destructive-allow'), 'csv: fila esperada presente');
  }

  const clean = makeFixture({
    permissions: {
      allow: ['Bash(npm run test)'],
      ask: ['Bash(rm *)'],
      deny: ['Bash(git push *)', 'Edit(package.json)'],
    },
  });
  fixtures.push(clean);

  // 3. --min-severity=CRITICAL sobre fixture limpio -> vacio, exit 0.
  {
    const res = runExport([clean, '--format=md', '--min-severity=CRITICAL']);
    assert.strictEqual(res.status, 0, 'estado vacio: exit 0');
    assert.ok(res.stdout.includes('Sin hallazgos que superen'), 'estado vacio: mensaje presente');
    assert.ok(!res.stdout.includes('|---|---|---|'), 'estado vacio: sin tabla de filas');
  }

  // 4. --format invalido -> exit 2, stdout vacio.
  {
    const res = runExport([clean, '--format=xml']);
    assert.strictEqual(res.status, 2, 'formato invalido: exit 2');
    assert.strictEqual(res.stdout, '', 'formato invalido: stdout vacio');
    assert.ok(res.stderr.includes('--format invalido'), 'formato invalido: mensaje en stderr');
  }

  // 5. detail con pipe (regla con "|") no rompe la tabla markdown.
  const pipeRule = makeFixture({ permissions: { allow: ['Bash(rm -rf * | tee log)'], ask: [], deny: [] } });
  fixtures.push(pipeRule);
  {
    const res = runExport([pipeRule, '--format=md', '--min-severity=INFO']);
    assert.strictEqual(res.status, 0, 'detail con pipe: exit 0');
    assert.ok(res.stdout.includes('\\|'), 'detail con pipe: se escapa como \\|');
    const rows = res.stdout.split('\n').filter((l) => l.startsWith('| CRITICAL'));
    assert.strictEqual(rows.length, 1, 'detail con pipe: sigue siendo una sola fila de tabla');
  }

  // 6. detail con newline embebido no rompe el registro CSV.
  const newlineRule = makeFixture({ permissions: { allow: ['Bash(rm -rf *)\nBash(sudo x)'], ask: [], deny: [] } });
  fixtures.push(newlineRule);
  {
    const res = runExport([newlineRule, '--format=csv', '--min-severity=INFO']);
    assert.strictEqual(res.status, 0, 'detail con newline: exit 0');
    const dataLines = res.stdout.trim().split('\n');
    assert.strictEqual(dataLines[0], 'severity,rule,detail', 'detail con newline: header intacto');
    assert.ok(dataLines[1].startsWith('CRITICAL,destructive-allow,"'), 'detail con newline: campo quedo entre comillas');
  }

  // 7. Resumen refleja solo lo filtrado, no los totales sin filtrar.
  const mixed = makeFixture({ permissions: { allow: ['Bash(sudo x)'], ask: [], deny: [] } });
  fixtures.push(mixed);
  {
    const res = runExport([mixed, '--format=md', '--min-severity=HIGH']);
    assert.strictEqual(res.status, 0, 'resumen filtrado: exit 0');
    assert.ok(!res.stdout.includes('| MEDIUM |'), 'resumen filtrado: tabla no incluye MEDIUM (filtrado por HIGH)');
    assert.ok(res.stdout.includes('0 MEDIUM, 0 INFO'), 'resumen filtrado: conteo de MEDIUM/INFO en 0, no el total real del repo');
  }

  console.log('OK');
} finally {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
}
