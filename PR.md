# PR: PermAudit Dashboard

## Qué incluye

- `app/index.html` + `app/audit.js`: dashboard funcional de auditoría de permisos de Claude Code.
- `docs/spec/permaudit-dashboard.md`: spec derivado de la entrevista.
- `docs/spec/permaudit-dashboard-wireframe-a.html` y `-b.html`: dos direcciones de diseño comparadas.
- `docs/spec/permaudit-dashboard.html`: HTML ganador, renderizable, con contrato DOM publicado.
- `verification/`: fixtures, esquemas, invariantes, sondas y tres superficies de verificación.
- `docs/evidencia/agent-video/permaudit-dashboard-verify.mp4`: clip de la verificación agéntica.

## Cómo probar

```bash
npm install
npm test                 # unit + CI headless
npm run verify:agent     # genera video de evidencia
npm run verify:break-1   # rotura 1: total hardcodeado
npm run verify:break-2   # rotura 2: atributo data-* faltante
npm run verify:break-3   # rotura 3: verificación naive que pasa con bug
```

## Notas de la entrevista

### ¿Qué requisito latente extrajo Claude durante la entrevista que tú no habrías puesto?

El manifiesto de verificación publicado en el DOM. Yo habría escrito tests en un archivo aparte, pero la idea de que el propio artefacto exponga `data-verify`, `data-total-*` y `#verify-manifest` no la habría incluido por mi cuenta. Eso hace que humanos, agentes y CI lean el mismo contrato.

### ¿Qué te hizo el HTML como spec vs. tu markdown largo habitual?

El HTML obliga a tomar decisiones de layout, estado y feedback visual desde el primer minuto. En Markdown es fácil dejar los edge cases como texto ambiguo; en el wireframe tuve que decidir dónde va el editor, dónde la lista, cómo se ve un fixture con 60 findings y cómo se publica el contrato. Comparar dos wireframes con screenshots me hizo descartar rápido el layout vertical porque escondía el editor bajo scroll.

### ¿Qué falla real habrías dejado pasar sin el contrato en el DOM?

Sin `data-total-critical` y las invariantes que lo cruzan con los findings renderizados, el bug del "total hardcodeado +1" habría pasado desapercibido. El dashboard se veía bien, los tests contra el estado interno pasaban, pero el contrato mentía. La rotura deliberada 1 (`npm run verify:break-1`) lo demuestra.

## Evidencia

- Capturas: `docs/evidencia/wireframe-a.png`, `docs/evidencia/wireframe-b.png`, `docs/evidencia/permaudit-dashboard.png`.
- Video de verificación agéntica: `docs/evidencia/agent-video/permaudit-dashboard-verify.mp4`.
