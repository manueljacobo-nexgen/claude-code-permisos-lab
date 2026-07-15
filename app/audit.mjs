/**
 * Lógica de auditoría de permisos de Claude Code.
 * Implementación pura en JS; sin dependencias externas.
 */

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];

const DESTRUCTIVE_PATTERNS = [/\brm\b/, /\bsudo\b/, /\bdd\b/, /\bmkfs\b/, />\s*\/dev\//];
const CRITICAL_FILES = ['package.json', '.env'];

function isDestructive(rule) {
  return DESTRUCTIVE_PATTERNS.some(p => p.test(rule));
}

function isWildcard(rule) {
  return rule === '*' || /^Bash\(\s*\*\s*\)$/.test(rule) || /^Bash\(\s*\*\s+.*\)$/.test(rule);
}

function normalizeRule(rule) {
  return rule.trim();
}

export function audit(settings) {
  const findings = [];

  if (!settings || typeof settings !== 'object') {
    findings.push({
      severity: 'HIGH',
      rule: 'settings.json',
      detail: 'No existe configuración de permisos (.claude/settings.json).'
    });
    return {
      findings,
      summary: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, INFO: 0 },
      hasSettings: false,
      ruleCount: 0,
      hasConflict: false
    };
  }

  const allow = Array.isArray(settings.allow) ? settings.allow.map(normalizeRule) : [];
  const ask = Array.isArray(settings.ask) ? settings.ask.map(normalizeRule) : [];
  const deny = Array.isArray(settings.deny) ? settings.deny.map(normalizeRule) : [];

  const ruleCount = allow.length + ask.length + deny.length;

  // CRITICAL: patron destructivo en allow
  allow.forEach(rule => {
    if (isDestructive(rule)) {
      findings.push({
        severity: 'CRITICAL',
        rule,
        detail: `Regla destructiva en allow: "${rule}" permite ejecutar comandos destructivos.`
      });
    }
  });

  // CRITICAL: git push en allow
  allow.forEach(rule => {
    if (/git push/.test(rule)) {
      findings.push({
        severity: 'CRITICAL',
        rule,
        detail: `Regla en allow permite push no deseado: "${rule}".`
      });
    }
  });

  // CRITICAL: conflicto allow && deny
  const conflicts = allow.filter(rule => deny.includes(rule));
  conflicts.forEach(rule => {
    findings.push({
      severity: 'CRITICAL',
      rule,
      detail: `Regla contradictoria: "${rule}" está en allow y en deny.`
    });
  });

  // HIGH: wildcard total en allow
  allow.forEach(rule => {
    if (isWildcard(rule)) {
      findings.push({
        severity: 'HIGH',
        rule,
        detail: `Wildcard total en allow: "${rule}" otorga permisos ilimitados.`
      });
    }
  });

  // HIGH: no existe deny para git push ni archivos críticos
  const hasDenyGitPush = deny.some(rule => /git push/.test(rule));
  if (!hasDenyGitPush) {
    findings.push({
      severity: 'HIGH',
      rule: 'git push',
      detail: 'No existe regla deny para "git push".'
    });
  }
  CRITICAL_FILES.forEach(file => {
    const hasDenyFile = deny.some(rule => rule.includes(file));
    if (!hasDenyFile) {
      findings.push({
        severity: 'HIGH',
        rule: file,
        detail: `No existe regla deny para archivo crítico "${file}".`
      });
    }
  });

  // MEDIUM: rm no está en ask ni deny
  const rmHandled = ask.some(rule => /\brm\b/.test(rule)) || deny.some(rule => /\brm\b/.test(rule));
  if (!rmHandled) {
    findings.push({
      severity: 'MEDIUM',
      rule: 'rm',
      detail: 'La regla "rm" no está en ask ni en deny.'
    });
  }

  // INFO: conteo de reglas por lista
  findings.push({
    severity: 'INFO',
    rule: 'resumen',
    detail: `Reglas cargadas: ${allow.length} allow, ${ask.length} ask, ${deny.length} deny.`
  });

  const summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, INFO: 0 };
  findings.forEach(f => { summary[f.severity]++; });

  return {
    findings,
    summary,
    hasSettings: true,
    ruleCount,
    hasConflict: conflicts.length > 0
  };
}
