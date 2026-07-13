# Evidencia: dynamic workflow (modulo 7)

Tarea real elegida: implementar la skill multi-componente `permaudit` (auditor de permisos de `.claude/settings.json`) a partir de la spec `docs/spec-permaudit.md`, usando un dynamic workflow con build en paralelo, revision, fix condicional y verificacion.

El JavaScript generado por el workflow esta copiado en [workflow-permaudit.js](workflow-permaudit.js).

## Ejecucion 1 (run `wf_0eb2b43d-cf1`)

Fases y sub-agentes lanzados (visto en `/workflows`):

| # | Fase | Sub-agente | Modelo | Resultado |
|---|------|-----------|--------|-----------|
| 1 | Build | `build:skill-md` | claude-fable-5 | Escribio `.claude/skills/permaudit/SKILL.md` |
| 2 | Build | `build:audit-js` | claude-fable-5 | Escribio `audit.js` (6 reglas de severidad, JSON + exit codes) |
| 3 | Build | `build:test-js` | claude-fable-5 | Escribio `test.js` (3 fixtures en tmpdir) |
| 4 | Review | `review:spec-consistency` | claude-fable-5 | `{"findings":[]}` — consistente con la spec |
| 5 | Verify | `verify:run-tests` | claude-fable-5 | `test.js` imprime OK (exit 0); `audit.js .` → 0 CRITICAL, exit 0 |

Los 3 agentes de Build corrieron en paralelo (mismo timestamp de arranque). La fase Fix era condicional y no se ejecuto porque la revision salio limpia. Total: 5 sub-agentes, 24 tool calls, ~167k tokens de sub-agentes, 151 s.

Resultado final del workflow:

```json
{"reviewFindings":0,"verify":{"testOk":true,"auditExit":0,
 "detail":"test.js imprimió OK (exit 0). audit.js sobre el repo devolvió summary
 {critical:0, high:0, medium:0, info:1} con exit 0; único finding: INFO rule-count
 (allow=1, ask=1, deny=2)."}}
```

## Guardado como slash command

Desde `/workflows` se presiono `S` y se guardo el workflow con nombre estable para poder re-invocarlo como slash command.

## Cambio de modelo de un sub-agente

Se edito el JavaScript generado: al sub-agente `review:spec-consistency` se le agrego `model: 'sonnet'` en sus opts (linea 38 de [workflow-permaudit.js](workflow-permaudit.js)):

```js
label: 'review:spec-consistency', phase: 'Review', model: 'sonnet',
```

## Ejecucion 2 — re-run y determinismo (resume del run `wf_0eb2b43d-cf1`)

Se re-invoco el mismo script. Corrieron exactamente los mismos 5 sub-agentes, en las mismas fases y con los mismos prompts:

- `build:skill-md`, `build:audit-js`, `build:test-js`: **cached: true** — el harness detecto (prompt, opts) identicos y devolvio los resultados del run anterior sin re-ejecutar, byte a byte iguales. Esa es la prueba de determinismo.
- `review:spec-consistency`: re-ejecutado en vivo porque sus opts cambiaron, ahora sobre **claude-sonnet-5** (visible en la metadata del agente: `"model": "claude-sonnet-5"` vs `"claude-fable-5"` del run 1). Mismo veredicto: `{"findings":[]}`.
- `verify:run-tests`: re-ejecutado (posterior al agente editado). Mismo resultado: test OK, audit exit 0, 0 CRITICAL.

Total ejecucion 2: ~70k tokens (vs ~167k), porque el prefijo cacheado no se re-ejecuta.

## Verificacion local independiente

Fuera del workflow, en terminal:

```
$ node .claude/skills/permaudit/test.js
OK
$ node .claude/skills/permaudit/audit.js . ; echo "exit=$?"
{ "findings": [ {"severity":"INFO","rule":"rule-count","detail":"allow=1, ask=1, deny=2"} ],
  "summary": {"critical":0,"high":0,"medium":0,"info":1} }
exit=0
```

## Nota (gotcha observado)

En los prompts de los sub-agentes aparece `undefined/docs/spec-permaudit.md`: el parametro `args` llego al script como string JSON en vez de objeto, asi que `args.repo` fue `undefined` dentro de los templates. Los agentes localizaron el repo igualmente y todo paso, pero la leccion es pasar `args` como JSON real (no string) o poner un fallback `args.repo || '<ruta>'` en el script.
