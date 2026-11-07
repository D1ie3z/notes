---
title: La caja de herramientas
sidebar_position: 2
---

## Empezar sin hardware

Estas notas enseñan a leer una transacción de pago byte a byte: cada APDU, cada palabra de estado, cada objeto TLV. Para practicar necesitas capturas, y conseguirlas es más fácil de lo que parece:

- Con tu propia tarjeta y cualquier lector (un ACR122U de ~20 dólares, o un teléfono Android con una app de NFC) sacas capturas reales en minutos.
- Los ejemplos concretos que se citan en estas notas se pueden reproducir con cualquier captura equivalente que generes tú.

> Toda la parte de fundamentos se estudia sin comprar nada de hardware: leer trazas bien anotadas te enseña el protocolo. El hardware añade otra capacidad — producir tus propias evidencias y reproducir comportamientos fuera de la teoría. Antes de comprar, define qué pregunta quieres responder y en qué capa vive esa respuesta.

## Herramientas de un vistazo

| Herramienta | Para qué |
|---|---|
| ATRIUM | Se pone entre tarjeta y terminal: lee, decodifica, registra y reescribe. Capa host habla ISO 8583. Repite capturas sin hardware o traza en vivo. Viene en la VM |
| Plexus | Arma relays como grafo de nodos: lo dibuja, lo revisa y lo ejecuta. Te avisa cuando una cadena se pasa de tiempo |
| ACR122U / PN532 | Lector contactless NFC por USB, con libnfc y Python |
| Proxmark3 | RFID/NFC a bajo nivel: esnifa el intercambio entre tarjeta y terminal reales |
| SCR3310 | Lector EMV por contacto (el chip en la ranura) |
| SIMtrace2 | Traza EMV por contacto desde la ranura entre chip y terminal |
| SIMtrace2 T=1 | Investigación publicada: emula tarjeta y le responde a una terminal EMV sobre T=0/T=1 |
| BomberCat | NFC + banda magnética + el trabajo de relay |
| MagSpoof | Emula banda magnética con una bobina |
| ViolentMag | Banda magnética como audio: codifica la pista en un WAV y la reproduce por una bocina |
| MSR605 | Lee y escribe bandas físicas |
| Teléfono Android | El lector más barato: su pila NFC habla APDU con tarjetas |

> La distinción que decide la compra: ser un extremo de la conversación vs observarla. Un lector te muestra qué responde una tarjeta a tus preguntas. Un sniffer te muestra qué preguntó una terminal real y qué hizo la tarjeta, incluidas cosas que una terminal nunca te dejaría pedir.

Tres actividades distintas, ninguna herramienta hace las tres bien: **lector interactúa**, **sniffer observa**, **intermediario (MiTM) interactúa con ambos extremos**.

## Emular no es reproducir

- Reproducir = mandar una secuencia conocida.
- Emular = responder correctamente a las preguntas del otro extremo, incluidas las que no tenías previstas.

Para banda, emular es generar el patrón físico (MagSpoof). En NFC hay que participar en el protocolo de radio. En EMV por contacto, además, implementar transporte y lógica de aplicación.

## El entorno: la máquina virtual

VM de práctica = Ubuntu 26.04 con libnfc, pcscd, pilas de Python, Cardpeek, NFCGate, cliente de Proxmark3, ATRIUM, Plexus y la investigación T=1, todo hablándose entre sí. Usuario `payment` / `payment`. **Toma instantánea antes de cambiar nada** — existe para romperse y volver atrás.

> Verifica el SHA-256 antes de importar. Una descarga de 5.82 GB que perdió un byte falla después pareciendo imagen dañada, no descarga dañada, y te manda a depurar la máquina equivocada.

## Tres capas, y qué herramienta ve cuál

| Capa | Qué es | Quién la ve |
|---|---|---|
| Capa 3 | Aplicación EMV | Cualquier lector (PC/SC, libnfc) |
| Capa 2 | Intercambio de bytes APDU | Lector o cuña: ve cada comando |
| Capa 1 | Radio ISO 14443 | Proxmark3, el único abajo |

> "¿Por qué falló esa transacción?" casi siempre se responde en capa 3 con un lector de veinte dólares. "¿Cuánto tardó la tarjeta en responder?" NO se responde en capa 3 a ningún precio: las capas de abajo ya absorbieron el tiempo. Ajusta la herramienta a la pregunta, no al presupuesto.

## Cuatro papeles

| Papel | Eres | Puedes ver | No puedes |
|---|---|---|---|
| Lector | la terminal | todo lo que pides y cada respuesta | observar la transacción de alguien más |
| Objetivo | la tarjeta | qué pide una terminal real (aprendes su config) | producir un criptograma válido (no tienes la llave) |
| Sniffer | nadie | un intercambio auténtico sin tocarlo | cambiar nada; requiere hardware que escuche sin energizar |
| Intermediario | ambos | todo, reescribiendo al vuelo | prescindir de dos interfaces activas + enlace |

Los papers encajan ahí: pre-play = lector pidiendo números a cajeros; relay = intermediario con teléfono + tarjeta; mediciones de tiempo = sniffer (ningún participante puede medirse su propio tiempo).

## De un toque a un archivo publicable

**Captura → Anótalo (tarjeta, terminal, país, fecha) → Sanitiza → Guárdala**

> El orden es lo esencial: una captura limpiada en un paso posterior sigue en el historial, en el respaldo y en lo sincronizado. Sanitiza antes de guardar, no antes de publicar. No asumas que quitar el PAN basta: pueden quedar registros de aplicación, pistas, identificadores. La captura que investigas y la que publicas no tienen por qué ser el mismo archivo.

> Un resultado publicado dependió una vez del país: dos grupos llegaron a conclusiones opuestas sobre un bit Visa por encima del límite, uno en Reino Unido y otro en Suiza, con tarjetas que se comportan distinto, y ninguno registró el país como variable. Anota dónde estabas, qué se emitió dónde y qué firmware.

Comprueba tu sanitizador con algo que no sea tu sanitizador: dos comprobaciones independientes que discrepan justo cuando importa.

## Qué conseguir, y cuándo

Primero la pregunta, después la herramienta:
- ¿Qué responde una tarjeta? → lector
- ¿Qué hace una terminal real? → observar la terminal
- ¿Qué hay debajo de los APDU? → capa inferior
- ¿Modificar la comunicación? → intermediario

Los fundamentos se estudian solo con capturas. Si quieres ir más allá, compra un ACR122U o usa un teléfono con tus propias tarjetas. Comprar todo desde el principio solo añade drivers y dependencias.