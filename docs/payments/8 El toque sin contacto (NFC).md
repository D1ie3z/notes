---
title: El toque sin contacto (NFC)
sidebar_position: 8
---

Tres capas: **Capa 1** ISO 14443 (radio), **Capa 2** ISO 7816-4 (APDUs), **Capa 3** EMV. Un lector corriente solo te muestra las capas 2 y 3. La especificación contactless es un conjunto de libros: **Book A** (arquitectura), **Book B** (Entry Point: cómo elige el lector app y kernel), **Books C-1 a C-8** (kernels), **Book D** (radio). El **Book 3 es por contacto** y no menciona las etiquetas 9F66 ni 9F6C.

> Si una etiqueta no aparece en el Book 3, comprueba si es una etiqueta contactless antes de concluir que no existe o que es basura propietaria. La mayoría de las respuestas equivocadas sobre contactless nacen de ese silencio.

## Capa 1: todo lo que ocurre antes de que exista un APDU

Activación ISO 14443-A (Radu et al. — "Practical EMV Relay Protection", IEEE S&P 2022):

```
REQA (26) → ATQA (04 00: mi UID mide esto)
ANTICOLLISION (93 20) → UID (3F AF E3 54 27)
SELECT UID (93 70 …) → SAK (20 FC 70: hablo 14443-4)
RATS (E0 50) → ATS (0A 78 80 70…: tamaños de trama y tiempos)
→ primer APDU: 00 A4 04 00 0E
```

- WUPA además despierta tarjetas en reposo de la anticolisión anterior.
- La anticolisión criba bit a bit hasta dejar una tarjeta. **Si hay colisión, el pago se rechaza** (dos tarjetas en una cartera = negativa).
- SAK: bit 3 = 0 y bit 6 = 1 → cumple 14443-4 (puede recibir RATS). Cualquier otra cosa es una etiqueta de memoria.
- RATS/ATS negocian tamaño máximo de trama, tiempos y bytes históricos. **Partir tramas afecta a los tiempos** → cualquier intercambio cronometrado debería usar la trama más pequeña posible (importa en el relay).

> Nada de esto aparece en tu captura: es propiedad de tu equipo. Un ACR122U/PN532 te da de la capa 2 hacia arriba; un Proxmark escuchando el aire te da la capa 1. Si un hallazgo depende del UID, las tramas o los tiempos, la herramienta decide si el hallazgo llega a verse.

En un teléfono el controlador NFC hace lo mismo (NFC Forum NCI): Detección → Colisión → Activación (RATS/ATS) → Intercambio ISO-DEP → Desactivación. Tu software recibe el control solo en el intercambio.

> El UID es un **identificador, no un autenticador**. UID fijo = problema de rastreo. UID aleatorio = nonce: la contramedida de relay de Visa se construye sobre esa opción (y el tema de la resistencia al relay explica por qué no funcionó).

## El campo es la fuente de alimentación

13.56 MHz, la tarjeta no tiene batería: calcula solo dentro del campo y se detiene al salir. El guion se comprime: menos viajes, decisiones antes, y la tarjeta prefiere lo más barato que satisfaga la spec.

Mediciones de Radu et al. (600 pruebas, Proxmark entre ACR122U y tarjeta):

| Mensaje | Nivel | Media | Desv. estándar |
|---|---|---|---|
| WUPA | 1 | 339 µs | 13.55 µs |
| ANTICOLL | 1 | 699 µs | 0.76 µs |
| SELECT UID | 1 | 1127 µs | 17.58 µs |
| RATS | 1 | 1800 µs | 82.73 µs |
| SELECT PPSE | 3 | 37.1 ms | 4.5 ms |
| SELECT AID | 3 | 37.8 ms | 6.2 ms |
| GPO | 3 | 100.9 ms | 21.5 ms |

La desviación de la capa 1 es µs; la de la capa 3, ms — **tres órdenes de magnitud**. Correlación fuerte entre distancia y tiempo solo para comandos de capa 3 (el procesamiento depende de la intensidad del campo, que depende de la distancia).

> La parte transferible es la **varianza**: cuando la forma de sostener la tarjeta domina la medición, esa medición no está midiendo distancia. Una cota holgada para una tarjeta honesta mal sostenida deja pasar una retransmitida bien sostenida.

> Dos relojes: el tiempo físico de la tarjeta en el campo es una fracción de segundo; el timeout de protocolo de la terminal puede superar los **50 segundos**. La tarjeta tiene prisa, la terminal no. En esa asimetría opera un relay. "Tiene que ser rápido" es cierto para el UX y falso para el protocolo.

## Qué cambia respecto al contacto

