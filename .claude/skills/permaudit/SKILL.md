---
name: permaudit
description: Audita la configuracion de permisos de un repo (.claude/settings.json) y reporta riesgos por severidad. Read-only. Usar cuando el usuario pida auditar permisos, revisar settings.json o diga "/permaudit".
disable-model-invocation: false
---

# permaudit

Audita `.claude/settings.json` del repo indicado y resume los riesgos encontrados.

## Instrucciones

1. Ejecuta:

   ```bash
   node .claude/skills/permaudit/audit.js $ARGUMENTS
   ```

   `$ARGUMENTS` es la ruta al repo a auditar; si no se proporciona, usa `.` (repo actual).

2. Interpreta el JSON que el script imprime por stdout:

   ```json
   {
     "findings": [{"severity": "...", "rule": "...", "detail": "..."}],
     "summary": {"critical": 0, "high": 0, "medium": 0, "info": 0}
   }
   ```

3. Resume los hallazgos al usuario **en español**, ordenados por severidad (CRITICAL primero, luego HIGH, MEDIUM, INFO). Incluye el conteo del `summary` y, por cada hallazgo, la regla y el detalle en lenguaje claro.

## Severidades que emite el script

- **CRITICAL** — patron destructivo en allow (`rm`, `sudo`, `dd`, `mkfs`, `> /dev/`) o `git push` presente en allow.
- **HIGH** — wildcard total en allow (`Bash(*)`, `Bash(* *)` o regla `*`); falta regla deny para `git push` o para archivos criticos (`package.json`, `.env`); o no existe `settings.json` ("sin configuracion de permisos").
- **MEDIUM** — `rm` no esta en ask ni en deny.
- **INFO** — conteo de reglas por lista (allow/ask/deny).

## Exit codes

- `1` — hay al menos un hallazgo CRITICAL.
- `0` — sin CRITICAL (incluido el caso de `settings.json` inexistente, que reporta HIGH pero sale con 0).

## Exportar reporte

Para pegar el resultado en un PR/issue de GitHub, exporta los mismos findings a Markdown o CSV:

```bash
node .claude/skills/permaudit/export.js [repo] --format=md|csv --min-severity=INFO|MEDIUM|HIGH|CRITICAL
```

- `[repo]`: ruta al repo a auditar, default `.`.
- `--format`: `md` (default, tabla + resumen, pensado para renderizar en GitHub) o `csv` (`severity,rule,detail`).
- `--min-severity`: filtra findings por debajo de esa severidad (default `INFO` = todos).
- Salida siempre por stdout; para guardar a archivo, redirige con `>` (ej. `export.js . --format=md > reporte.md`).
- Sin hallazgos que superen `--min-severity`: igual imprime encabezado/resumen con un mensaje de "sin hallazgos", exit `0`.
- `--format` o `--min-severity` invalidos: mensaje de error a stderr con los valores validos, exit `2`, sin imprimir nada a stdout.
