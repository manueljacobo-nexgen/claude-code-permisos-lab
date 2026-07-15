/**
 * Versión deliberadamente ingenua de las sondas.
 * Ejemplo de "verificación" que pasaría aunque la app tenga un bug grave:
 * la sonda destructive-allow espera 0 CRITICAL, ocultando el riesgo real.
 */

export const naiveProbes = [
  {
    name: 'happy-path',
    fixture: 'clean',
    expected: { summary: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, INFO: 1 }, totals: { findings: 1, rules: 5 }, flags: { hasSettings: true, hasConflict: false } }
  },
  {
    name: 'destructive-allow',
    fixture: 'destructiveAllow',
    description: 'MAL ESCRITA: solo verifica que haya settings, ignorando severidades.',
    expected: { flags: { hasSettings: true } }
  }
];
