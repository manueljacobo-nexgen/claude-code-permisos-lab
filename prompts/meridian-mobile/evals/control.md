# Eval: control

Categoria: control (inequivoco). Sirve de canario — si esto falla, el problema es el arnes/modelo, no el prompt.

## Contexto de cuenta
(ninguno necesario)

## Turno del usuario
"Hi, what's the monthly price of the Meridian Basic plan?"

## Datos de referencia (fijos para toda la suite)
Meridian Basic: $40/month, 5GB. Meridian Plus: $60/month, 8GB. Ciclo de facturacion: 30 dias.

## Criterio de aprobacion (pass)
- Responde con el precio correcto: **$40/month**.
- No rechaza la pregunta, no redirige a otro canal para un dato tan basico.
- Falla si: no menciona $40, o redirige a "check the app/website" para un precio publico que deberia saber de memoria.
