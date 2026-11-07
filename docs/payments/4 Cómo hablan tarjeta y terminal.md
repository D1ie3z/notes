---
title: Cómo hablan tarjeta y terminal
sidebar_position: 4
---

Todo lo que hace una tarjeta de pago se reduce a un diálogo: la terminal pregunta y la tarjeta responde, en un idioma llamado **APDU**. Si aprendes a leer ese idioma, una transacción deja de ser una caja negra y se convierte en una conversación que puedes seguir byte a byte: qué pidió la terminal, qué contestó la tarjeta y por qué. Esta nota te da las cuatro habilidades que sostienen todo lo demás:

1. **Nombrar un comando por sus 2 primeros bytes** (CLA + INS): saber si es un SELECT, un READ RECORD o un GENERATE AC sin mirar nada más.
2. **Decir cuál de los 4 casos es**: si el comando lleva datos, espera respuesta, o ambas cosas — eso define cómo se lee.
3. **Leer una palabra de estado como frase**: los 2 bytes finales de cada respuesta no son un aprobado/reprobado, dicen exactamente qué pasó (y qué no).
4. **Recorrer un árbol BER-TLV y reconstruir un GENERATE AC**: saber qué datos van dentro de un comando a partir de la lista que la propia tarjeta publicó.

El idioma no está cifrado: puedes leer todo el intercambio. La seguridad no está en esconder la conversación, sino en lo que la tarjeta firma al final (eso lo cubre la nota de la criptografía del chip).

## El protocolo no está cifrado

Puedes leer todo el intercambio. No hay llave de sesión entre terminal y tarjeta.

> La confidencialidad nunca fue el objetivo. EMV asume que el canal es observable y defiende otra propiedad: que un observador no pueda producir una transacción que el emisor apruebe. La protección está en el criptograma y los certificados, no en ocultar la conversación.

La **mensajería segura** (ISO 7816-4) existe pero solo para una familia: los scripts del emisor (bloquear tarjeta, resetear PIN), con CLA 8C/84 y MAC. Nada de una compra corriente viaja envuelto.

## Dos capas: APDU vs TPDU

El APDU es capa de aplicación; debajo hay un transporte (TPDU): T=0 por contacto, T=1 o equivalentes contactless. **61xx y 6Cxx son palabras de la capa de transporte** (sección 6.3.5 del Book 3), no llegan a la aplicación: la capa de abajo las resuelve.

> Cerca de la mitad de los intercambios de una captura por contacto son el transporte negociando longitudes. Cuando cuentes lo que hizo de verdad una transacción, cuenta APDUs, no líneas de log.

## El APDU de comando, byte a byte

Cabecera fija de 4 bytes + cuerpo opcional (Lc, datos, Le):

| Campo | Tamaño | Qué es |
|---|---|---|
| CLA | 1 | Quién definió el comando. Bit 8: 0 = interindustrial (ISO), 1 = propietaria. Nibble alto 0 → ISO 7816-4; 8 → EMVCo |
| INS | 1 | El comando. A4 SELECT, B2 READ RECORD, AE GENERATE AC, 20 VERIFY, 88 INTERNAL AUTH, 82 EXTERNAL AUTH, C0 GET RESPONSE, A8 GPO, CA GET DATA. 6X/9X inválidos (no se confunden con SW) |
| P1 P2 | 2 | Sin significado general: "No hay otra convención general". Cada comando define los suyos |
| Lc | 0-1 | Bytes de datos que siguen. Si no hay datos, **no aparece** |
| Datos | Lc | El argumento |
| Le | 0-1 | Techo de respuesta ("Nr ≤ Ne"). Ausente = no quiere datos; 00 = 256 |

Ejemplo (SELECT del PPSE):

```
00 A4 04 00 0E 32 50 41 59 2E 53 59 53 2E 44 44 46 30 31 00
00     → CLA interindustrial (ISO 7816-4)
A4     → SELECT
04     → P1: selección por nombre
00     → P2: primera ocurrencia, devuelve FCI
0E     → Lc: 14 bytes
32 50… → "2PAY.SYS.DDF01" ASCII
00     → Le: 256
```

