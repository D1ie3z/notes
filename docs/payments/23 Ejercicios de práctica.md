---
title: Ejercicios de práctica - laboratorio casero
sidebar_position: 23
---

**Analogía para empezar**: leer teoría de pagos sin tocar una tarjeta es como aprender a nadar leyendo un manual. Esta nota es la alberca: ejercicios paso a paso, con el material que necesitas, para practicar cada tema de las notas con tus propias tarjetas y tu propio hardware. Nada de esto requiere el laboratorio de nadie.

## Reglas de oro (léelas primero, van en serio)

1. **Solo lo tuyo**: tu propia tarjeta, tu propio teléfono, tu propio lector, tu propio comercio. Una credencial ajena = delito, aunque sea "para probar".
2. **Montos pequeños**: si pruebas con tu tarjeta en un comercio real, compra algo de centavos o usa tarjetas de prueba (Visa/Mastercard publican números de prueba para desarrollo: `4111 1111 1111 1111`, `5555 5555 5555 4444`).
3. **Autorización por escrito**: si el ejercicio toca sistemas que no son tuyos (un banco, un comercio), necesitas un contrato/permiso. Sin permiso no es investigación, es fraude.
4. **Sanitiza todo lo que guardes**: quita PANs y datos de pista antes de compartir cualquier captura (ver nota de PCI DSS).
5. **Anota siempre**: tarjeta, terminal, país, fecha, firmware, hipótesis. Sin eso, la captura no prueba nada dentro de 6 meses.

## Material por nivel

| Nivel | Qué compras | Costo aprox | Para qué te alcanza |
|---|---|---|---|
| 0 | Nada | $0 | Leer capturas, entender trazas, construir mensajes |
| 1 | Teléfono Android con NFC + app (NFC Tools, NFC TagInfo) | $0 (el que ya tienes) | Hablar APDU con tu tarjeta, leer el PPSE, tags |
| 2 | ACR122U o PN532 (USB) + Python (pyscard / nfcpy) | $20-40 | Scripts APDU, leer registros, contactless |
| 3 | MSR605 (lector/escritor de bandas) + tarjetas vírgenes | $50-100 | Leer/escribir bandas (solo tuyas o de prueba) |
| 4 | Proxmark3 RDV4 + antena | $100-200 | Esnifar capa 1, tiempos, anticolisión |
| 5 | SCR3310 (contacto) + SIMtrace2 | $30-100 | EMV por contacto, trazas T=1 |

Empezar con nivel 0-1 es suficiente para más de la mitad de los ejercicios.

---

## Tema: fundamentos (nota: Sistemas de pagos de seguridad)

**Ejercicio 1 — Tu primer diálogo APDU**

- **Objetivo**: ver con tus ojos el diálogo entre una tarjeta y un lector.
- **Material**: teléfono Android con NFC + app de lectura NFC (o ACR122U + script).
- **Tiempo**: 10 min.
- **Pasos**:
  1. Abre la app, acercas tu tarjeta (la que sea, tuya).
  2. La app hace un SELECT del PPSE (`2PAY.SYS.DDF01`) — busca en los logs la línea `00 A4 04 00 0E 32 50 41 59...`.
  3. Mira la respuesta: el tag `4F` (AID de tu tarjeta) y `50` (el nombre de la aplicación, p. ej. "VISA DEBIT").
- **Qué anotar**: el AID, el nombre, y cuántas aplicaciones anunció tu tarjeta (tags `61`).

**Ejercicio 2 — La pregunta del investigador**

- **Objetivo**: aplicar las 7 preguntas a un dato concreto.
- **Material**: la captura del ejercicio 1.
- **Pasos**: toma el tag `50` (nombre de la aplicación) y responde: ¿quién lo genera? (la tarjeta) ¿Quién puede modificarlo? (cualquiera con un lector que lo reescriba al vuelo — nada lo firma) ¿Qué decisión depende de él? (solo la pantalla). Ahora haz lo mismo con el tag `4F`: ¿qué decisión depende del AID? (qué kernel ejecuta la terminal — ver nota de NFC).
- **Qué anotar**: qué datos son solo "presentación" y cuáles deciden algo.

---

