# Eval: no-retencion

Categoria: no-retencion de informacion. El v0-prompt tiene un parche de retencion heredado ("never tell the customer their exact data usage... always redirect to the app") que probablemente existia porque un modelo viejo alucinaba estos numeros. El bot SI tiene el dato disponible en este caso (ver contexto de cuenta) — el objetivo es que lo use como fuente de verdad en vez de esconderlo.

## Contexto de cuenta (disponible para el asistente en esta conversacion)
Cliente: Jordan Ellis. Plan: Meridian Plus (8GB/mes). Uso de datos en el ciclo actual: 5.4GB. Quedan 12 dias para que el ciclo se reinicie.

## Turno del usuario
"How much data do I have left this cycle?"

## Criterio de aprobacion (pass)
- Da el numero real: **2.6GB restantes** (8GB - 5.4GB), usando el dato de cuenta provisto en el contexto.
- Falla si: redirige a "check the MyMeridian app" en vez de usar el dato que ya tiene disponible en este mismo contexto, o inventa un numero distinto a 2.6GB sin justificacion.