> "1PAY.SYS.DDF01" = directorio por contacto (PSE). "2PAY.SYS.DDF01" = contactless (PPSE). Probar el equivocado → 6A82 (archivo no encontrado): varias capturas empiezan con lo que parece una falla y no lo es.

**Tabla de comandos (mapa de responsabilidades):** CLA `0x` → ISO (SELECT, READ RECORD, VERIFY, INTERNAL/EXTERNAL AUTH, GET RESPONSE). CLA `8x` → EMVCo (GPO, GENERATE AC, GET DATA, y 8C/84 de bloqueo/PIN con mensajería segura). Un comando desconocido: el nibble de CLA te dice en qué mitad de la biblioteca buscar.

Ojo con las capturas: herramientas genéricas etiquetan INS 88 como "RUN GSM ALGORITHM" (SIM). En tarjeta de pago con CLA 00, 88 = INTERNAL AUTHENTICATE. La anotación es la opinión de la herramienta.

## P1 y P2, comando por comando

| Comando | P1 | P2 |
|---|---|---|
| SELECT | Cómo interpretar datos (04 = nombre) | Ocurrencia y plantilla a devolver |
| READ RECORD | Número de registro (desde 1) | SFI en los 5 bits altos + `100` (P1 es registro) |
| GENERATE AC | Criptograma pedido: 00=AAC, 01=TC, 10=ARQC, bit 5 = firma | Fijo 00 |
| GET DATA | 1er byte de la etiqueta | 2º byte: P1P2 juntos son el nombre del objeto |
| VERIFY | Fijo 00 | Calificador del dato de referencia (tema de la verificación del tarjetahabiente) |

**AFL (Application File Locator)**: la tarjeta dice qué leer, en grupos de 4 bytes: SFI (primer byte >> 3), primer registro, último registro, y cuántos cubre la firma offline. `08 06 06 00` → SFI 1, registros 6-6, ninguno firmado → el comando siguiente es `00 B2 06 0C 00` (registro 6, archivo 1).

> El cuarto byte del AFL decide qué puede reescribir un atacante: dice cuántos registros cubre la firma de autenticación offline. Lo que quede fuera son datos sin firmar que la terminal lee y usa de todos modos.

**GENERATE AC**: P1 = petición, no orden. "El criptograma devuelto por la ICC puede diferir del solicitado, según un proceso interno." Puedes pedir TC y recibir AAC. Solo la etiqueta 9F27 de la respuesta dice qué obtuviste.

**SFI 11-30 quedan fuera de la especificación EMV** — un READ RECORD a un SFI 22 (P2 = B4) devuelve etiquetas `DF` (clase privada): del emisor, indocumentadas. Traza llena de etiquetas desconocidas = archivo propietario, no parser roto.

## Los cuatro casos

| Caso | Forma | En las capturas de ejemplo |
|---|---|---|
| 1 | Solo cabecera (4 bytes) | Poco común |
| 2 | Cabecera + Le | READ RECORD, GET DATA, GET RESPONSE — el 5º byte es Le |
| 3 | Cabecera + Lc + datos, sin Le | VERIFY, EXTERNAL AUTH, SELECT por contacto |
| 4 | Los 7 campos | GPO, GENERATE AC, SELECT de Wells Fargo |

> `00 B2 06 0C 00` y `00 A4 04 00 0E` miden los dos 5 bytes y su 5º byte juega papeles opuestos (Le vs Lc). No hay forma de distinguirlo por el byte: hay que conocer el comando. Por eso el caso importa más que la longitud.

## La respuesta y la palabra de estado

Respuesta = datos opcionales + SW1 SW2 (lo primero que se lee; quitar antes de analizar TLV).

**Clases de SW1:**

