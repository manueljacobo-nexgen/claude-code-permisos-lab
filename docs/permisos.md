Permisos en Claude Code: allow, ask, deny, jerarquia y auto mode

Este documento resume la configuracion de permisos aplicada en este repo como parte del lab practico del modulo de permisos, auto mode y seguridad.

## Reglas configuradas en .claude/settings.json

En la seccion allow se incluyo Bash(npm run test), que se ejecuta sin pedir confirmacion porque es un comando repetitivo e inocuo. En la seccion ask se incluyo Bash(rm *), que siempre pide confirmacion; se deja en ask y no en deny para no dejar el proyecto lleno de archivos obsoletos que si deberian borrarse. En la seccion deny se incluyeron Bash(git push *) y Edit(package.json), que nunca se ejecutan aunque el modelo lo solicite, para proteger remotos y archivos criticos.

## Jerarquia de settings

El orden de precedencia es managed (empresa) mayor que usuario, y usuario mayor que proyecto. En este repo no existe una politica managed corporativa vigente, por lo que la configuracion de proyecto en .claude/settings.json es la que aplica. Si existiera una regla managed que prohibiera algo, esa regla ganaria siempre sobre la configuracion de este proyecto.

## Prueba de la jerarquia con package.json

Se agrego Edit(package.json) a la deny list. Al pedir explicitamente actualizar la version en package.json, la tool call del modelo existe pero el harness la bloquea: Claude responde que no puede realizar la edicion.

## Justificacion personal

Puse rm en ask y no en deny porque borrar archivos es una operacion legitima y frecuente durante el desarrollo (limpiar temporales, builds, dumps); un deny total dejaria el proyecto acumulando basura o me obligaria a salir del flujo para borrar a mano. Ask me da el punto medio: cada rm pasa por mis ojos antes de ejecutarse, asi que un borrado equivocado o inyectado nunca corre sin mi confirmacion. No uso dangerously-skip-permissions porque elimina la unica barrera entre una instruccion inyectada (desde un archivo o una web que el agente lea) y una accion destructiva o un push no deseado; las transcripciones de docs/evidencia/ muestran que el harness bloquea justo lo que estas reglas deben bloquear.

Las transcripciones de las pruebas estan en [docs/evidencia/transcripciones.md](evidencia/transcripciones.md).

## Auto mode y prompt injection

El auto mode ejecuta un clasificador entre cada tool call: solo pregunta ante acciones peligrosas no solicitadas y es mas sensible al contexto que el flujo tradicional, lo cual ayuda a detectar instrucciones inyectadas desde archivos o paginas web leidas por el agente.
