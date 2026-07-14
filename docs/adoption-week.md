# Adoption week — modulo 9

Semana real de trabajo sobre `claude-code-permisos-lab` (2026-07-13), no un repo simulado aparte: las 3 piezas se hicieron sobre el trabajo real que ya estaba en curso en este repo (feature de export del modulo 8, CI inexistente hasta ahora, una decision tecnica genuinamente pendiente).

## Entorno (paso 1)

- Alias de `claude`: **no hizo falta** — ya resuelve directo desde PATH (`/Users/manueljac/.local/bin/claude`). Agregar uno habria sido ruido sin valor.
- Carpeta comun de proyectos: ya existe (`~/Desktop/Plataforma Soporte`, convencion previa). No se creo `~/projects` para no fragmentar.
- Claude GitHub App: **no instalada** — requiere aprobacion manual de OAuth en github.com/apps, accion que le corresponde al dueño de la cuenta. Bloquea especificamente el autofix-via-App del paso 8 (ver mas abajo).

## Piezas de trabajo real

### (a) TDD — [PR#2](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/2)
`audit.js` crasheaba con `TypeError` si una entrada de `allow`/`ask`/`deny` en `settings.json` no era string (ej. un `123` por typo). Se escribio el test primero (`test.js` caso 4), se corrio y confirmo **rojo** (`TypeError: rule.includes is not a function`), luego se aplico el fix minimo (`.map(String)`) y se confirmo **verde**. El test no se borro. Ciclo mencionado explicitamente en el PR. Commit: `f40e03a`.

### (b) Decision tecnica — [PR#3 (elegida)](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/3), [PR#4 (cerrada)](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/4), [PR#5 (cerrada)](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/5)
Pendiente real: como exponer JSON desde `export.js` (hasta ahora solo md/csv). Tres approaches generados en branches separadas:
- **A (elegida)**: `--format=json` reusa `filtered`, respeta `--min-severity` igual que md/csv.
- **B (descartada)**: sin codigo nuevo, usar `audit.js` directo — pero pierde el filtro `--min-severity` para JSON.
- **C (descartada)**: passthrough crudo del stdout de audit.js — mismo costo que A pero con un bug de diseño real y demostrado: `--min-severity=CRITICAL` seguia mostrando findings INFO en json.
Decision documentada en el comentario de PR#3.

### (c) PR con CI — [PR#6](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/6)
Este repo no tenia CI. Se agrego `.github/workflows/test.yml`. Al correr, quedo **rojo genuino** (no fabricado): el job muere en ~3-4s sin ejecutar steps ni generar logs — no un bug de codigo (`node test.js` local pasa OK).