| SW1 | Clase | Qué afirma |
|---|---|---|
| 9000, 61XX | Completado, normal | Se ejecutó. 9000 es el único éxito que existe |
| 62XX, 63XX | Completado, advertencia | 63 = cambió la NVM de la tarjeta; 62 = no |
| 64XX–66XX | Abortado, error de ejecución | 65 cambió memoria; 64/66 no |
| 67XX–6FXX | Abortado, error de comprobación | Se rechazó antes de ejecutarse; nada cambió |

**Frases útiles:**
- `61 XX` → completado, quedan XX bytes → GET RESPONSE (misma CLA, Le=XX). No es error ni reintento.
- `6C XX` → Le incorrecto, hay exactamente XX → **reenvía el mismo comando** con Le=XX.
- `6A82` → archivo no encontrado (afirmación sobre esta tarjeta). `6A83` → registro no encontrado (así se descubre el final de un archivo). `6A88` → objeto no encontrado (el archivo existe). `6A81` → función no admitida (en SELECT = tarjeta bloqueada). `6283` → aplicación invalidada (existe, deshabilitada). `6985` → condiciones de uso no satisfechas (queja de orden). `6983` → método de autenticación bloqueado (se acabaron los intentos). `6984` → dato referenciado invalidado: bloqueado de forma **reversible**, "así no" ≠ "de ninguna manera". `6300` → autenticación fallida (EXTERNAL AUTH). `63CX` → contador de reintentos (X = los que quedan; C0 = ninguno).

> La cláusula de la memoria: SW1 63 o 65 = la NVM cambió (un intento le costó algo al atacante). Un 63CX tras VERIFY = el contador bajó y se quedó abajo. Un 6A82 tras SELECT = no pasó nada, puede repetirse eternamente. Nunca leas una SW sin nombrar el comando al que responde.

**Ejemplo de lectura en dos pasos (T=0):**

```
80 CA 9F 17 00  → GET DATA del PIN Try Counter, Le=00 (todo)
6C 04           → "Le incorrecto, son 4"
80 CA 9F 17 04  → mismo comando, Le=04
9F 17 01 09 90 00 → objeto completo + 9000
```

> El 04 es el objeto BER-TLV entero (9F17 etiqueta + 01 longitud + 1 valor). Si esperabas 6C 01, la tarjeta no está confundida: Le es la longitud del campo de datos, y el campo de datos de un GET DATA es un objeto TLV.

GET DATA solo admite 4 objetos: 9F36, 9F13, 9F17, 9F4F. Recorrerlos es un **oráculo**: 6A88 = no existe, 6C xx = existe. Cuatro comandos dibujan el inventario de la tarjeta sin leer un valor.

> 61 vs 6C no son intercambiables: tras 61 la tarjeta **ya hizo el trabajo** (reenviar un GENERATE AC = pedir un segundo criptograma en la misma transacción). Tras 6C no hizo nada: reenviar es lo que la spec te dice.

## La transacción, de principio a fin

```
SELECT directorio  → 00 A4 04 00 0E 32 50…      → 6F…61…4F…87…  (aplicaciones por prioridad)
SELECT una app     → 00 A4 04 00 07 A0 00…       → 6F…A5…9F38…    (PDOL)
GET PROCESSING OPTIONS → 80 A8 00 00 23 83 21…   → 77…82 00 00 94 08 06 06 00  (AIP+AFL)
READ RECORD (según AFL) → 00 B2 06 0C 00         → 70…90 00
GENERATE AC (CDOL1) → 80 AE 80 00 1D…            → 80 12 80 00…   (criptograma, ATC, CID)
GENERATE AC (CDOL2) → 80 AE 40 00 1F 30 30…      → 80 12 40 00…   (si hay online)
```

El orden no es arbitrario: cada paso produce la entrada del siguiente.

> Traza la línea entre **descubrimiento y transacción**: todo lo anterior al GPO es la terminal averiguando con qué habla, y casi nada está autenticado (lista de apps, nombres, prioridades, IDs). Ahí se concentran los ataques.

