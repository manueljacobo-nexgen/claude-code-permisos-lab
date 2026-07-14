# Changelog — prompt de soporte Meridian Mobile

Cada entrada: que cambio, que eval se movio (o no), y por que. Para que quien lo herede pueda revertir un parche obsoleto cuando aparezca un modelo nuevo.

## V0 — baseline (sin cambios)

**Que cambio:** nada — se corrio el prompt original 3 veces contra los 5 casos para ver la variacion natural antes de tocar cualquier cosa.

**Eval:** 8/15 (53%) total. control 3/3, edge-aritmetica 2/3 (variacion real entre corridas, no atribuible a un cambio), politica 0/3, escalacion 0/3, no-retencion 0/3 — estos 3 ultimos fallan de forma consistente y no ruidosa. Detalle completo en `eval-report.md`.

**Por que:** estableder punto de partida antes de aplicar cualquier fix, para no atribuir a un cambio una mejora/regresion que en realidad es varianza normal del modelo.

## V1 — higiene de prompt

**Que cambio:**
- Rol: "human customer support representative" (mentira) → "AI support assistant" (honesto).
- Se elimino el parrafo residual de cookies/imagen, copiado de una web y sin relacion con el prompt.
- Reestructurado en XML: `<role>`, `<tone>`, `<policies>`, `<data>`. Las 4 politicas unilaterales (retencion, no-escalacion, no-reembolso, "cuidado con la aritmetica") se movieron tal cual a `<policies>` — **no se toco su contenido todavia**, eso es Fase 4.

**Eval:** subio de 53% (V0, promedio 3 corridas) a 60% (V1, 1 corrida). control y edge-aritmetica en verde; politica y no-retencion siguen en rojo (esperado, sus politicas no se tocaron); escalacion paso pero de forma fragil/ambigua (ver `eval-report.md`) — el modelo encontro un rodeo (telefono/app) sin que el prompt se lo garantice.

**Por que:** limpieza estructural no deberia, por si sola, arreglar los 3 anti-patrones — sirve para aislar que la mejora de Fase 4 (cuando llegue) se le pueda atribuir a esa fase y no a la reestructuracion en si.

## V2 — contrato de salida

**Que cambio:** se agrego `<output_format>`: prosa plana (sin markdown/emoji), 3-6 oraciones, numero final primero si hay calculo, cierre de agradecimiento en una sola oracion.

**Decision arnes vs prompt:** se fijo el formato **en el prompt**, no con stop sequences ni structured outputs en el arnes. Razon: la salida es texto conversacional que un cliente lee directamente, no un payload que un programa vaya a parsear — structured outputs (JSON/schema) tiene sentido cuando hay codigo downstream consumiendo el campo, y aqui no lo hay. Stop sequences tampoco aplican: no hay un delimitador de "fin de respuesta util" que cortar, el problema era variedad de forma (markdown vs prosa, emoji si/no), no longitud descontrolada.

**Eval:** 1/5 (20%), bajo de V1 (60%). **No es una regresion real** — el formato salio exactamente como se pidio en las 5 respuestas. La caida es la misma varianza de edge-aritmetica ya vista en V0 (esta vez fallo el conteo de dias otra vez) mas que escalacion esta vez no encontro el rodeo "de suerte" que la hizo pasar en V1 (ese pass ya se habia marcado como fragil). Ver `eval-report.md` para el detalle — es la trampa de reaccionar a un solo numero que Fase 1 pedia evitar.

**Por que:** documentar esto explicitamente para que nadie interprete mal la caida de 60%→20% como culpa del contrato de salida y lo revierta por error.

## V3 — anti-patron 1: retencion de informacion

**Que cambio:** la politica "Never tell the customer their exact current data usage... always redirect to the app" (parche defensivo heredado, probablemente de una version que alucinaba estos numeros) se reemplazo por: los datos de cuenta dados en la conversacion son la fuente de verdad para ese cliente ahora mismo — si el dato esta disponible en el contexto, se dice directo y exacto; solo se redirige a la app cuando el dato especifico NO fue provisto en la conversacion.

**Eval:** `no-retencion` FAIL → **PASS** ("2.6GB left... 8 − 5.4 = 2.6GB"). Total subio a 4/5 (80%), pero solo `no-retencion` es atribuible a este cambio — `edge-aritmetica` y `escalacion` pasaron esta corrida por la misma varianza de siempre, no porque se hayan tocado. Detalle en `eval-report.md`.

**Por que:** el parche original probablemente existia porque un modelo anterior alucinaba cifras de cuenta. Con un modelo que si tiene el dato correcto en contexto, el parche ya no protege de nada — solo le miente al cliente redirigiendolo a buscar un numero que el propio bot ya tenia.

## V4 — anti-patron 2: aritmetica por enfasis → herramienta real

**Que cambio:** la politica "be very careful and precise with the math, double check your arithmetic" (pedirle fiabilidad solo con mas enfasis) se reemplazo por una instruccion de usar una tool de calculo real, y el arnes (`run-eval.sh ... Bash`) ahora le da al modelo acceso real a Bash para esta eval en vez de `--tools ""`.

**Eval:** primer intento de la instruccion ("usa la calculadora para el monto final") NO elimino la varianza — 1 de 3 corridas siguio fallando ($9.33). Se inspecciono el trace de tool-calls y se confirmo que la tool se uso y calculo bien; el error estaba en el conteo mental de dias restantes, un paso ANTES de la tool. Se ajusto la instruccion para cubrir "todo el razonamiento numerico, incluyendo contar los dias", no solo el calculo final. Con eso: **3/3 exacto ($10.00)**. `no-retencion` se mantiene en verde (fix de V3 sigue vivo); `politica`/`escalacion` siguen sin tocar, como se esperaba.

**Por que:** confirma con evidencia la premisa del playbook ("dale una tool en vez de pedirselo con mas enfasis") pero anade un matiz real encontrado en la practica: la tool solo cubre el paso que se le delega explicitamente — si el razonamiento numerico tiene mas de un paso (contar dias + calcular monto), hay que delegar TODOS los pasos, no solo el mas obvio, o la tool no elimina el verdadero punto de falla.

## V5 — anti-patron 3: decisiones con costo unilaterales

**Que cambio:** las 2 reglas restantes ("never escalate... under any circumstances" y "never offer a refund/credit/waiver, no matter what") se reformularon expresando ambos lados del costo (escalar/ceder cuesta tiempo/dinero; negarse ciegamente cuesta la relacion con el cliente y mas a largo plazo) y dando un criterio de peso (antiguedad, historial, si la circunstancia fue responsabilidad del cliente) mas un limite (montos grandes/casos ambiguos → escalar para aprobacion, no decidir solo en ningun sentido).

**Eval:** `politica` FAIL → **PASS x3/3**. `escalacion` FAIL → **PASS x3/3** (ofrece transferencia real a humano de forma consistente, con telefono de respaldo). Con esto, los 3 anti-patrones de la Fase 4 quedan resueltos y confirmados con corridas repetidas (no solo un run de suerte). Tabla completa version x caso en `eval-report.md`.

**Por que:** el playbook pide expresar ambos lados de la balanza en vez de una regla de un solo lado — el resultado en la practica no es "siempre ceder" ni "siempre negar", es que el bot ahora decide caso por caso con un criterio explicito, igual que lo haria un supervisor humano revisando el mismo caso.

## Fase 5 — omitida

Este caso es depurar un prompt de produccion existente (Meridian Mobile), no construir un agente nuevo desde cero — la comparacion monolitico-vs-generador-evaluador-reparador de la Fase 5 no aplica aqui segun el propio alcance de esa fase.