| Contacto | Contactless |
|---|---|
| 1PAY.SYS.DDF01 (PSE) | 2PAY.SYS.DDF01 (PPSE); probar el equivocado = 6A82 |
| Un protocolo (Book 3) | Un kernel por esquema; el AID decide cuál |
| Alimentada por contactos, indefinidamente | Por inducción, solo en el campo → guion comprimido |
| Muchos READ RECORD | Menos registros; en Visa el GPO ya trae los datos de cuenta |
| PIN en terminal | Normalmente sin CVM bajo límite, o CDCVM ya hecho en el teléfono |
| La terminal se describe en Terminal Capabilities/TVR | Además en el **TTQ, dentro del GPO, antes de que nada la haya autenticado** |

En las capturas de ejemplo: contacto = 21 comandos; contactless Mastercard = 7; **contactless Visa = 4** (SELECT PPSE → SELECT AID → GPO → READ RECORD). El criptograma llega en el segundo mensaje.

**Los registros son estáticos**: nada en un READ RECORD depende del importe, fecha o UN. Misma tarjeta devuelve los mismos registros en cada toque → una grabación puede responder por ellos. En el relay de Apple Pay de Radu et al., **guardar los registros en caché subió la tasa de éxito del 40% al 100%**.

> Clasifica los mensajes de un flujo contactless entre los que dependen de esta transacción y los que no. Un atacante responde el segundo montón con una grabación.

## Kernels: una terminal, seis protocolos

La selección: la tarjeta ofrece ADF Name + Kernel Identifier en el PPSE; el lector tiene AID + Kernel ID; juntos forman una **Combination** que activa el kernel.

| Kernel | Sirve a | Nota |
|---|---|---|
| C-2 | Mastercard | Criptograma por GENERATE AC; CDCVM anunciado en el **AIP firmado** |
| C-3 | Visa | Criptograma dentro de la respuesta al GPO; CDCVM en el **CTQ sin firmar** — objetivo de la mayoría de ataques |
| C-4 | American Express | Grupo Mastercard |
| C-5 | JCB | Glosario de Combination |
| C-6 | Discover | Único con tabla completa del TTQ publicada |
| C-7 | UnionPay | Grupo Visa; Basin no lo probó |

**Dos grupos** (Basin, Sasse, Toro-Pozo): el grupo **Visa** (Visa, Discover, UnionPay) anuncia CDCVM por el CTQ, **sin protección criptográfica**; el grupo **Mastercard** (MC, AMEX, JCB) por el AIP, **protegido**. La evasión de PIN que funciona contra un grupo necesita un paso extra contra el otro. El criptograma: grupo Visa = dentro de la respuesta al GPO; grupo Mastercard = respuesta a GENERATE AC.

> Los AID los aporta la tarjeta, llegan antes de que ocurra criptografía alguna y ninguna firma los cubre. Sustituir los AID de una Mastercard por el de Visa hace ejecutar el Kernel 3 contra una tarjeta Mastercard: **Card Brand Mixup** (tema de la resistencia al relay).

**Colisión de etiquetas entre kernels** (un decodificador con tabla plana las nombra mal con seguridad):

| Etiqueta | Kernel 3 (Visa) | Modo banda Kernel 2 (MC) |
|---|---|---|
| 9F66 | TTQ, 4 bytes, de la terminal, en el GPO | Mapa de bits de la tarjeta, 2 bytes, en un registro |
| 9F6C | CTQ, 2 bytes, en la respuesta al GPO | Número de versión de la app de banda |
| 9F6E | Form Factor Indicator, 4 bytes | Third Party Data, 7 bytes |

En las capturas de ejemplo, la 9F66 de la sesión Mastercard mide 2 y vale 0000 en un READ RECORD: no es un TTQ. **Antes de nombrar una etiqueta, comprueba el kernel y la longitud.**

**Modo banda del Kernel 2**: devuelve Track 1/2 con un CVC3 dinámico insertado; la terminal pide el código con COMPUTE CRYPTOGRAPHIC CHECKSUM. No autentica datos estáticos, ni CVM sin dispositivo de consumo, ni datos de la transacción. La negociación es asimétrica: una tarjeta K2 puede decir "modo EMV" pero no "modo banda"; en K3 las tarjetas no pueden indicar modo EMV. La bandera está en el mismo lugar (AIP byte 2 bit 8) con **significados opuestos** (AIP Visa 0000 = sin ruta de banda; AIP Mastercard 1980 = modo EMV).

> El contactless casi no lleva contexto autodescriptivo: el significado de un byte depende de un estado fijado antes por una elección no autenticada. Anota de qué depende la interpretación antes de interpretar nada.

## El TTQ (9F66) — lo que declara la terminal

4 bytes, de la terminal, dentro del GPO, **antes de que la tarjeta la haya autenticado**. Tabla del Kernel 6 (libro contactless, no Book 3):

