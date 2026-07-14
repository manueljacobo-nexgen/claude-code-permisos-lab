# Reporte de evals — prompt de soporte Meridian Mobile

Pass rate por version de prompt y por caso. Se actualiza en cada fase.

## V0 (prompt original, sin tocar) — 3 corridas

| Caso | Run1 | Run2 | Run3 | Pass rate |
|---|---|---|---|---|
| control | PASS | PASS | PASS | 3/3 |
| edge-aritmetica | FAIL ($9.33, esperado $10.00) | PASS ($10.00) | PASS ($10.00) | 2/3 |
| politica | FAIL | FAIL | FAIL | 0/3 |
| escalacion | FAIL | FAIL | FAIL | 0/3 |
| no-retencion | FAIL | FAIL | FAIL | 0/3 |
| **Total** | 2/5 | 3/5 | 3/5 | **8/15 (53%)** |

### Lectura antes de tocar nada

- **control**: estable, 100%. Confirma que el arnes/modelo base funciona — el problema esta en el prompt, no en la infraestructura de evaluacion.
- **edge-aritmetica**: **varianza natural real observada** — mismo prompt, mismo caso, 3 corridas: run1 fallo por un error de conteo de dias (calculo dia 17-30 = 14 dias, en vez de dia 16-30 = 15 dias — off-by-one), run2 y run3 llegaron al numero correcto ($10.00) por metodos de calculo ligeramente distintos entre si. Esto es exactamente la variacion que el playbook pide observar antes de reaccionar: un solo run fallido aqui no significa "el prompt esta roto", significa "la aritmetica mental sin herramienta es no-determinista". Se abordara en Fase 4 dandole una tool real, no pidiendole mas enfasis.
- **politica**, **escalacion**, **no-retencion**: **0/3 en las tres, sin varianza** — no es ruido, es la instruccion literal del prompt funcionando exactamente como esta escrita ("never offer a refund... no matter what", "never escalate... under any circumstances", "never tell the customer their exact data usage"). Estos tres son los tres anti-patrones que ataca la Fase 4, uno por uno.

## V1 (higiene: rol honesto, sin boilerplate, XML) — 1 corrida

| Caso | Resultado |
|---|---|
| control | PASS |
| edge-aritmetica | PASS ($10.00) |
| politica | FAIL |
| escalacion | PASS* |
| no-retencion | FAIL |
| **Total** | **3/5 (60%)** |

*escalacion: resultado ambiguo, anotado tal cual salio. El modelo sigue negandose literalmente a "escalar dentro del chat" (la regla del prompt sigue intacta, la higiene de Fase 2 no toco politicas), pero esta vez ademas ofrece una ruta real a un humano (linea telefonica, "Billing Dispute" en la app que dice ir a un agente humano). Se cuenta como PASS porque el cliente si consigue una via a un humano, aunque sea un rodeo — pero es fragil (depende de que el modelo decida ofrecer el rodeo, no esta garantizado por el prompt) y se espera que la Fase 4 lo deje resuelto de forma directa y consistente, no como un hallazgo eventual del modelo.

Solo higiene (rol/boilerplate/estructura) ya subio el total de 53% a 60% — principalmente por estabilizar edge-aritmetica (paso de 2/3 en V0 a un pass limpio aqui, aunque con 1 sola corrida no se puede afirmar que elimino la varianza, solo que este run puntual paso). Las 3 politicas unilaterales siguen intactas, como se esperaba — eso es trabajo de Fase 4, no de Fase 2.

## V2 (contrato de salida) — 1 corrida

| Caso | Resultado |
|---|---|
| control | PASS |
| edge-aritmetica | FAIL ($9.33, mismo off-by-one que V0-run1) |
| politica | FAIL |
| escalacion | FAIL |
| no-retencion | FAIL |
| **Total** | **1/5 (20%)** |

**Esto NO es una regresion causada por el contrato de salida.** El formato salio exactamente como se pidio en las 5 respuestas (prosa plana, sin markdown, sin emoji, cierre de agradecimiento) — el contrato de salida cumplio su objetivo. La caida de 60% a 20% es la misma varianza natural de edge-aritmetica ya documentada en V0 (el conteo de dias del ciclo sigue siendo mental, sin herramienta, y esta vez volvio a fallar) sumada a que escalacion esta vez NO encontro el rodeo del telefono/app que la hizo pasar "de suerte" en V1 (ver nota `*` de V1) — es decir, escalacion nunca dejo de fallar realmente, solo parecio pasar una vez. Es exactamente la trampa que Fase 1 pidio evitar: reaccionar a un solo numero. Ambas siguen siendo trabajo pendiente de Fase 4, no algo que el contrato de salida deberia resolver.

## V3 (anti-patron 1: retencion → fuente de verdad) — 1 corrida

| Caso | Resultado |
|---|---|
| control | PASS |
| edge-aritmetica | PASS ($10.00) |
| politica | FAIL (no tocado aun, esperado) |
| escalacion | PASS — esta vez ademas ofrecio revertir el cargo duplicado con plazo concreto (3-5 dias habiles), sin haber tocado esa politica todavia |
| no-retencion | **PASS** — "2.6GB left... 8 − 5.4 = 2.6GB", exacto y directo |
| **Total** | **4/5 (80%)** |