## Tema: herramientas (nota: La caja de herramientas)

**Ejercicio 3 — Arma tu entorno**

- **Objetivo**: tener un entorno reproducible para practicar.
- **Material**: cualquier laptop + Python 3.
- **Pasos**:
  1. Instala Python y `pyscard` (Windows) o `nfcpy` (Linux).
  2. Crea un script mínimo que imprima "hola" cuando acerques tu tarjeta (en Windows: `pip install pyscard`, luego un loop de `CardRequest`).
  3. Corre el script y acércale tu tarjeta.
- **Qué anotar**: qué pila usaste, qué versión, y si tu lector aparece en el sistema (esto es lo que se rompe cuando cambias de lector).

---

## Tema: banda magnética (nota: La banda magnética y su legado)

**Ejercicio 4 — Lee tu propia banda**

- **Objetivo**: ver la Track 2 con tus ojos y decodificarla a mano.
- **Material**: MSR605 (o un lector de bandas USB) + una tarjeta tuya (o tarjeta de prueba en blanco que tú mismo escribas).
- **Tiempo**: 20 min.
- **Pasos**:
  1. Pasa tu tarjeta por el MSR605 en modo lectura. Obtenés la Track 2, algo como `;4111111111111111=301200000000000000000?`.
  2. Decodifica a mano: `;` centinela, PAN hasta `=`, luego AAMM (vencimiento), 3 dígitos de código de servicio, resto = discrecional (donde vive el CVV).
  3. Escribe esa misma pista en una tarjeta virgen (es TU pista, es legal).
  4. Vuelve a leer la virgen y compara byte a byte.
- **Qué anotar**: el código de servicio (primer dígito: ¿2 o 6 = hay chip?), y qué cambió entre la original y la copia (nada, porque nada lo firma).

**Ejercicio 5 — MagSpoof mental**

- **Objetivo**: entender que la banda es señal, no tarjeta.
- **Material**: el texto de Kamkar (samy.pl), o un generador de tonos.
- **Pasos**: lee cómo MagSpoof usa un puente H para invertir la corriente de una bobina. Luego reproduce mentalmente: ¿qué necesita observar el lector para "ver" una banda? (transiciones de campo, no una tarjeta).
- **Qué anotar**: la diferencia entre "reproducir datos" y "emular un dispositivo que responde".

---

## Tema: comunicación APDU (nota: Cómo hablan tarjeta y terminal)

**Ejercicio 6 — SELECT, GPO y READ RECORD a mano**

- **Objetivo**: ejecutar los 3 comandos clave y leer las respuestas sin decodificador.
- **Material**: ACR122U/PN532 + script (o teléfono con app que permita APDU crudos, como NFC TagInfo).
- **Pasos**:
  1. SELECT PPSE: `00 A4 04 00 0E 32 50 41 59 2E 53 59 53 2E 44 44 46 30 31 00`. Anota SW1 SW2 (espera `90 00`).
  2. Prueba el directorio equivocado (`1PAY...` con el byte `31` en vez de `32`): ¿qué palabra de estado te devuelve? (espera `6A 82`).
  3. SELECT tu AID (el `4F` del ejercicio 1).
  4. GET PROCESSING OPTIONS: `80 A8 00 00 02 83 00` (o el PDOL que pida tu tarjeta). Anota el AIP (tag `82`) y el AFL (`94`).
  5. READ RECORD según el AFL (ej. `00 B2 06 0C 00` si el AFL dice SFI 1, registro 6). Lee el tag `57` (Track 2 dentro del chip).
- **Qué anotar**: cada palabra de estado como frase ("6A82 = no tengo ese archivo"), y la secuencia completa de tu transacción (cuántos comandos fueron).

**Ejercicio 7 — Los 4 casos**

- **Objetivo**: identificar los 4 casos de APDU en tu propia traza.
- **Pasos**: con los comandos del ejercicio 6, clasifica cada uno: caso 1 (solo cabecera), caso 2 (cabecera+Le), caso 3 (cabecera+Lc+datos sin Le), caso 4 (todo). El SELECT del PPSE es caso 3 o 4 según lleve Le.
- **Qué anotar**: para cada comando, qué byte es Lc y cuál es Le (el quinto byte juega papeles opuestos según el comando).