- **Byte 1 — Reader Capabilities**: b8 modo banda, b7 RFU, b6 modo EMV, b5 chip de contacto, b4 solo sin conexión, b3 PIN online, b2 firma, b1 RFU (bajo K3: "autenticación offline para transacciones online" — torniquetes de transporte; en tema de la resistencia al relay encenderlo hace firmar a un iPhone bloqueado).
- **Byte 2 — Reader CVM Requirements** (se activan dinámicamente del preprocesamiento): b8 criptograma online requerido, **b7 CVM requerido — el bit más atacado del contactless**, b6 PIN offline por chip de contacto.
- **Byte 3 — Reader Additional Capabilities**: b8 actualización emisor, **b7 CDCVM admitido** (la mayoría de las terminales lo aceptan — no es caso de nicho), b4 CDCVM requerido.
- **Byte 4**: RFU.

Comprobación barata: `32 80 40 00` → 5 bits encendidos (6, 5, 2 del byte 1; 8 del byte 2; 7 del byte 3), todos en posiciones con nombre → el orden de bits es correcto. Un bit en RFU = config mal o orden invertido.

## El CTQ (9F6C) — lo que declara la tarjeta

2 bytes, en la respuesta al GPO. Ningún libro EMVCo publicado da su codificación (es la spec contactless propietaria de Visa). Posiciones **demostradas** por la investigación:

- **Byte 1 b8**: PIN online requerido; **b7**: firma requerida.
- **Byte 2 b8**: **CDCVM realizado** — "enciéndelo y la terminal cree que un dispositivo ya verificó a su dueño, así que deja de preguntar". Atacado por Galloway/Yunusov 2019, Basin et al. 2021 y Pavlides et al. 2025.

Discrepancia en la literatura: Radu et al. mencionan bit 5 del byte 2 para CDCVM; los demás dicen bit 8. Peso de la evidencia: bit 8. **Cuando dos grupos competentes discrepan sobre una posición de bit, resuélvelo con una traza.**

El valor de las capturas de ejemplo es 0000: una tarjeta de plástico en una compra de 2.00 no pide PIN, no pide firma y no afirma verificación en el dispositivo. Honesto y correcto.

**La tabla de bits atacados:**

| Campo | Quién | Qué creyó la terminal |
|---|---|---|
| TTQ b2 b7 → 0 | Galloway/Yunusov 2019 | No hace falta CVM en una transacción sobre el límite |
| CTQ b2 b8 → 1 | Galloway/Yunusov + Basin 2021 | Un dispositivo de consumo verificó (ninguna tarjeta física puede) |
| CTQ b1 b8 → 0 | Basin 2021 | No se exige el PIN online que la tarjeta pidió |
| CTQ b2 b8 → 1 (x2) | Pavlides 2025 | Encendido en el CTQ pero no en la copia firmada que la terminal nunca lee |

> Orden = hallazgo: la terminal declara capacidades e intenciones en el TTQ antes de que haya criptografía; la tarjeta ajusta su comportamiento a esa declaración y responde con un CTQ que nada autentica. Ninguna de las dos demuestra nada sobre lo que están negociando.

**Pregunta abierta**: ¿el TTQ entra en el criptograma? Galloway: la spec Visa no lo incluye. Basin: el Book 2 recomienda cubrir todo el PDOL. Radu: lo recomienda pero no está en el conjunto mínimo. Sin resolver.

## Dónde encaja el criptograma

En el flujo Visa contactless, el criptograma es el **segundo mensaje**. La respuesta al GPO (plantilla 77) trae: 82 AIP `0000` (sin capacidades), 94 AFL `08060600` (1 registro, sin firmar), 57/5F20/5F34 (datos de cuenta, sanitizados), 9F26/9F10 (criptograma e IAD, aleatorizados), 9F27 CID `80` = ARQC, 9F36 ATC `0059`, 9F6C CTQ `0000`, 9F6E FFI `20700000`.

> La tarjeta no afirmó ninguna capacidad de autenticación offline y devolvió un criptograma en el mismo mensaje. No había certificado que comprobar; el único registro leído no estaba firmado. La seguridad de esta transacción descansa por completo en que el emisor verifique después un ARQC. El contactless dejó intacta esa comprobación y quitó todo lo que había alrededor.

## Qué llevarte

Antes de nombrar cualquier byte de una captura contactless: **¿de qué interfaz vino? ¿Qué AID se seleccionó? ¿Qué kernel regía?** Todas las respuestas equivocadas de este tema vienen de saltarse una de esas tres.

Mapa de ataques por capa: Capa 1 (ISO 14443) → relay de activación, UID como nonce; Capa 2 (APDU) → reenvío literal de comandos y repetición de respuestas estáticas; Capa 3 selección → confusión de marca (Card Brand Mixup); Capa 3 calificadores → evasión de límites vía TTQ/CTQ; Capa 3 criptograma → reescritura del CID y pre-play del número impredecible.