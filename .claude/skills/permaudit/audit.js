#!/usr/bin/env node
// permaudit audit.js — audita <repo>/.claude/settings.json. Node puro, sin dependencias.
'use strict';

const fs = require('fs');
const path = require('path');

const repo = process.argv[2] || '.';
const settingsPath = path.join(repo, '.claude', 'settings.json');

const findings = [];
const add = (severity, rule, detail) => findings.push({ severity, rule, detail });

function report() {
  const summary = { critical: 0, high: 0, medium: 0, info: 0 };
  for (const f of findings) summary[f.severity.toLowerCase()]++;
  process.stdout.write(JSON.stringify({ findings, summary }, null, 2) + '\n');
  process.exit(summary.critical > 0 ? 1 : 0);
}

if (!fs.existsSync(settingsPath)) {
  add('HIGH', 'no-settings', 'sin configuracion de permisos: no existe ' + settingsPath);
  report();
}

let settings;
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
} catch (e) {
  add('HIGH', 'invalid-settings', 'settings.json ilegible: ' + e.message);
  report();
}

const perms = (settings && settings.permissions) || {};
const allow = perms.allow || [];
const ask = perms.ask || [];
const deny = perms.deny || [];

// CRITICAL: patron destructivo en allow
const destructive = [
  { name: 'rm', re: /\brm\b/ },
  { name: 'sudo', re: /\bsudo\b/ },
  { name: 'dd', re: /\bdd\b/ },
  { name: 'mkfs', re: /\bmkfs\b/ },
  { name: '> /dev/', re: /> \/dev\// },
];
for (const rule of allow) {
  for (const d of destructive) {
    if (d.re.test(rule)) {
      add('CRITICAL', 'destructive-allow', 'patron destructivo "' + d.name + '" en allow: ' + rule);
    }
  }
}

// CRITICAL: git push en allow
for (const rule of allow) {
  if (rule.includes('git push')) {
    add('CRITICAL', 'git-push-allow', '"git push" presente en allow: ' + rule);
  }
}

// HIGH: wildcard total en allow
for (const rule of allow) {
  const r = rule.trim();
  if (r === '*' || r === 'Bash(*)' || r === 'Bash(* *)') {
    add('HIGH', 'wildcard-allow', 'wildcard total en allow: ' + rule);
  }
}

// HIGH: falta deny para git push / archivos criticos
if (!deny.some((r) => r.includes('git push'))) {
  add('HIGH', 'missing-deny-git-push', 'no existe regla deny para "git push"');
}
if (!deny.some((r) => r.includes('package.json') || r.includes('.env'))) {
  add('HIGH', 'missing-deny-critical-files', 'no existe regla deny para archivos criticos (package.json, .env)');
}

// MEDIUM: rm sin restringir
const hasRm = (list) => list.some((r) => /\brm\b/.test(r));
if (!hasRm(ask) && !hasRm(deny)) {
  add('MEDIUM', 'rm-unrestricted', '"rm" no esta en ask ni en deny');
}

// INFO: conteo de reglas por lista
add('INFO', 'rule-count', 'allow=' + allow.length + ', ask=' + ask.length + ', deny=' + deny.length);

report();