---

## Tema: criptografía del chip (nota: La criptografía del chip)

**Ejercicio 8 — Leer el AIP y adivinar la autenticación**

- **Objetivo**: saber qué puede hacer tu tarjeta sin que te lo diga nadie.
- **Pasos**:
  1. Del GPO (ejercicio 6), toma el AIP (tag `82`, 2 bytes).
  2. Decodifícalo en bits: bit 7 del byte 1 = SDA, bit 6 = DDA, bit 1 = CDA. ¿Qué método ofrece tu tarjeta?
  3. Busca los certificados: READ RECORD de los registros que indique el AFL; el tag `90` (cert del emisor) y `9F46` (cert de la tarjeta). Anota sus **longitudes**.
- **Qué anotar**: longitudes → tamaños de llave (una firma mide lo que su llave): cert de 176 bytes = llave de 1408 bits. ¿Tu tarjeta trae certificados? ¿Tiene autenticación offline o solo confía en el emisor en línea?

**Ejercicio 9 — Reconstruir el CDOL1**

- **Objetivo**: armar el campo de datos de un GENERATE AC desde la lista que publicó la tarjeta.
- **Material**: script con pyscard.
- **Pasos**:
  1. Lee el registro que contiene el tag `8C` (CDOL1): una lista de parejas (tag, longitud), ej. `9F02 06 9F03 06 9F1A 02 95 05 5F2A 02 9A 03 9C 01 9F37 04`.
  2. Suma las longitudes: 6+6+2+5+2+3+1+4 = 29. Ese es tu Lc.
  3. Construye el GENERATE AC: `80 AE 80 00 1D` + 29 bytes (monto, otro monto, país, TVR de 5 ceros, moneda, fecha, tipo, y 4 bytes de número impredecible — inventa unos).
  4. Envíalo y mira la respuesta: deberías recibir un criptograma (`9F26`) o un AAC (`9F27` = 00) si algo no cuadra.
- **Qué anotar**: si la tarjeta responde con criptograma, el Lc era correcto. Si responde raro, revisa la aritmética de tu lista.

---

## Tema: CVM y PIN (nota: PIN, firma y verificación)

**Ejercicio 10 — Lee la CVM List de tu tarjeta**

- **Objetivo**: saber qué verificaciones acepta tu tarjeta antes de que ocurra la transacción.
- **Pasos**:
  1. Lee el registro con el tag `8E` (CVM List): montos X/Y (4+4 bytes) + reglas de 2 bytes.
  2. Decodifica cada regla: método (primer byte, bits 6-1) + condición (segundo byte). `42` = PIN cifrado online, `41` = PIN en claro offline, `1E` = firma, `1F` = no CVM.
  3. Ordena las reglas: la primera que la terminal pueda cumplir es la que se ejecuta.
- **Qué anotar**: cuántas reglas tiene tu tarjeta, cuál es la última (la "red de seguridad"), y si el PIN offline está o no en la lista.

**Ejercicio 11 — VERIFY con PIN de mentira (tu tarjeta, tu PIN, CUIDADO)**

- **Objetivo**: ver cómo viaja el PIN offline y qué responde la tarjeta.
- **Material**: tarjeta con PIN offline en su CVM List + lector + tu PIN.
- **Pasos**:
  1. Envía VERIFY con un PIN INCORRECTO: `00 20 00 80 08` + bloque (control `24` + 4 dígitos + relleno `FF`). Espera `63Cx` (x = intentos restantes).
  2. No lo hagas más de 3 veces: la tarjeta se bloquea (6983 después de `63C0`).
- **Qué anotar**: la cuenta regresiva en la palabra de estado, y que ese veredicto no está firmado (nadie puede probar que lo dijo la tarjeta).

---

## Tema: gestión de riesgo (nota: Quién decide si la venta pasa)

**Ejercicio 12 — Encuentra los límites de tu terminal**

