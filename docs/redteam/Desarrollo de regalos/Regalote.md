---
title: Regalote
sidebar_position: 1
---

## ¿Qué es esta basura?

Y bueno no sé tengo muchas cosas que hablan sobre seguridad ofensiva y no sé porque no quiero ponerle el nombre que empieza con M y termina con Ware, tal vez para que no flagen mi sitio. Que pues son mis notas así que jaja.

Pero pues sip voy poniendo técnicas y así de esos regalos.

## Teoría


### ¿Que show con las defensas?

Ya no es "firmas estáticas de AV". Los controles que define el entorno moderno (Win11, Server reciente, enterprises) algunos son:

- **Microsoft Defender AV** + protección cloud (reputación en la nube)
- **Automatic sample submission** → tu binario llega a MS aunque nunca toque internet tú mismo
- **ASR rules** (Attack Surface Reduction)
- **AMSI (AntiMalware Scan Interface)** → inspección de scripts/.NET en memoria
- **Event tracing (ETW)** → telemetría a nivel kernel/user
- **EDR telemetry** → proceso, memoria, red, árbol de procesos
- **Smart App Control / WDAC (Windows Defender Application Control)** → control de qué corre
- **VBS (Virtualization Based Security)  / HVCI (Hypervisor-Protected Code Integrity) ** → integridad de código protegida por hipervisor
- **Protección de credenciales/identidad**
- **Logging centralizado, hunting e IR (incidente response) workflows**

> Conclusión clave: el MalDev moderno **no es "hacer un binario que ejecute"**, es gestionar cómo cada comportamiento interactúa con estas capas.

### Malware Development Life Cycle (MDLC)

Modelo de enseñanza, adaptación del SDLC. 6 etapas iterativas:

1. **Design & scope** → definir comportamiento a estudiar, lab, versión de Windows, controles a observar, y **qué queda fuera de scope**.
2. **Development** → construir en componentes pequeños y testeables.
3. **Functional testing** → verificar comportamiento en lab, debuggear crashes, validar edge cases, no afectar sistemas ajenos.
4. **Security control validation** → correr con defensas activas. Registrar qué se bloquea/loggea/alerta/deja pasar.  Los features cloud se comportan distinto que offline → entender la config del lab y reglas de manejo de muestras ANTES de testear.
5. **Telemetry & IoC analysis** → analizar IoCs (indicadores de compromiso) y telemetría generada: archivos, hashes, imports, process trees, command lines, registry, permisos de memoria, red, ETW, Event Logs, eventos de Defender, Sysmon, alertas EDR.
6. **Refinement & documentation** → mejorar el código, **mejorar la detección**, o documentar la lección.

> Después de la 6, se vuelve a la 1. **Iterativo**: cada cambio se testea por funcionalidad Y por telemetría que genera.

### Analogía

El MDLC es el ciclo de un cerrajero que también diseña las puertas:

- El SDLC tradicional = construir la puerta y ver que abre y cierra (funcional).
- El MDLC = construirla, luego pagar a un equipo de asaltantes para que intente forzarla (security control validation), anotar exactamente dónde crujió (telemetría/IoC), reforzar esa bisagra — y repetir.

Cada vuelta del bucle afila dos filos a la vez: el del ataque y el del detector. La etapa 5 no es "borrar huellas", es **entender qué huellas dejaste** — esas mismas son las reglas de detección que el lado EDR te hará escribir.

## Regla operativa

Toda técnica debe pasar por la pregunta del MDLC: *¿qué telemetría genera esto y qué defensor la puede convertir en detección?* Una nota de técnica que no responde eso está incompleta.