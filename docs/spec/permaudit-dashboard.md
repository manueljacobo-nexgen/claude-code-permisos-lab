# Spec: PermAudit Dashboard

## Resumen de la entrevista

- **Feature**: Dashboard de auditoría de permisos para repos de Claude Code.
- **Audiencia primaria**: Dev individual que configura permisos en su propio repo.
- **Criterio de éxito principal**: Detectar configs inseguras; el dashboard nunca debe ocultar un finding CRITICAL o HIGH.
- **Edge cases soportados desde el inicio**:
  1. No existe `.claude/settings.json`.
  2. Wildcard total en `allow` (`Bash(*)` o regla `*`).
  3. Reglas duplicadas / contradictorias (misma regla en `allow` y `deny`).
  4. Estado vacío (sin findings).
  5. Límite de findings (>50).
- **Stack**: HTML estático + vanilla JS; sin build.
- **Prioridad visual**: Wireframe funcional; foco en estados, datos y verificación.
- **Contrato DOM**: atributos `data-*` legibles para humanos, agentes y CI.

## Componentes

### 1. `app/index.html` (app funcional)
Carga un fixture de `.claude/settings.json`, ejecuta la lógica de auditoría en el cliente y renderiza:
- Panel de resumen con conteos por severidad.
- Lista de findings con severidad, regla y detalle.
- Editor de reglas para simular cambios.
- Manifiesto de verificación publicado en `#verify-manifest`.

### 2. `docs/spec/permaudit-dashboard.html` (spec renderizable)
HTML ganador, navegable, con la misma funcionalidad que `app/index.html` pero autocontenido para que sirva como artefacto de especificación.

### 3. `verification/`
- `fixtures/`: estados conocidos de `.claude/settings.json`.
- `schemas/`: descripción de cada componente y atributos `data-*`.
- `invariants.js`: invariantes que siempre deben sostenerse.
- `probes/`: sondas que ejercen invariantes, incluyendo caminos fuera del camino feliz.
- `surfaces/`: tres superficies equivalentes de verificación.
  - `human.html`: panel interactivo para ejecutar verificaciones una a una.
  - `agent.js`: verificación con Playwright (agente).
  - `headless.js`: verificación headless para CI.
- `breaks/`: tres variantes deliberadamente rotas.

## Contrato DOM

El dashboard publica los siguientes atributos `data-*`:

- `data-verify="permaudit-dashboard"`: identifica el artefacto verificable.
- `data-total-critical`, `data-total-high`, `data-total-medium`, `data-total-info`: conteos por severidad.
- `data-total-findings`: total de findings.
- `data-has-settings`: `"true"` si hay settings, `"false"` si no.
- `data-rule-count`: número de reglas cargadas.
- `data-has-conflict`: `"true"` si una misma regla aparece en allow y deny.
- Cada finding es un `<li data-severity="..." data-rule="...">`.

## Invariantes principales

1. `data-total-findings` es igual a la cantidad de elementos `li[data-severity]`.
2. `data-total-critical + data-total-high + data-total-medium + data-total-info == data-total-findings`.
3. Si `data-has-settings="false"`, entonces `data-total-findings == 1` y el único finding es HIGH.
4. Si `data-has-conflict="true"`, existe al menos un finding CRITICAL.
5. Nunca se oculta un finding CRITICAL o HIGH; ambos están presentes en el DOM.

## Sondas

- `happy-path`: config limpia, sin findings críticos.
- `missing-settings`: sin `.claude/settings.json`.
- `wildcard-allow`: wildcard total en allow.
- `destructive-allow`: `rm` en allow.
- `conflict`: misma regla en allow y deny.
- `empty`: config sin findings (solo reglas seguras).
- `limit`: >50 findings (para comprobar límites de renderizado).
- `invalid-json`: archivo settings.json malformado.
