#!/usr/bin/env node
// Self-check de audit.js — node test.js. Sin dependencias npm.
const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const AUDIT = path.join(__dirname, 'audit.js');

function makeFixture(settings) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'permaudit-'));
  if (settings !== null) {
    fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify(settings, null, 2));
  }
  return dir;
}

function runAudit(dir) {
  const res = spawnSync(process.execPath, [AUDIT, dir], { encoding: 'utf8' });
  let out;
  try {
    out = JSON.parse(res.stdout);
  } catch (e) {
    throw new Error(`salida no es JSON valido para ${dir}: ${res.stdout}\nstderr: ${res.stderr}`);
  }
  return { status: res.status, out };
}

const fixtures = [];
try {
  // 1. Limpio (como este repo): rm en ask, git push y package.json en deny.
  const clean = makeFixture({
    permissions: {
      allow: ['Bash(npm run test)'],
      ask: ['Bash(rm *)'],
      deny: ['Bash(git push *)', 'Edit(package.json)'],
    },
  });
  fixtures.push(clean);
  {
    const { status, out } = runAudit(clean);
    assert.strictEqual(status, 0, 'fixture limpio: exit code debe ser 0');
    assert.strictEqual(out.summary.critical, 0, 'fixture limpio: 0 CRITICAL');
    assert.strictEqual(out.summary.high, 0, 'fixture limpio: 0 HIGH');
    assert.strictEqual(out.summary.medium, 0, 'fixture limpio: 0 MEDIUM (rm esta en ask)');
    assert.ok(Array.isArray(out.findings), 'fixture limpio: findings es array');
  }

  // 2. rm en allow: CRITICAL, exit 1.
  const rmAllow = makeFixture({
    permissions: {
      allow: ['Bash(rm -rf *)'],
      ask: [],
      deny: [],
    },
  });
  fixtures.push(rmAllow);
  {
    const { status, out } = runAudit(rmAllow);
    assert.strictEqual(status, 1, 'fixture rm-en-allow: exit code debe ser 1');
    assert.ok(out.summary.critical >= 1, 'fixture rm-en-allow: al menos 1 CRITICAL');
    assert.ok(
      out.findings.some((f) => f.severity === 'CRITICAL'),
      'fixture rm-en-allow: hay finding CRITICAL'
    );
  }

  // 3. Sin settings.json: finding HIGH "sin configuracion de permisos", exit 0.
  const noSettings = makeFixture(null);
  fixtures.push(noSettings);
  {
    const { status, out } = runAudit(noSettings);
    assert.strictEqual(status, 0, 'fixture sin-settings: exit code debe ser 0');
    assert.strictEqual(out.summary.critical, 0, 'fixture sin-settings: 0 CRITICAL');
    assert.ok(out.summary.high >= 1, 'fixture sin-settings: al menos 1 HIGH');
    assert.ok(
      out.findings.some((f) => f.severity === 'HIGH'),
      'fixture sin-settings: hay finding HIGH'
    );
  }

  // 4. entrada no-string en allow (ej. numero por error de tipeo en settings.json)
  //    no debe crashear audit.js con TypeError; debe tratarse como texto inofensivo.
  const nonString = makeFixture({ permissions: { allow: [123], ask: [], deny: [] } });
  fixtures.push(nonString);
  {
    const { status, out } = runAudit(nonString);
    assert.notStrictEqual(status, null, 'entrada no-string: audit.js no debe crashear (status null = proceso murio)');
    assert.ok(Array.isArray(out.findings), 'entrada no-string: sigue devolviendo JSON valido con findings');
  }

  console.log('OK');
} finally {
  for (const dir of fixtures) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