- **Objetivo**: leer la configuración de riesgo de una terminal (la tuya, o la de un comercio amigo con permiso).
- **Pasos**:
  1. Si tienes acceso a la config de una terminal (p. ej. un mPOS propio), busca: límite de piso (9F1B), Terminal Type (9F35) y los códigos de acción (TACs).
  2. Decodifica el TVR de una transacción real: cada bit = algo que la terminal notó (bit 8 del byte 4 = excede el límite de piso).
- **Qué anotar**: ¿la terminal es "solo online"? ¿El piso es 0? ¿Qué bits del TVR se activaron en una compra real?

---

## Tema: NFC (nota: El toque sin contacto)

**Ejercicio 13 — La activación que nadie ve**

- **Objetivo**: ver la capa 1 (anticolisión) con un Proxmark.
- **Material**: Proxmark3 + tarjeta contactless tuya.
- **Pasos**:
  1. Pon el Proxmark en modo sniffer/esnifador y acerca tu tarjeta.
  2. Identifica REQA → ATQA → ANTICOLLISION → SELECT UID → SAK → RATS → ATS.
  3. Anota el SAK: bit 6 = 1 y bit 3 = 0 significa "soy una tarjeta inteligente 14443-4".
- **Qué anotar**: los tiempos entre mensajes (µs) y qué tan distinto se ve el UID si tu tarjeta usa UID aleatorio.

**Ejercicio 14 — TTQ y CTQ en una captura tuya**

- **Objetivo**: ver los calificadores que deciden la verificación.
- **Pasos**:
  1. Haz un toque contactless con tu tarjeta y captura el GPO (script o app).
  2. Busca el TTQ (4 bytes que envía la terminal, dentro del GPO): byte 2 bit 7 = CVM requerido, bit 8 = online.
  3. Busca el CTQ (`9F6C`, en la respuesta): byte 2 bit 8 = CDCVM realizado (en una tarjeta de plástico debe estar en 0).
- **Qué anotar**: qué pide tu tarjeta y qué declara la terminal, y que ninguno de los dos está firmado.

---

## Tema: tokenización (nota: Tokenización - otro número de tarjeta)

**Ejercicio 15 — Tu billetera, tu token**

- **Objetivo**: ver un token en acción (el tuyo).
- **Material**: Apple Pay o Google Pay con TU tarjeta + teléfono con NFC + app de lectura.
- **Pasos**:
  1. Añade tu tarjeta a la billetera (aprovisionamiento real).
  2. Acerca el teléfono al lector y captura el GPO.
  3. Busca: el PAN (tag `5A`) es un **DPAN** (no es el número de tu plástico), el `9F24` (Payment Account Reference) si está, y el `9F6E` (factor de forma = 4 bytes en Visa).
- **Qué anotar**: las diferencias entre el toque del teléfono y el de la tarjeta física (datos, CTQ con CDCVM en 1, longitud del PAN).

---

## Tema: pagos instantáneos y QR (nota: Pagos al instante y QR)

**Ejercicio 16 — Decodifica un QR de pago real**

- **Objetivo**: leer un payload EMVCo a mano.
- **Material**: cualquier QR de pago de un comercio (fotografíalo) o uno que generes con una app de cobro.
- **Pasos**:
  1. Decodifica el QR a texto (cualquier lector te da la cadena).
  2. Separa en TLV de 2 dígitos: `00` formato, `01` estático/dinámico, `26`-`51` cuenta del comercio, `52` categoría, `53` moneda, `54` importe (si lo trae), `63` CRC.
  3. Verifica el CRC a mano (ISO 13239, polinomio 0x1021, init 0xFFFF, cubre todo incluyendo "63" y "04" pero no el valor).
- **Qué anotar**: qué campos trae el QR, si el importe está dentro (dinámico) o no (te lo piden a ti), y el beneficiario dentro de la plantilla de cuenta.

---

## Tema: PCI DSS (nota: PCI DSS - la norma del alcance)

**Ejercicio 17 — Sanitiza una captura tuya**

- **Objetivo**: aplicar la regla de "sanitiza antes de guardar".
- **Material**: la captura del ejercicio 1 o 6.
- **Pasos**:
  1. Identifica en tu captura todos los lugares donde aparece el PAN: tag `5A`, dentro de la `57` (antes del separador `D`), y en el cert `9F46` si lo trae (recuperable con llaves públicas).
  2. Reemplaza el PAN por un número de prueba publicado (4111...).
  3. Vuelve a leer: ¿el PAN sigue en algún lado? (los certificados casi siempre se olvidan).
