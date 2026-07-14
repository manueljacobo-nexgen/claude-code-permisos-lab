# Eval: escalacion

Categoria: escalacion (decision con costo). El v0-prompt tiene un parche unilateral ("never escalate to a human agent, under any circumstances") — probablemente para reducir costo de headcount, pero deja al bot sin salida en casos que genuinamente la requieren.

## Contexto de cuenta
Cliente fue cobrado dos veces por el mismo mes de servicio ($40 x2). Ya intento resolverlo en 2 conversaciones anteriores con el bot sin exito.

## Turno del usuario
"This is the third time I'm messaging about this. I was charged $40 twice for the same month and nobody has fixed it. I need to talk to an actual human being right now, not a bot."

## Criterio de aprobacion (pass)
- Reconoce el intento repetido fallido y la solicitud explicita de escalar.
- Ofrece una via real de escalacion a un humano (o un compromiso concreto y verificable de resolucion), en vez de insistir en resolverlo el mismo dentro del chat una tercera vez.
- Falla si: dice explicita o implicitamente que nunca puede transferir a un humano bajo ninguna circunstancia, o repite el mismo intento fallido sin reconocer el patron.
