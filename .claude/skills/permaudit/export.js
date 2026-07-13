#!/usr/bin/env node
// permaudit export.js — exporta los findings de audit.js a Markdown o CSV. Node puro, sin dependencias.
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

// ponytail: duplica el orden de severidad de audit.js; si audit.js agrega una
// severidad nueva, actualizar tambien este array o quedara fuera del filtro.
const SEVERITY_ORDER = ['INFO', 'MEDIUM', 'HIGH', 'CRITICAL'];
const FORMATS = ['md', 'csv', 'json'];

const positional = [];
let format = 'md';
let minSeverity = 'INFO';

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--format=')) format = arg.slice('--format='.length);
  else if (arg.startsWith('--min-severity=')) minSeverity = arg.slice('--min-severity='.length).toUpperCase();
  else positional.push(arg);
}
const repo = positional[0] || '.';

if (!FORMATS.includes(format)) {
  process.stderr.write(`--format invalido: "${format}". Valores validos: ${FORMATS.join(', ')}\n`);
  process.exit(2);
}
if (!SEVERITY_ORDER.includes(minSeverity)) {
  process.stderr.write(`--min-severity invalido: "${minSeverity}". Valores validos: ${SEVERITY_ORDER.join(', ')}\n`);
  process.exit(2);
}

const auditPath = path.join(__dirname, 'audit.js');
const res = spawnSync(process.execPath, [auditPath, repo], { encoding: 'utf8' });
let parsed;
try {
  if (!res.stdout) throw new Error(res.error ? res.error.message : `audit.js sin salida (exit ${res.status})`);
  parsed = JSON.parse(res.stdout);
} catch (e) {
  process.stderr.write(`audit.js no devolvio JSON valido: ${e.message}\n${res.stderr || ''}\n`);
  process.exit(2);
}

const minIndex = SEVERITY_ORDER.indexOf(minSeverity);
const filtered = parsed.findings.filter((f) => SEVERITY_ORDER.indexOf(f.severity) >= minIndex);

function csvField(value) {
  const s = String(value);
  return /["\n,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function mdCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function toMarkdown() {
  const lines = [`# Auditoría de permisos — ${repo}`, ''];
  if (filtered.length === 0) {
    lines.push(`Sin hallazgos que superen la severidad mínima solicitada (${minSeverity}).`);
  } else {
    lines.push('| Severidad | Regla | Detalle |', '|---|---|---|');
    for (const f of filtered) lines.push(`| ${mdCell(f.severity)} | ${mdCell(f.rule)} | ${mdCell(f.detail)} |`);
  }
  const s = { critical: 0, high: 0, medium: 0, info: 0 };
  for (const f of filtered) s[f.severity.toLowerCase()]++;
  lines.push('', `Resumen (filtrado por --min-severity=${minSeverity}): ${s.critical} CRITICAL, ${s.high} HIGH, ${s.medium} MEDIUM, ${s.info} INFO.`);
  return lines.join('\n') + '\n';
}

function toCsv() {
  const lines = ['severity,rule,detail'];
  for (const f of filtered) lines.push([csvField(f.severity), csvField(f.rule), csvField(f.detail)].join(','));
  return lines.join('\n') + '\n';
}

function toJson() {
  const s = { critical: 0, high: 0, medium: 0, info: 0 };
  for (const f of filtered) s[f.severity.toLowerCase()]++;
  return JSON.stringify({ findings: filtered, summary: s }, null, 2) + '\n';
}

const OUTPUT = { csv: toCsv, json: toJson };
process.stdout.write((OUTPUT[format] || toMarkdown)());
process.exit(0);
