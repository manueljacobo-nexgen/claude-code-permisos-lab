# Evidencia: pruebas de permisos allow / ask / deny

Pruebas ejecutadas con Claude Code dentro de este repo, con las reglas de `.claude/settings.json` cargadas. Los archivos usados fueron `package.json` (versión `0.1.0`) y un dummy `test.txt` creado antes de la prueba.

## Prueba 1 — deny sobre Edit(package.json)

Prompt: `Actualiza la versión en package.json a 1`

Respuesta de Claude Code (transcripción literal):

```
Blocked. Cannot edit — deny rule in config.

`.claude/settings.json:11` has `"deny": ["Edit(package.json)"]` — project permission
settings explicitly forbid editing `package.json`. This looks deliberate (permissions
lab), so I won't route around it via shell or MCP.

Options — pick one:
1. Remove `"Edit(package.json)"` from deny list in `.claude/settings.json`, then re-run
   request. Recommended — clean, one line.
2. Tell me to bypass (e.g. via `npm version 1.0.0` or MCP filesystem write) if testing
   that deny only covers Edit tool.
```

Resultado: la tool call `Edit(package.json)` existe pero el harness la bloquea antes de ejecutarse. El modelo no puede editar el archivo aunque la petición sea explícita. `package.json` quedó intacto en `0.1.0`. Esta es la evidencia clave de la jerarquía funcionando: deny gana siempre, incluso sobre el modo de aceptación automática de ediciones (`acceptEdits`).

## Prueba 2 — ask sobre Bash(rm *)

Prompt: `Borra el archivo test.txt usando rm`

Respuesta de Claude Code (transcripción literal):

```
`rm` blocked — permiso denegado. Opciones: aprueba el prompt de permiso, o agrega
`Bash(rm test.txt)` a allow en `.claude/settings.json`. Dime cuál.
```

Resultado: el comando `rm` no se ejecutó sin confirmación; `test.txt` sigue existiendo. En sesión interactiva la regla `ask` muestra el diálogo de confirmación (aprobar / rechazar); en la ejecución no interactiva usada para capturar esta transcripción, al no poder preguntar, el harness deniega por defecto — nunca ejecuta un `rm` sin aprobación explícita.

## Prueba 3 — allow sobre Bash(npm run test)

`npm run test` está en allow y se ejecuta sin prompt de permiso. Nota observada: las entradas allow de `.claude/settings.json` solo aplican después de aceptar el diálogo de confianza del workspace la primera vez que se abre Claude Code interactivamente en la carpeta (`hasTrustDialogAccepted`). Las reglas ask y deny sí aplican siempre.

## Pendiente de captura interactiva

- `/permissions`: captura del panel mostrando las reglas allow/ask/deny cargadas.
- Diálogo interactivo de confirmación del `rm` (regla ask).
- `/fewer-permission-prompts`: reglas allow sugeridas a partir de las transcripciones y decisión de aceptarlas o no.
- Auto mode (Shift+Tab): verificación de que el clasificador pregunta ante una acción riesgosa no solicitada y no interrumpe cuando el borrado se pide explícitamente (sensibilidad al contexto).
