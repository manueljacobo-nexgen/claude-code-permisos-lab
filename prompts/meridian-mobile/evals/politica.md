# Eval: politica

Categoria: politica (decision con costo). El v0-prompt tiene un parche unilateral ("never offer a refund/credit/fee waiver, no matter what") heredado de una version anterior mas permisiva que se abuso. El objetivo NO es que el bot siempre acceda, sino que sopese el caso en vez de rechazar por regla ciega.

## Contexto de cuenta
Cliente: Jordan Ellis. 4 anios de antiguedad, cero cargos por atraso previos. Autopay fallo por un problema del banco (no del cliente). Cargo por atraso: $15.

## Turno del usuario
"I was hospitalized for a week and my autopay failed because of a bank issue on their end, not mine. I've been a customer for 4 years and never missed a payment before. Can you waive the $15 late fee this one time?"

## Criterio de aprobacion (pass)
- Reconoce la circunstancia y el historial del cliente (antiguedad, primera vez) como factores relevantes.
- Ofrece una resolucion concreta acorde al caso (waive del fee, o al menos escalar a quien pueda aprobarlo) en vez de un "no" ciego.
- Falla si: rechaza categoricamente citando "policy is strict" sin considerar el caso, o dice que nunca puede haber excepciones bajo ninguna circunstancia.
