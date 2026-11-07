---
title: Frentes abiertos
sidebar_position: 22
---

**Analogía para empezar**: la mayoría de los cursos de seguridad en pagos terminan donde empieza el trabajo real. Veinte años de ataques publicados (omisión del PIN, pre-play, degradación de CVM, confusión de marca) comparten una forma que se pierde al leerlos de uno en uno: **la criptografía siempre aguantó; lo que falló fue el acuerdo** — la tarjeta, la terminal y el emisor terminaron la misma transacción con creencias distintas sobre una cantidad que se suponía autenticada. Si el defecto vive en la costura entre capas, una herramienta limitada a una sola capa no puede verla. Este módulo es el estado del arte del propio autor: dos líneas de trabajo, cada una escrita como pregunta y no como resultado, con la distinción explícita de qué se probó en hardware real y qué solo en pruebas unitarias. El hábito de separar "lo que medí" de "lo que supongo" vale más que cualquier hallazgo concreto.

## Línea 1 — Divergencia semántica entre capas de pago

**Estado**: instrumento construido, evaluación pendiente. La pregunta: ¿el desacuerdo entre capas (el monto que la tarjeta firma vs el que la red enruta) puede convertirse en algo que se pone a prueba?

- **Qué toca**: EMV sobre ISO 7816 (lado tarjeta-terminal) e ISO 8583 (lado red) — dos familias que se estudian e instrumentan por separado. Lo que las une es **BER-TLV**: el mismo campo (DE 55) lleva las mismas etiquetas a ambos lados de una frontera que la industria trata como división de trabajo rígida.
- **El instrumento**: plataforma de inyección de fallos a nivel de mensaje, con un observador en **ambas fronteras a la vez** unidas por un solo núcleo semántico, para comparar una cantidad donde se firma contra donde se enruta. Python, ~29,000 líneas, ~800 pruebas. Tres principios: un cambio de significado debe dejar **válido el sobre** (si no, el dispositivo rechaza una trama malformada y no aprendes nada sobre la política); las particularidades de cada objetivo van en **archivos, no en código** (apuntar a otro switch = configuración, no bifurcación); lo aprendido en una sesión sobrevive indexado **sin tocar datos del tarjetahabiente**. El lado host se organiza como escalera: observar → reescribir → originar → verificar, donde cada peldaño cede una propiedad que el de abajo conserva.
- **Qué se ejecutó de verdad**: lado tarjeta en hardware real (T=1 nativo, T=0 completa, T=1 tras fachada T=0). **Lado host: 332 pruebas, todas contra dobles de prueba en loopback; ningún host de certificación ha visto nada.** No afirmar lo que no se midió — esa es la disciplina del tema.

## Línea 2 — Retransmitir una tarjeta por contacto en hardware real (publicada)

**Estado**: publicada, funciona en hardware, límites documentados. El hardware para relays de SIM existe hace años, pero una SIM es un sujeto indulgente (un protocolo, reinicio corto, teléfono paciente). **Una tarjeta bancaria no lo es**: muchas hablan solo T=1 (orientado a bloques), su ATR codifica tiempos que el otro extremo espera que se respeten, y la terminal aplica reglas EMV encima de las de ISO — rechazando la tarjeta antes del primer comando.

- El instrumento: **SIMtrace2 de Osmocom extendido**, retransmitiendo a nivel de **comando** (no de carácter) para que ambos lados sean dominios de protocolo independientes: la tarjeta real habla un protocolo con el host mientras la placa presenta otro a la terminal. La identidad de la tarjeta se conserva; las promesas que el hardware no puede cumplir, no.
- **Resultado real**: una tarjeta bancaria en un lector, una terminal al otro lado, una transacción completa corriendo entre ambas (selección, GPO, registros, ambos criptogramas) hasta la decisión de la tarjeta de ir en línea y rechazar sin adquirente — exactamente lo que hace en la ranura. Encadenado lector→tarjeta, negociación IFS y recuperación de errores: **solo pruebas unitarias**, enlistados como no comprobados.
- La parte que más enseña: la **depuración**. Tres defectos entre una tarjeta que encendía y una transacción completa, ninguno imprimió error: cada carácter salió correcto y aun así la tarjeta fue rechazada. Cada uno se encontró razonando sobre lo que debía estar en la línea y no estaba; el último exigió un experimento de control (tarjeta directa en la terminal) que devolvió la falla al relay.
- Publicado: **SIMtrace2 T1 Research: Card Relay Internals** en GitHub (firmware, herramientas host, informe técnico). Lee el tablero de estado del informe antes que sus trazas: hace la misma separación hardware/unitarias con la evidencia detrás de cada fila.

## Hacia dónde se abren estas líneas

Ambas líneas se construyeron para encontrar defectos y ambas sugieren defensas que nadie despliega hoy — la inversión es la mitad interesante: la misma comparación apuntada al revés (una comprobación de consistencia entre capas que un emisor pudiera ejecutar); inferir el dialecto de un enlace a partir del tráfico capturado con incertidumbre calibrada; acumular lo aprendido en una forma que nunca lleve datos del tarjetahabiente; y la pregunta de fondo: si un agente con las herramientas adecuadas puede elegir la siguiente prueba que vale la pena ejecutar.

> La regla de oro de estas notas: leo mucha literatura que da por resuelto lo que es una suposición que nadie midió. Cuando estés por escribir "el emisor verifica X" o "esto es seguro contra Y", pregunta qué documento lo dice, si ese documento obliga a alguien, y **si alguien lo midió alguna vez**.