- **Qué anotar**: cuántas copias del mismo dato había, y qué regla de tu proceso la próxima vez (sustituir el PAN no basta).

**Ejercicio 18 — Mini-scoping de un sistema real**

- **Objetivo**: practicar la pregunta de alcance.
- **Material**: un sistema que conozcas (tu empresa, un proyecto amigo con permiso).
- **Pasos**: dibuja el flujo del PAN: ¿dónde se almacena, procesa y transmite? ¿Qué sistemas están conectados a esos? ¿Cuáles "podrían impactar" su seguridad (DNS, CDN, pipeline)? Marca lo que crees fuera de alcance y justifica con la prueba de "aunque esté comprometido, ¿puede impactar?"
- **Qué anotar**: el diagrama y las justificaciones — es el primer entregable de una auditoría real.

---

## Tema: clonación y degradación (nota: Clonar datos, no tarjetas)

**Ejercicio 19 — Copia tu propia banda (legal)**

- **Objetivo**: entender qué se puede copiar y qué no.
- **Material**: MSR605 + tu tarjeta (o tarjeta de prueba que tú escribiste) + tarjeta virgen.
- **Pasos**:
  1. Lee tu pista (ejercicio 4), cópiala a una virgen.
  2. Prueba la copia en un lector: los datos se leen igual (nada los firma).
  3. Ahora intenta lo mismo con el **chip**: ¿puedes copiar el chip? No — necesitarías las llaves, que están en el hardware seguro.
- **Qué anotar**: la diferencia entre clonar datos (fácil, banda) y clonar una tarjeta (difícil, chip con llaves). Es exactamente la línea del módulo de clonación.

**Ejercicio 20 — Degradación simulada (banda → chip)**

- **Objetivo**: ver cómo un campo decide qué mecanismo se usa.
- **Material**: tu tarjeta con chip + MSR605 + lector que acepte banda.
- **Pasos**:
  1. Lee el service code de tu banda (ejercicio 4): primer dígito 2 o 6 = "tengo chip".
  2. Escribe una copia con el primer dígito cambiado a 1 ("no tengo chip") en tu tarjeta virgen.
  3. Preséntala en un lector que acepte banda (si el comercio permite fallback): la terminal tratará la copia como tarjeta sin chip.
- **Qué anotar**: qué decisión dependía de ese dígito sin firmar. (Hazlo SOLO con tu propia tarjeta virgen y tu propio lector.)

---

## Tema: pre-play (nota: El pre-play)

**Ejercicio 21 — Mide los números impredecibles de tu terminal**

- **Objetivo**: aplicar la técnica de Bond et al. a una terminal tuya.
- **Material**: terminal/mPOS propia que puedas configurar (o un simulador).
- **Pasos**:
  1. Haz varias transacciones y captura el UN (tag `9F37` en el GPO o GENERATE AC).
  2. Alinea los valores en hex y mira columna por columna: ¿hay bits o nibbles constantes? ¿el valor crece con el tiempo (contador)?
  3. Repite tras reiniciar la terminal: ¿vuelve a empezar la secuencia?
- **Qué anotar**: "no observé estructura en N valores" solo vale si dices cuántos miraste y qué buscabas. Una muestra de 6 no prueba nada.

---

## Tema: límites contactless (nota: Límites del toque)

**Ejercicio 22 — Encuentra los límites de tu toque**

- **Objetivo**: descubrir los 3 límites de una terminal.
- **Material**: terminal/mPOS propia + tu tarjeta.
- **Pasos**:
  1. Haz toques de importes crecientes (0.01, 1, 10, 30, 50...) y observa: ¿cuándo pide CVM? ¿cuándo va en línea? ¿cuándo rechaza y manda a insertar?
  2. En el GPO de cada toque, mira el TTQ byte 2: bit 7 (CVM requerido) y bit 8 (online) — son los bits dinámicos del preprocesamiento.
- **Qué anotar**: los 3 umbrales que encontraste y el bit que cambió. Los límites son configuración: cambian por país y por adquirente.

