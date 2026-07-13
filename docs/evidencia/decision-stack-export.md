# Decision de stack (modulo 8, paso 3)

## Opciones presentadas antes de decidir

1. **Node stdlib puro** (fs + template strings), igual que `audit.js`/`test.js`. Sin dependencias nuevas. CSV escrito a mano (basta escapar comas/comillas porque el shape de `findings` es fijo: severity/rule/detail).
2. **Agregar dependencia npm** para CSV (ej. `csv-stringify`) — mas robusto ante edge cases arbitrarios de CSV, pero rompe la regla actual del repo de "skill sin dependencias" y agrega la primera dependencia real a esta carpeta.
3. **Delegar a herramienta externa** (`jq` u otro binario del sistema) — descartado: no genera CSV/Markdown directamente, y depende de que el binario este instalado en la maquina de quien corra la skill.

## "Recuerdame las otras opciones"

Antes de decidir se releyeron las 3 de nuevo: stdlib puro / dependencia npm / binario externo.

## Decision

**Opcion 1 — Node stdlib puro.** Razon: el shape de datos que produce `audit.js` es fijo y pequeño (severity/rule/detail), no hay CSV arbitrario de usuario que justifique una libreria; mantiene la skill completa sin dependencias (coherente con `spec-permaudit.md`); menos superficie para romper en `npm install` de quien clone el repo.

## Nota para el PR

Se le pidio a Claude Code anotar en el PR final por que se eligio stdlib puro sobre agregar una dependencia: evitar romper la convencion "sin dependencias npm" ya establecida en la skill permaudit, dado que el formato de salida es fijo y pequeño.
