# Roturas deliberadas

Este directorio contiene tres variantes del dashboard que demuestran por qué
el contrato en el DOM y las invariantes importan.

## Break 1 — Fallo aritmético hardcodeado

**Archivo**: `app/index-break-hardcoded.html`
**Verificación**: `npm run verify:break-1`

El dashboard funciona visualmente, pero `data-total-critical` se incrementa
artificialmente en 1. La app no se rompe, pero el contrato miente.
La verificación detecta la rotura porque `invariantDomAttrsMatch` compara
los atributos `data-*` con el manifiesto y los findings renderizados.

## Break 2 — Contrato roto sin romper la app

**Archivo**: `app/index-break-missing-attr.html`
**Verificación**: `npm run verify:break-2`

Se elimina el atributo `data-total-critical`. El dashboard sigue siendo usable
para un humano, pero cualquier agente o CI que confíe en el contrato falla.
La invariante `dom-attrs-present` detecta que falta un atributo obligatorio.

## Break 3 — Verificación mal escrita pasa aunque haya un bug

**Archivo**: `verification/breaks/naive-verify.mjs`
**Verificación**: `npm run verify:break-3`

La sonda `destructive-allow` solo comprueba `flags.hasSettings`, ignorando
que `rm` está en `allow` y genera un finding CRITICAL. La verificación naive
pasa (verde), ilustrando la diferencia entre "tener un test" y "verificar
invariantes del contrato". Una verificación real con `checkAll` detecta el
CRITICAL en el DOM.