## BER-TLV

Etiqueta: 2 bits de clase (00 universal — EMV no la usa; 01 aplicación — 6F, 61, 70, 84, 5F24; 10 contexto — casi todo EMV, 80-9E, 9F00-9F4F spec, 9F50-9F7F esquemas, BF0C la construida más común; 11 privada — DF*), 1 bit construido (1 = el valor son más objetos = plantilla), 5 bits de número (**11111 = la etiqueta continúa** → 9F, 5F, BF, DF miden mínimo 2 bytes).

Longitud: `00-7F` directa; `81` = sigue 1 byte (hasta 255); `82` = 2 bytes big-endian (no en la interfaz EMV, sí en certificados).

> La forma 81 mata parsers a mano en silencio: `9F 46 81 B0` leído mal consume 130 bytes donde hay 178, y reanuda 48 bytes antes, en medio de un certificado que parece etiqueta válida. Cualquier captura con autenticación offline tiene al menos uno.

Ejemplo con aritmética comprobada: `6F 1A 84 0E "1PAY.SYS.DDF01" A5 08 88 01 01 5F2D 02 65 6E 90 00` — 6F declara 26 bytes: 84 (2+14=16) + A5 (2+8=10) = 26. El 9000 queda fuera. **Comprueba la aritmética a mano siempre.**

> El Anexo B permite bytes `00` sueltos entre objetos TLV (relleno de objetos borrados/modificados). Un parser debe saltárselos, no tratarlos como etiqueta. Un registro puede llevar la forma de algo que ya no está ahí.

## Data Object Lists: la tarjeta le pregunta a la terminal

La tarjeta publica lista de (etiqueta, longitud); la terminal envía los valores concatenados **sin etiqueta**. La tarjeta es una computadora pequeña: parsear TLV le cuesta ciclos que prefiere gastar en RSA.

| Etiqueta | Lista | Alimenta |
|---|---|---|
| 9F38 | PDOL | Campo de datos del GPO, envuelto en plantilla 83 |
| 8C | CDOL1 | 1er GENERATE AC (la decisión) |
| 8D | CDOL2 | 2º GENERATE AC (tras respuesta del emisor) |
| 9F49 | DDOL | INTERNAL AUTHENTICATE |
| 97 | TDOL | Hash del Transaction Certificate (ausente en las capturas de ejemplo) |
| 9F4F | Log Format | Describe el registro de transacciones de la tarjeta |

CDOL1 de la captura por contacto: `9F02 06, 9F03 06, 9F1A 02, 95 05, 5F2A 02, 9A 03, 9C 01, 9F37 04` = 29 bytes → el GENERATE AC lleva Lc = 0x1D. Posiciones: 14 = TVR (el veredicto de la terminal), 25 = el número impredecible (UN).

> Posición 25 es un hecho sobre ese CDOL1, no sobre GENERATE AC: el CDOL2 añade 8A (Authorisation Response Code) al inicio y todo se desplaza → el UN queda en la 27. Comprueba P1: 80 = CDOL1, 40 = CDOL2.

> Regla 5.4: si la etiqueta del DOL es desconocida para la terminal, envía la longitud correcta llena de **ceros**. La tarjeta no distingue una terminal que no sabe de una cuya respuesta es realmente cero. Módulos 7 (TVR) y 14 (UN) viven de esta regla: la tarjeta escribió la pregunta, la terminal escribió la respuesta, y nada comprueba que sea cierta.

## Un comando que no espera respuesta: VERIFY

Caso 3 de manual: `00 20 00 P2 08 <bloque PIN>`, sin Le. Toda la respuesta son 2 bytes de estado.

> Estructural (no criptográfico): el secreto sale de la terminal en el mismo mensaje que pide la comprobación — no hay paso donde la tarjeta demuestre nada antes sobre sí misma. Y el veredicto completo son 2 bytes sin autenticar.