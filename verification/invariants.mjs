/**
 * Invariantes que siempre deben sostenerse en el dashboard.
 * Funciones puras: reciben un estado derivado del DOM o del manifiesto.
 */

export function invariantTotalsMatch(state) {
  const sum = state.summary.CRITICAL + state.summary.HIGH + state.summary.MEDIUM + state.summary.INFO;
  return {
    name: 'totals-match',
    pass: sum === state.findings.length && state.totals.findings === state.findings.length,
    expected: state.findings.length,
    got: sum
  };
}

export function invariantFindingsRendered(state, domCounts) {
  return {
    name: 'findings-rendered',
    pass: domCounts.severityCount === state.findings.length &&
          domCounts.severityCount === state.totals.findings,
    expected: state.totals.findings,
    got: domCounts.severityCount
  };
}

export function invariantMissingSettings(state) {
  if (state.flags.hasSettings) return { name: 'missing-settings', pass: true };
  const oneFinding = state.findings.length === 1;
  return {
    name: 'missing-settings',
    pass: oneFinding,
    expected: 'exactly 1 finding when settings are missing/invalid',
    got: `${state.findings.length} findings`
  };
}

export function invariantConflictImpliesCritical(state) {
  if (!state.flags.hasConflict) return { name: 'conflict-implies-critical', pass: true };
  const hasCritical = state.summary.CRITICAL > 0;
  return {
    name: 'conflict-implies-critical',
    pass: hasCritical,
    expected: 'at least 1 CRITICAL',
    got: `${state.summary.CRITICAL} CRITICAL`
  };
}

export function invariantNoHiddenSeverities(state, domCounts) {
  const ok =
    domCounts.CRITICAL === state.summary.CRITICAL &&
    domCounts.HIGH === state.summary.HIGH &&
    domCounts.MEDIUM === state.summary.MEDIUM &&
    domCounts.INFO === state.summary.INFO;
  return {
    name: 'no-hidden-severities',
    pass: ok,
    expected: state.summary,
    got: domCounts
  };
}

export function invariantSchema(state) {
  const required = [
    'feature', 'version', 'fixture', 'summary', 'totals', 'flags', 'findings', 'schema'
  ];
  const missing = required.filter(k => !(k in state));
  return {
    name: 'schema',
    pass: missing.length === 0 && state.schema === 'permaudit-dashboard-v1',
    expected: required,
    got: missing
  };
}

export function invariantDomAttrsMatch(state, attrs) {
  const checks = [
    { k: 'data-verify', expected: 'permaudit-dashboard' },
    { k: 'data-total-critical', expected: String(state.summary.CRITICAL) },
    { k: 'data-total-high', expected: String(state.summary.HIGH) },
    { k: 'data-total-medium', expected: String(state.summary.MEDIUM) },
    { k: 'data-total-info', expected: String(state.summary.INFO) },
    { k: 'data-total-findings', expected: String(state.findings.length) },
    { k: 'data-rule-count', expected: String(state.totals.rules) },
    { k: 'data-has-settings', expected: String(state.flags.hasSettings) },
    { k: 'data-has-conflict', expected: String(state.flags.hasConflict) }
  ];
  const failed = checks.filter(c => attrs[c.k] !== c.expected);
  return {
    name: 'dom-attrs-match',
    pass: failed.length === 0,
    expected: Object.fromEntries(checks.map(c => [c.k, c.expected])),
    got: attrs,
    failed
  };
}

export function invariantDomAttrsPresent(attrs) {
  const required = [
    'data-verify', 'data-total-critical', 'data-total-high', 'data-total-medium',
    'data-total-info', 'data-total-findings', 'data-rule-count',
    'data-has-settings', 'data-has-conflict'
  ];
  const missing = required.filter(k => attrs[k] === null || attrs[k] === undefined);
  return {
    name: 'dom-attrs-present',
    pass: missing.length === 0,
    expected: required,
    got: missing
  };
}

export function checkAll(state, domCounts = null, attrs = null) {
  const counts = domCounts || {
    CRITICAL: state.summary.CRITICAL,
    HIGH: state.summary.HIGH,
    MEDIUM: state.summary.MEDIUM,
    INFO: state.summary.INFO,
    severityCount: state.findings.length
  };
  const attrChecks = attrs || {};
  const results = [
    invariantSchema(state),
    invariantTotalsMatch(state),
    invariantFindingsRendered(state, counts),
    invariantMissingSettings(state),
    invariantConflictImpliesCritical(state),
    invariantNoHiddenSeverities(state, counts),
    invariantDomAttrsPresent(attrChecks),
    invariantDomAttrsMatch(state, attrChecks)
  ];
  const pass = results.every(r => r.pass);
  return { pass, results };
}
