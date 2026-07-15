# claude-code-permisos-lab

Lab practico: configuracion de permisos allow/ask/dny, jerarquia managed>usuario>proyecto y auto mode e Claude Code.

## Nuevo: PermAudit Dashboard

Se agrego una feature de front-end para auditar visualmente la configuracion de permisos de Claude Code.

- Abrir la app: `app/index.html`
- Spec renderizable: `docs/spec/permaudit-dashboard.html`
- Spec en Markdown: `docs/spec/permaudit-dashboard.md`
- Verificacion:
  - `npm test` — sondas unitarias + CI headless
  - `npm run verify:agent` — genera video de evidencia agéntica
  - `npm run verify:break-1/2/3` — roturas deliberadas
- Evidencia: `docs/evidencia/` (wireframes, screenshots, video)

El dashboard publica un contrato DOM con atributos `data-*` y un manifiesto de verificacion en `#verify-manifest`, de modo que humanos, agentes con Playwright y CI headless ejecutan los mismos pasos sobre la misma superficie.
