# Spec: skill permaudit

Skill de Claude Code que audita la configuracion de permisos de un repo (`.claude/settings.json`) y produce un reporte de riesgos. Componentes:

## 1. `.claude/skills/permaudit/SKILL.md`
- Frontmatter: `disable-model-invocation: false` (es read-only, el modelo puede invocarla sin riesgo).
- Instrucciones: ejecutar `node .claude/skills/permaudit/audit.js $ARGUMENTS` (ruta al repo a auditar, default `.`), interpretar el JSON de salida y resumir hallazgos al usuario en espanol, ordenados por severidad.
- Documentar los codigos de severidad que emite el script (CRITICAL/HIGH/MEDIUM/INFO).

## 2. `.claude/skills/permaudit/audit.js`
Node puro (sin dependencias). Lee `<repo>/.claude/settings.json` y evalua reglas:
- CRITICAL: patron destructivo en allow (`rm`, `sudo`, `dd`, `mkfs`, `> /dev/`).
- CRITICAL: `git push` presente en allow.
- HIGH: wildcard total en allow (`Bash(*)`, `Bash(* *)` o regla `*`).
- HIGH: no existe regla deny para `git push` ni para archivos criticos (`package.json`, `.env`).
- MEDIUM: `rm` no esta en ask ni en deny.
- INFO: conteo de reglas por lista.
Salida: JSON `{findings: [{severity, rule, detail}], summary: {critical, high, medium, info}}` por stdout. Exit code 1 si hay CRITICAL, 0 si no. Si no existe settings.json: finding HIGH "sin configuracion de permisos" y exit 0.

## 3. `.claude/skills/permaudit/test.js`
Self-check ejecutable con `node test.js`: construye 3 fixtures temporales (os.tmpdir) — uno limpio (como el de este repo: rm en ask, git push y package.json en deny), uno con `rm` en allow, uno sin settings.json — corre audit.js contra cada uno con child_process y hace assert de severidades y exit codes esperados. Imprime `OK` si todo pasa.

## Criterios de aceptacion
- `node .claude/skills/permaudit/audit.js .` sobre este repo: 0 CRITICAL, exit 0.
- `node .claude/skills/permaudit/test.js` imprime OK.
- Sin dependencias npm; solo stdlib de Node.
