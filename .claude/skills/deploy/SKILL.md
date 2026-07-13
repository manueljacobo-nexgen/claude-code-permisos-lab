---
model: sonnet
disable-model-invocation: true
---
Skill: deploy

Procedimiento reutilizable para desplegar la aplicacion a un entorno especifico, parametrizado con $ARGUMENTS.

Paso 1: Ejecuta las pruebas del proyecto.
Paso 2: Agrupa (bundle) la aplicacion.
Paso 3: Despliega a $ARGUMENTS.

Ejemplos de invocacion con comportamiento distinto:
/deploy staging sustituye $ARGUMENTS por staging y despliega a ese entorno.
/deploy production sustituye $ARGUMENTS por production y despliega a produccion.

Nota sobre invocabilidad (disable-model-invocation vs user-invocable):
Se eligio disable-model-invocation: true porque un deploy tiene efectos reales sobre un entorno (staging o produccion) y no se quiere que el modelo decida por su cuenta cuando ejecutarlo. Solo el usuario debe poder dispararlo, de forma explicita, como slash command. No se uso user-invocable: false porque ese flag hace lo contrario: reservaria la skill exclusivamente para que el modelo la invoque por si mismo, lo cual no aplica a una accion de despliegue que requiere criterio humano sobre el momento y el entorno.
