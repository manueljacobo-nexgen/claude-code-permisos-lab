export const meta = {
  name: 'permaudit-skill-build',
  description: 'Implementa la skill permaudit desde docs/spec-permaudit.md: build paralelo, revisión, fix y verificación',
  phases: [
    { title: 'Build', detail: '3 agentes en paralelo, un componente cada uno' },
    { title: 'Review', detail: 'revisión contra spec' },
    { title: 'Fix', detail: 'corrige hallazgos si los hay' },
    { title: 'Verify', detail: 'ejecuta test.js y audit.js reales' },
  ],
}

const repo = args.repo
const spec = `${repo}/docs/spec-permaudit.md`

const COMPONENTS = [
  { key: 'skill-md', file: '.claude/skills/permaudit/SKILL.md', desc: 'el SKILL.md (componente 1 de la spec)' },
  { key: 'audit-js', file: '.claude/skills/permaudit/audit.js', desc: 'el script audit.js (componente 2 de la spec)' },
  { key: 'test-js', file: '.claude/skills/permaudit/test.js', desc: 'el self-check test.js (componente 3 de la spec)' },
]

phase('Build')
log('Construyendo 3 componentes en paralelo desde la spec')
await parallel(COMPONENTS.map(c => () =>
  agent(
    `Lee la spec ${spec} completa. Implementa EXACTAMENTE ${c.desc} y escríbelo en ${repo}/${c.file}. ` +
    `No toques ningún otro archivo. Sigue la spec al pie de la letra (severidades, formato JSON, exit codes, sin dependencias npm). ` +
    `Devuelve solo la ruta del archivo escrito y un resumen de 2 líneas.`,
    { label: `build:${c.key}`, phase: 'Build' }
  )
))

phase('Review')
const review = await agent(
  `Lee la spec ${spec} y los 3 archivos en ${repo}/.claude/skills/permaudit/ (SKILL.md, audit.js, test.js). ` +
  `Revisa consistencia entre sí y contra la spec: severidades, formato de salida JSON, exit codes, que test.js invoque audit.js correctamente. ` +
  `Reporta solo problemas reales que rompan los criterios de aceptación.`,
  {
    label: 'review:spec-consistency', phase: 'Review', model: 'sonnet',
    schema: {
      type: 'object',
      properties: {
        findings: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, problem: { type: 'string' } }, required: ['file', 'problem'] } },
      },
      required: ['findings'],
    },
  }
)

if (review && review.findings.length > 0) {
  phase('Fix')
  log(`${review.findings.length} hallazgos — corrigiendo`)
  await agent(
    `En ${repo}/.claude/skills/permaudit/ corrige estos problemas detectados en revisión, tocando solo los archivos de la skill:\n` +
    review.findings.map(f => `- ${f.file}: ${f.problem}`).join('\n') +
    `\nLa spec de referencia es ${spec}. Devuelve resumen de cambios.`,
    { label: 'fix:findings', phase: 'Fix' }
  )
} else {
  log('Revisión limpia, sin fix necesario')
}

phase('Verify')
const verify = await agent(
  `En el directorio ${repo} ejecuta: (1) node .claude/skills/permaudit/test.js y (2) node .claude/skills/permaudit/audit.js . ` +
  `Reporta salida y exit codes reales de ambos. Criterio: test imprime OK; audit sobre este repo da 0 CRITICAL y exit 0. ` +
  `Si algo falla, corrige el código de la skill (no los criterios) y re-ejecuta hasta que pase o hasta 3 intentos.`,
  {
    label: 'verify:run-tests', phase: 'Verify',
    schema: {
      type: 'object',
      properties: {
        testOk: { type: 'boolean' },
        auditExit: { type: 'number' },
        detail: { type: 'string' },
      },
      required: ['testOk', 'auditExit', 'detail'],
    },
  }
)

return { reviewFindings: review ? review.findings.length : -1, verify }