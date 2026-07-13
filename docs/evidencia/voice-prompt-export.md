# Transcripcion prompt dictado (modulo 8, paso 2)

Prompt tal cual dictado (sin corregir typos ni puntuacion, transcripcion en crudo tipo dictado por voz):

> quiero que agregues un export a la skill permaudit algo que tome el reporte de auditoria que ya genera audit.js y lo saque en formato tipo csv o markdown para poder compartirlo o pegarlo en un pr no toques audit.js el archivo principal ni el settings.json del repo mantenlo dentro de la carpeta de permaudit nomas sin agregar dependencias nuevas si se puede evitar y antes de que decidas el formato o la libreria dime que opciones tengo de stack

Contenido explicito en el prompt (por si el typo/informalidad lo oscurece):
- **Que construir**: comando de export que tome los `findings` que ya produce `audit.js` y los saque en CSV o Markdown.
- **Restricciones**: no tocar `audit.js` (la logica de auditoria ya validada), no tocar `.claude/settings.json`, todo el codigo nuevo vive dentro de `.claude/skills/permaudit/`, evitar dependencias npm nuevas si es posible.
- **Pedido explicito de opciones**: "dime que opciones tengo de stack" antes de decidir.
