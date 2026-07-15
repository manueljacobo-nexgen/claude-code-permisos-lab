/** Versión script-clásico de las sondas para la superficie humana. */
(function (global) {
  global.PermAuditProbes = [
    {
      name: 'happy-path',
      fixture: 'clean',
      description: 'Configuración limpia con rm en ask y reglas críticas en deny.',
      expected: { summary: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, INFO: 1 }, totals: { findings: 1, rules: 5 }, flags: { hasSettings: true, hasConflict: false } }
    },
    {
      name: 'destructive-allow',
      fixture: 'destructiveAllow',
      description: 'rm en allow genera CRITICAL y, como no está en ask/deny, también MEDIUM.',
      expected: { summary: { CRITICAL: 1, HIGH: 0, MEDIUM: 1, INFO: 1 }, totals: { findings: 3, rules: 5 }, flags: { hasSettings: true, hasConflict: false } }
    },
    {
      name: 'wildcard-allow',
      fixture: 'wildcardAllow',
      description: 'Wildcard total en allow debe generar un finding HIGH.',
      expected: { summary: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, INFO: 1 }, totals: { findings: 2, rules: 6 }, flags: { hasSettings: true, hasConflict: false } }
    },
    {
      name: 'conflict',
      fixture: 'conflict',
      description: 'Misma regla en allow y deny genera CRITICAL por push y CRITICAL por conflicto.',
      expected: { summary: { CRITICAL: 2, HIGH: 0, MEDIUM: 0, INFO: 1 }, totals: { findings: 3, rules: 6 }, flags: { hasSettings: true, hasConflict: true } }
    },
    {
      name: 'missing-settings',
      fixture: 'missingSettings',
      description: 'Sin settings.json debe generar exactamente un finding HIGH.',
      expected: { summary: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, INFO: 0 }, totals: { findings: 1, rules: 0 }, flags: { hasSettings: false, hasConflict: false } }
    },
    {
      name: 'empty',
      fixture: 'empty',
      description: 'Listas vacías: sin deny de git push ni archivos, y rm tampoco está manejado.',
      expected: { summary: { CRITICAL: 0, HIGH: 3, MEDIUM: 1, INFO: 1 }, totals: { findings: 5, rules: 0 }, flags: { hasSettings: true, hasConflict: false } }
    },
    {
      name: 'invalid',
      fixture: 'invalid',
      description: 'JSON malformado debe reportarse como finding CRITICAL de parseo.',
      expected: { summary: { CRITICAL: 1, HIGH: 0, MEDIUM: 0, INFO: 0 }, totals: { findings: 1, rules: 0 }, flags: { hasSettings: false, hasConflict: false } }
    },
    {
      name: 'limit',
      fixture: 'limit',
      description: 'Más de 50 reglas destructivas; además se reportan HIGH/MEDIUM por faltantes.',
      expected: { summary: { CRITICAL: 60, HIGH: 3, MEDIUM: 1, INFO: 1 }, totals: { findings: 65, rules: 60 }, flags: { hasSettings: true, hasConflict: false } }
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