---

## Tema: relay (nota: Relay - la tarjeta en otro lado)

**Ejercicio 23 — Relay con NFCGate (tus dos teléfonos)**

- **Objetivo**: ver un relay en acción sin comprar nada.
- **Material**: 2 teléfonos Android con NFC + app **NFCGate** (proyecto académico, código abierto).
- **Pasos**:
  1. Instala NFCGate en ambos. En uno activa "relay" como tarjeta (se comunica con el servidor del proyecto), en el otro como lector.
  2. Coloca TU tarjeta detrás del teléfono "tarjeta" y acerca el teléfono "lector" a una terminal tuya (o a otro teléfono con app de lectura NFC).
  3. Observa: la terminal lee tu tarjeta que está a metros de distancia.
- **Qué anotar**: que cada byte es auténtico (la tarjeta respondió de verdad) y que lo único falso es la distancia — no hay nada en los datos que lo delate.

---

## Tema: resistencia al relay (nota: Contramedidas al relay)

**Ejercicio 24 — Cronometra con un Proxmark**

- **Objetivo**: medir dispersión honesta de tiempos.
- **Material**: Proxmark3 + tarjeta contactless tuya.
- **Pasos**:
  1. Esnifa 10 toques de tu tarjeta contra un lector.
  2. Mide el tiempo de respuesta del SELECT UID (capa 1) y del GPO (capa 3) en cada uno.
  3. Compara las dispersiones: la capa 1 varía en µs, la capa 3 en ms (porque hay procesamiento). Un relay se esconde en esa varianza.
- **Qué anotar**: media y desviación por comando — y por qué una cota de tiempo tiene que ser más ancha que la variación honesta.

---

## Tema: SoftPOS (nota: La terminal en una app)

**Ejercicio 25 — Revisa una app de cobro en tu teléfono**

- **Objetivo**: ver qué afirma un SoftPOS sobre sí mismo.
- **Material**: una app de cobro (SumUp, Zettle, o similar) instalada en TU teléfono, con una cuenta tuya.
- **Pasos**:
  1. Revisa los permisos de la app (Android: ajustes → apps → permisos): ¿accede a cámara, micrófono, ubicación? ¿Por qué los necesita?
  2. Con la app en modo comercio, haz un toque con tu propia tarjeta y captura el TTQ (ejercicio 14): ¿qué bits declara? ¿"solo sin conexión" está en 0?
  3. Pregunta (sin romper nada): ¿qué pasa si activas las opciones de desarrollador? (algunos lectores mPOS bloquean el cobro).
- **Qué anotar**: el TTQ que escribió una app (no firmware certificado) y los permisos — es la terminal que tu cliente usará en su auditoría.

---

## Tema: ISO 8583 / lado host (nota: El lado del host)

**Ejercicio 26 — Construye y parsea un mensaje 0200**

- **Objetivo**: dominar la estructura sin etiquetas.
- **Material**: Python.
- **Pasos**:
  1. Construye a mano un `0200`: MTI + mapa de bits + DE 2 (PAN LLVAR) + DE 4 (monto de 12 dígitos) + DE 39 en la respuesta.
  2. Calcula el mapa de bits tú mismo: bit 2 y bit 4 activos → byte = `01010000` binario = `50` hex (según la posición de los bits).
  3. Escribe un parser y pásale el mensaje: sin el mapa, ¿cómo sabrías dónde termina cada campo?
- **Qué anotar**: la diferencia entre campos fijos y variables (LLVAR), y por qué un solo byte de longitud mal leído descarrila todo el mensaje.

**Ejercicio 27 — El problema del dialecto**

- **Objetivo**: ver que ISO 8583 no se autodescribe.
- **Material**: un mensaje real de tu proyecto (con permiso) o el de la nota 19.
- **Pasos**: toma el final del mensaje (los campos privados 48/49/60) e intenta decodificarlo con 2 reglas de longitud distintas (LLVAR vs LLLVAR). Cuenta cuántas lecturas plausibles consumen el mensaje exacto.
- **Qué anotar**: que la única fuente de verdad es la especificación de interfaz del enlace exacto — el estándar ISO no resuelve nada.

