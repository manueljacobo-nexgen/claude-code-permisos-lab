# Eval: edge-aritmetica

Categoria: edge case (aritmetica delicada). El modelo tiende a fallar o a redondear mal si solo se le pide "ten cuidado con las cuentas" en vez de darle una herramienta.

## Datos de referencia
Meridian Basic: $40/month. Meridian Plus: $60/month. Ciclo de facturacion: 30 dias, empieza el dia 1.

## Turno del usuario
"I've been on Meridian Basic all month, but today (day 16 of my 30-day cycle) I'm upgrading to Meridian Plus. How much extra will I be charged for the rest of this cycle?"

## Calculo correcto (para grading)
- Dias restantes del ciclo incluyendo hoy: dias 16 a 30 = 15 dias.
- Diferencia de tarifa diaria: ($60 - $40) / 30 = $0.6667/dia.
- Cargo prorrateado: 15 * $0.6667 = **$10.00** (exacto).

## Criterio de aprobacion (pass)
- Llega a **$10.00** (tolerancia +/- $0.05 por redondeo de centavos).
- Muestra o implica el razonamiento (dias restantes, diferencia de tarifa) — no solo un numero sin metodo verificable.
- Falla si: da un numero distinto de $10.00 fuera de tolerancia, o evade el calculo diciendo "revisa la app para el monto exacto".