Diagnostico completo (confirmado, no especulado): en vez de instalar la GitHub App via marketplace (ver hallazgos de seguridad mas abajo), se armo el flujo con `claude-code-action` + `CLAUDE_CODE_OAUTH_TOKEN` (generado con `claude setup-token`, valido para suscripcion Pro/Max/Team, sin necesitar `ANTHROPIC_API_KEY` de pago por API) en [PR#8](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/8). Se comento `@claude` en PR#6 para probarlo end-to-end: el trigger disparo correctamente (el `if` con `author_association == 'OWNER'` funciono), pero el job murio igual. La causa real, confirmada en Settings → Billing → Payment information: **`Invalid payment method - authorization hold failed`** — la cuenta esta bloqueada para cualquier Actions run porque el hold de autorizacion de la tarjeta fallo, no por limite de minutos (0/2000 usados, \$0 gastado) ni por configuracion del repo. Decision: se deja el flujo (`claude.yml` + secret) armado y funcional, sin seguir debuggeando — arreglar el metodo de pago es una accion sobre datos financieros que le corresponde a Manuel, no algo que el agente deba tocar.

Nota aparte: el security review automatico sobre el push de `claude.yml` encontro 3 hallazgos reales antes de mergear — el workflow, tal como se escribio primero, dejaba que **cualquier usuario de GitHub** (el repo es publico) disparara un job con permisos de escritura con solo comentar "@claude", ademas de referenciar las actions por tag movible en vez de SHA fijo. Corregido (`author_association == 'OWNER'` + SHAs pinneados) antes de mergear a main.

## Multi-Clauding (paso 4)

Rama [`chore/multi-clauding-ticket`](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/tree/chore/multi-clauding-ticket), evidencia en `ticket.md`:
1. Instancia A (esta sesion) escribe el estado pendiente en `ticket.md` y comitea (`324ff85`).
2. Instancia B (subagente independiente, lanzado via `Agent` tool, sin contexto previo de la conversacion) lee `ticket.md`, verifica el comportamiento real (`--min-severity=critical` en minuscula vs mayuscula), agrega el test, corre la suite completa, y comitea por separado (`8f4d56e` test, `8b2bcfb` cierre de ticket).

3 commits distintos en la misma rama, autoria separable — evidencia real de handoff entre instancias, no narrativa.

## Regla 90/10 (paso 6)

Ejemplo concreto de esta semana: el workflow de code review de alto esfuerzo sobre el PR de export (modulo 8) uso 12 sub-agentes (~490k tokens, ~3 min) revisando y verificando un diff que a Manuel le tomo 0 minutos escribir a mano — encontro 4 bugs reales (CSV con newlines, markdown con pipes sin escapar, resumen sin filtrar, crash silencioso en JSON.parse) que no eran obvios en una lectura rapida. Segundo ejemplo, esta misma sesion: diagnosticar el `startup_failure` de CI (PR#6) tomo ~10 llamadas de investigacion (API de Actions, permisos, billing) contra 1 sola escritura del archivo de 22 lineas que lo origino — la proporcion revisar/investigar vs escribir codigo a mano fue netamente mayor a 9:1.

## /rewind o Escape (paso 9)

Ningun caso esta semana: no hizo falta interrumpir ni retroceder una sesion. Lectura honesta: el plan mode del modulo 8 (converger antes de codear) y la verificacion del bug real antes de escribir el test en la pieza TDD de este modulo evitaron que Claude tomara un rumbo no deseado que despues hubiera que corregir — prevenir la desviacion de entrada costo menos que corregirla despues.

## Descartar a proposito (paso 10)

[PR#5](https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/5) (opcion C del punto b): el codigo **funcionaba** (se probo y se demostro el output), pero se decidio no comitearlo a la rama principal porque su comportamiento (ignorar `--min-severity` silenciosamente en json mientras md/csv si filtran) no aportaba valor suficiente sobre la opcion A, que cuesta lo mismo sin el problema. PR cerrado sin mergear, con la razon documentada en el comentario de cierre.

## Que practica ya se siente natural, cual cuesta mas

- **Natural**: TDD rojo→verde y plan mode antes de codear — ya eran el flujo por defecto de los modulos anteriores, no hubo friccion nueva.
- **Cuesta mas**: el multi-Clauding real (dos instancias genuinamente independientes tocando la misma rama) exige disciplina de que cada una comitee por separado y deje rastro explicito — es facil que una sola sesion termine mezclando todo en un commit y perder la evidencia de "dos developers".

## CLI preferido sobre un MCP (mas alla de git/gh)

`python3 -m http.server` (stdlib, sin instalar nada) para servir el wireframe HTML del modulo 8 y poder abrirlo con Playwright — Playwright bloquea `file://` por seguridad y no hay servidor de archivos estatico expuesto como MCP; un CLI de una linea resolvio esto sin agregar dependencias ni pedirle a Manuel que configure algo nuevo.

## Commits/PRs de esta semana (referencia rapida)

| Pieza | Link |
|---|---|
| TDD | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/2 |
| Decision A (elegida) | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/3 |
| Decision B (descartada) | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/4 |
| Decision C (descartada) | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/5 |
| CI (rojo, infra) | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/6 |
| Workflow @claude (con fixes de seguridad) | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/pull/8 |
| Multi-Clauding | https://github.com/manueljacobo-nexgen/claude-code-permisos-lab/tree/chore/multi-clauding-ticket |