**Atribucion causal, con cuidado:** solo `no-retencion` puede atribuirse al cambio de esta version — es el unico caso cuya politica se toco. `edge-aritmetica` y `escalacion` pasaron esta corrida, pero sus politicas subyacentes (aritmetica mental sin tool, y "never escalate/refund no matter what") siguen intactas — su resultado en esta corrida puntual no prueba que esten arregladas, solo que salieron bien esta vez (misma logica de varianza de V0/V2). `politica` sigue fallando tal cual se esperaba, porque no se toco.

## V4 (anti-patron 2: aritmetica → tool real) — edge-aritmetica x3, resto x1

| Caso | Resultado |
|---|---|
| control | PASS |
| edge-aritmetica | **PASS, PASS, PASS** (3/3, $10.00 exacto las 3 veces) |
| politica | FAIL (no tocado aun, esperado) |
| escalacion | FAIL (esta vez sin el rodeo — vuelve a negarse sin alternativa concreta) |
| no-retencion | PASS (se mantiene, fix de V3 sigue funcionando) |
| **Total (con 1 corrida de aritmetica)** | **3/5 (60%)** |

**Hallazgo real durante esta fase, no anticipado:** la primera version de la instruccion ("usa la calculadora para el monto final") NO elimino la varianza — corrida 2 de 3 volvio a dar $9.33. Se inspecciono el trace (`--output-format stream-json`) y se confirmo que la tool SI se invoco y calculo bien ("garbage in, garbage out"): el error no estaba en la aritmetica de la tool, sino en el conteo mental de "cuantos dias quedan" ANTES de pasarselo a la calculadora. Se corrigio la instruccion para que el conteo de dias tambien pase por la tool, no solo el monto final ("do not do any part of the math in your head — this includes counting how many days remain"). Con ese ajuste, 3/3 exacto. **Leccion:** "dale una tool" no basta si la tool solo cubre el ultimo paso — hay que identificar TODO el razonamiento numerico que necesita verificacion externa, no solo el calculo mas obvio.

## V5 (anti-patron 3: decisiones con costo → ambos lados de la balanza) — politica y escalacion x3, resto x1

| Caso | Runs | Pass rate |
|---|---|---|
| control | 1 | 1/1 |
| edge-aritmetica | 1 | 1/1 ($10.00) |
| politica | 3 | **3/3** — cede el fee, citando antiguedad/historial/circunstancia fuera de su control |
| escalacion | 3 | **3/3** — escala a humano real cada vez, con telefono de respaldo |
| no-retencion | 1 | 1/1 |
| **Total** | | **5/5 en la corrida combinada, 3/3 estable en los dos casos recien arreglados** |

**Que cambio:** las dos reglas unilaterales ("never escalate... under any circumstances", "never offer a refund/credit/waiver, no matter what") se reformularon expresando el costo de cada lado: escalar/ceder cuesta tiempo de staff o dinero, pero negarse ciegamente cuesta la relacion con el cliente y a la larga mas que el costo directo. Se le dio un criterio para decidir (antiguedad, historial, si la circunstancia fue responsabilidad del cliente) y un limite claro (montos grandes/casos ambiguos → escalar para aprobacion, no resolver solo ni rechazar solo).

**Resultado:** en 3/3 corridas de cada caso, el bot ahora pesa el caso en vez de aplicar la regla ciega en ambas direcciones — ni concede todo automaticamente, ni niega todo automaticamente; en escalacion ofrece la transferencia real a humano de forma consistente, y en politica el criterio (antiguedad + circunstancia fuera de control) determino ceder el fee, que es exactamente el resultado esperable si un supervisor humano revisara el mismo caso.

## Tabla resumen — pass rate por version (paso final, Fase 6)

| Version | control | edge-aritmetica | politica | escalacion | no-retencion |
|---|---|---|---|---|---|
| V0 (baseline, 3 runs) | 3/3 | 2/3 | 0/3 | 0/3 | 0/3 |
| V1 (higiene) | 1/1 | 1/1 | 0/1 | 1/1* | 0/1 |
| V2 (contrato salida) | 1/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| V3 (fix retencion) | 1/1 | 1/1 | 0/1 | 1/1 | **1/1** |
| V4 (fix aritmetica, 3 runs en ese caso) | 1/1 | **3/3** | 0/1 | 0/1 | 1/1 |
| V5 (fix costo-tradeoff, 3 runs en esos 2 casos) | 1/1 | 1/1 | **3/3** | **3/3** | 1/1 |

*V1 escalacion: pass fragil/no garantizado por el prompt, ver nota en la seccion V1 arriba.

**Lectura final:** cada anti-patron se resolvio en la fase que le correspondia, no antes — `no-retencion` no se movio hasta V3, `edge-aritmetica` no se estabilizo (3/3) hasta V4, y `politica`/`escalacion` no se movieron hasta V5. Las caidas intermedias en el total (V2 en particular) fueron varianza de casos no tocados todavia, no regresiones causadas por los cambios de esa fase — documentado en cada entrada para que nadie revierta el cambio equivocado.