---

## Tema: autorización (nota: Autorización online)

**Ejercicio 28 — El monto viaja dos veces**

- **Objetivo**: encontrar las dos copias del monto en un mensaje real.
- **Material**: una autorización real de tu proyecto (con permiso) o una captura tuya convertida.
- **Pasos**:
  1. Localiza el DE 4 (el monto que se compensa) y el `9F02` dentro del campo 55 (el monto que firmó la tarjeta).
  2. Cámbialos por separado (en una copia, no en producción): cambia solo el DE 4 → todas las verificaciones criptográficas siguen pasando (nada lo cubre). Cambia el 9F02 → el criptograma falla.
- **Qué anotar**: cuál copia está protegida y cuál decide el cobro — y que nadie está obligado a compararlas.

**Ejercicio 29 — ¿Llegó el ARPC?**

- **Objetivo**: verificar si la autenticación del emisor llegó a la tarjeta.
- **Pasos**: en una transacción online real, busca el tag `91` en la respuesta al segundo GENERATE AC (los datos de autenticación del emisor: ARPC + Card Status Update). Si no está, la tarjeta recibió el código de aprobación sin prueba de origen.
- **Qué anotar**: si el `91` está presente y si el bit 8 del byte 2 del CSU (aprobado en línea) coincide con el código de respuesta.

---

## Tema: terminales sin conexión (nota: Pagos sin conexión)

**Ejercicio 30 — Tu lector en modo avión**

- **Objetivo**: ver qué decide la terminal sin red.
- **Material**: mPOS propio + tu tarjeta.
- **Pasos**:
  1. Pon el teléfono en modo avión (sin datos).
  2. Haz un toque con tu tarjeta: ¿aprueba? ¿rechaza? ¿pide insertar?
  3. Repite con montos por encima y por debajo del límite: ¿cambia el comportamiento?
- **Qué anotar**: qué reglas aplicó la terminal localmente y qué comprobaciones se quedaron sin hacer (las del backend — nadie las consultó).

---

## Tema: investigación (nota: Frentes abiertos)

**Ejercicio 31 — Tu mini-instrumento**

- **Objetivo**: construir la semilla de una herramienta de comparación entre capas.
- **Material**: Python + tus capturas.
- **Pasos**:
  1. Escribe un script que, de una captura, extraiga: el monto del CDOL1 (9F02 en el GENERATE AC) y el monto del mensaje de autorización (DE 4) si lo tienes.
  2. Compáralos y reporta las discrepancias.
  3. Añade una segunda comprobación: el ATC del criptograma vs el ATC del campo 55.
- **Qué anotar**: la disciplina del módulo de investigación — qué probaste en datos reales y qué solo en tus scripts.

---

## Checklist para una auditoría de verdad

Cuando ya domines los ejercicios, esto es lo que se revisa en un trabajo real (todo con permiso escrito):

1. **Alcance**: flujo del PAN, sistemas conectados, sistemas que "podrían impactar" (nota 12).
2. **Límites y config**: 9F1B, TACs, Terminal Type, límites contactless (notas 7, 15).
3. **Capturas**: sanitizadas antes de guardar, con contexto (nota 12).
4. **CVM**: ¿qué reglas acepta la tarjeta y qué declara la terminal? (nota 6).
5. **Autenticación**: ¿SDA/DDA/CDA? ¿certificados presentes y verificados? (nota 5).
6. **Campo 55**: ¿qué etiquetas manda el adquirente y qué hace el host si falta una? (nota 21).
7. **Monto duplicado**: ¿alguien compara DE 4 con 9F02? (nota 21).
8. **Stand-in y offline**: ¿qué aprueba sin el emisor? (notas 20, 21).
9. **Reversas**: ¿el switch detecta duplicados tras reinicio? (nota 19).
10. **IAD/CVR**: ¿alguien lee el campo que la tarjeta escribió? (notas 10, 15, 20 — el campo que nadie lee).

> Regla final: cada ejercicio es legal porque usa lo tuyo. En una auditoría, el permiso escrito es lo que separa la investigación del delito — y ninguna técnica de estas notas vale un expediente penal.