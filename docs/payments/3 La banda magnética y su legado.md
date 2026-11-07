---
title: La banda magnética y su legado
sidebar_position: 3
---

## La banda en una frase

La banda dice prácticamente lo mismo cada vez que se usa. No genera criptograma, no mantiene contador, no ejecuta lógica, no participa en un protocolo interactivo. Almacena datos para que la terminal los recupere. Y el chip no eliminó su estructura: la Track 2 reaparece dentro de EMV como **Track 2 Equivalent Data (tag 57)** y después en los mensajes de autorización. Aprender a leer una pista es aprender una estructura que vas a ver en todo el material.

## La física: regiones magnetizadas

- La banda son pequeñas regiones magnetizadas; los datos son cambios de orientación magnética, no bytes en memoria.
- Demo de Cyber R&D Lab: ferrofluido o limaduras de hierro sobre la banda revelan el patrón.
- Escribir = electroimán que cambia la orientación mientras la banda pasa. No hay controlador ni celda de memoria. **Volver a codificar una banda no es vencer una protección, es comprar el aparato (MSR X6): no hay nada que vencer.**
- Leer = el cabezal detecta transiciones de flujo y reconstruye. La tarjeta no "habla".

> La terminal obtiene la información almacenada. Entre tú y el decodificador no hay ningún mecanismo de seguridad, solo física. Y la física no autentica.

## Tres pistas, pero dos importan

| Pista | Formato | Contenido |
|---|---|---|
| Track 1 | Alfanumérica, hasta 79 chars | PAN, nombre entre `^`, vencimiento, service code, discrecional. Código de formato `B` tras el centinela |
| Track 2 | Numérica, hasta 40 chars | PAN, vencimiento, service code, discrecional. **La que lee toda terminal y la que reaparece en el chip** |
| Track 3 | Numérica, lectura/escritura | Casi sin uso en tarjetas bancarias |

Track 1: `%B PAN ^ NAME ^ YYMM SVC DISC ? LRC`
Track 2: `; PAN = YYMM SVC DISC ? LRC`

Casi todo es marco, no contenido: centinelas, separadores, paridad y LRC existen para que un lector **sin reloj y sin protocolo** encuentre los bordes de los campos. Así se ve un protocolo cuando una de las partes no puede hablar.

## Anatomía de una Track 2

```
;4111111111111111=301200000000000000000?
```

| Parte | Bytes | Qué es |
|---|---|---|
| `;` | 3B | Centinela de inicio |
| `4111…1111` | PAN | Cuenta, hasta 19 dígitos |
| `=` | 3D | Separador. En el chip se vuelve nibble `D` |
| `3012` | vencimiento | Formato AAMM (diciembre 2030). Fácil de leer al revés |
| `000` | service code | 3 dígitos |
| `0…0` | discrecional | Depende del emisor |
| `?` | 3F | Centinela final; luego LRC |

> Paridad y LRC detectan errores accidentales de lectura, no demuestran quién creó los datos. Si modificas un campo y recalculas el checksum, la estructura es perfectamente válida. Un checksum dice que es consistente, no que es legítima.

## Cómo llegan los bits a la banda

- Codificación **F2F (bifase de Aiken)**: la información vive en la *posición temporal de las transiciones*. Kamkar: dos franjas sólidas = 1, franja + espacio = 0.
- Bit 0 = una transición por periodo; bit 1 = dos (frecuencia doble).
- El lector recupera el periodo de bit de la propia secuencia → funciona a cualquier velocidad.

> Renunciar al tiempo absoluto = renunciar a toda autenticidad basada en tiempos. El lector no distingue un deslizamiento de una bobina quieta, ni de una bocina. La independencia de velocidad era usabilidad y eliminó la única señal física que podía distinguir una tarjeta de un campo.

- **5 bits por carácter**: nibble (dígito) + paridad impar, **LSB first**. El nibble alto ASCII (3) se descarta.
- **LRC** = paridad por columnas sobre todo el registro. Ninguno usa llave secreta: recalcularlo es aritmética de hoja de cálculo.
- Antes del centinela hay **ceros de sincronización** para que el lector recupere el periodo de bit. Registro válido + mala sincronización = lectura poco confiable.

> Si la única objeción de un sistema a tu registro editado es que el dígito de control no cuadra, no tiene ninguna objeción.

## Emular la señal, no la banda

**ViolentMag**: codifica la pista como WAV y la reproduce por una bocina. Una bobina y una bocina producen campos variables; para algo que solo mide cuándo cambian, son la misma señal.

**MagSpoof (Kamkar 2015)** — piezas:

| Pieza | Función |
|---|---|
| Bobina 24AWG sin núcleo de hierro | Genera el campo; la espira es todo el transmisor |
| Puente H L293D | Invierte la corriente: campo y campo opuesto (F2F exige inversiones, no pulsos) |
| ATtiny85 | Guarda la pista y marca el tiempo |
| LiPo 100mAh + cap 100µF | Pulso breve y fuerte; el capacitor lo entrega, la batería lo recarga |
| Botón + LED | Toda la interfaz |

- Sin núcleo de hierro = decisión de factor de forma, a propósito.
- Costo total: unos dólares. *Un control que se burla con unos dólares y una tarde no es un control.*
- **Sin canal de regreso**: el lector no puede preguntarle a la banda quién la emitió, ni mandar un reto. Solo presenta información.
- Límites honestos: no te permite usar tarjetas ajenas; el PAN no basta (quedan datos discrecionales y verificaciones posteriores). La conclusión técnica real: **el cabezal no puede distinguir banda física de un patrón magnético compatible**.
- Kamkar retiró antes de publicar la función que apagaba los bits de chip. Y encontró que los reemplazos de AMEX se deducían del número viejo (vencimiento = momento de la solicitud, CVV seguía sirviendo) → avisó a AMEX y no publicó el algoritmo.

> Una revocación que produce un sucesor predecible no ha revocado nada.

## El código de servicio (service code)

Tres dígitos, tres decisiones de política sin relación, un solo campo **sin firmar**:

| Posición | Qué gobierna |
|---|---|
| 1ª | Intercambio (internacional/nacional/privado/prueba) **y si hay chip** (valores 2 y 6 de ISO 7813) |
| 2ª | Procesamiento de autorización: ¿por el emisor o comprobaciones de la terminal? |
| 3ª | Servicios permitidos y PIN (ATM, efectivo, bienes y servicios) |

> La banda no ejecuta estas políticas: las describe. La 1ª posición dice "esta tarjeta contiene un chip y debería usarse cuando sea posible". "Cuando sea posible" es la cláusula de escape donde viven los ataques de **degradación**: la tecnología más débil transporta la instrucción de preferir la más fuerte, y nada la firma.

Detalle: el **CVV/CVC se calcula con PAN + vencimiento + service code**. Modificar el service code rompe la consistencia con el CVV... pero ¿quién lo comprueba? El cabezal no puede, la terminal no tiene las llaves. La comprobación ocurre en el emisor, si ocurre. La pregunta útil no es "¿puedo modificar este campo?" sino "¿qué participante detectaría que fue modificado, y realmente lo hace?".

## El mismo registro dentro del chip: tag 57

Track 2 Equivalent Data (EMV 4.3 Book 3, Anexo A): tag `57`, en plantilla 70/77, hasta 19 bytes. Misma Track 2 de ISO 7813 **sin centinela de inicio, sin centinela final, sin LRC** (el TLV ya da límites y el transporte da integridad). Orden: PAN, separador `D` (nibble), vencimiento AAMM, service code, discrecional, relleno `F` si hace falta.

**Nibbles, no bytes**: los campos no alinean con bytes. 16 nibbles PAN + 1 `D` + 4 venc + 3 SVC + 13 disc = 37 → impar → `F` de relleno → 38 nibbles = 19 bytes. Piensa en nibbles primero; "bytes vs dígitos" produce errores silenciosos.

Ruta de la terminal hasta la 57 (contacto):

```
SELECT            → 00 A4 04 00 07   → FCI con 42
GET PROCESSING OPTIONS → 80 A8 00 00 02 → 80 06 18 00 08 02 04 00  (AFL: SFI 1, registros 2-4)
READ RECORD       → 00 B2 02 0C      → 70 28 57 13 …  (la pista)
READ RECORD       → 00 B2 03 0C      → 5A, 5F24, 5F28
```

> Cinco intercambios desde el arranque, sin autenticación de ningún tipo, y la terminal ya tiene una Track 2 completa. Nada de esto es secreto ni está firmado. Pero ojo: que EMV contenga datos de pista no significa que tenga las propiedades de seguridad de la banda — alrededor hay autenticación, CVM, criptogramas.

## El mismo dato vive en varias etiquetas (y nadie las compara)

| Dato | Etiquetas |
|---|---|
| Track 2 entero | 57 (en las 5 capturas, 10 veces) |
| Track 1 | 56 (una vez, en ceros) |
| PAN | 5A + dentro de 57 + 42 (IIN = dígitos iniciales) |
| Vencimiento | 5F24 (AAMMDD) + 4 dígitos AAMM en 57 |
| Service code | 5F30 + dentro de 57 |

> Redundancia ≠ reconciliación. Nada en EMV exige que las copias coincidan; se crearon juntas en la personalización. En las capturas de ejemplo hay un vencimiento que dice mes 34 y un 5F24 con mes 44 — alguien editó una copia y no la otra. **Valida antes de interpretar**: un campo con mes 34 fue modificado/sanitizado, no es una tarjeta rara. Un campo AAMM regala una prueba de consistencia (meses 01-12): haz esas pruebas antes de interpretar nada.

> La terminal lee 5F24 para su prueba de vencimiento y riesgo; el mensaje al emisor lleva el registro de pista. Modificar una representación puede afectar una decisión local sin cambiar lo que otro participante recibe después. Un campo guardado dos veces y nunca comparado son dos campos que empezaron iguales.

## La banda vuelve a aparecer por radio

Contactless ≠ chip automáticamente. Modos heredados que producen datos de pista para infraestructura que razona en términos de banda:

- **Mastercard PayPass**: M/Chip y **MagStrobe** ("modo heredado para entornos que aún no manejan la mensajería EMV": la terminal pide COMPUTE CRYPTOGRAPHIC CHECKSUM y construye una pista de la transacción).
- **Visa**: dCVV, CVN17, VSDC, qVSDC. dCVV devuelve el valor de verificación dentro de los datos de pista por READ RECORD — y muchas tarjetas lo implementan **estático**, cosa que los estándares permiten.

> "Dinámico" es una promesa, no una propiedad. Cada vez que veas un nonce, contador, timestamp o Unpredictable Number: ¿quién lo genera, dónde termina y qué componente decide si el valor es aceptable?

Perfil de banda en la captura contactless Mastercard: registro de 117 bytes con 9f6C (versión), 9f62/9f63/9f64/9f65/9f66 (mapas), 56 (Track 1, 52 bytes), 9f6B (Track 2, 19 bytes), 9f67 — **todo en ceros**. Las casillas siguen ahí, con el tamaño exacto del registro que alojan, devueltas a cualquier terminal que pregunte. Retirar una capacidad ≠ vaciarla. Y una captura demuestra esa implementación, no todo el ecosistema.

## Adónde va la pista después de la terminal (ISO 8583)

| DE | Lleva |
|---|---|
| 22 | Modo de entrada (deslizada, insertada, acercada, fallback) |
| 35 | Track 2, formato z, hasta 37 chars — **el registro de la banda llegando al emisor** |
| 40 | Service code |
| 45 | Track 1, hasta 76 chars |
| 55 | Datos ICC (las etiquetas EMV) — viaja junto al 35 |

Un mismo mensaje lleva Track 2 (DE35) y EMV (DE55) a la vez. El chip reempaquetó la pista y la pasó adelante: **banda (ASCII) → chip (tag 57) → mensaje (DE35) → emisor (lo comprueba, o no)**. Tres tecnologías, tres formatos, una carga útil que sobrevive.

> Cuando te pregunten si un sistema dejó atrás la banda, la pregunta útil es si por él sigue circulando dato equivalente de pista, no qué lectores tiene. La respuesta casi siempre es sí.

## Por qué la banda no podía convertirse en EMV

La banda no tiene procesador, ni memoria protegida para llaves, no recibe reto y no produce respuesta por transacción. Es estática: léela una vez, reprodúcela indefinidamente. EMV introduce un participante que participa en un protocolo.

> EMV no es una banda con más datos. El criptograma existe porque la banda no tiene contador; la tokenización porque vale la pena robar el número; las contramedidas de relay porque "estos datos son válidos" nunca fue lo mismo que "esta tarjeta está aquí".

**Fallback**: si la terminal no puede usar el chip, bajo ciertas condiciones continúa con banda. Cyber R&D Lab ("50 años y sigue siendo la vía de entrada más barata") da 4 razones: los estándares permiten cruzar datos entre tecnologías, la adopción del chip es lenta en regiones, se puede forzar el repliegue, y **los códigos de seguridad no los comprueban todos los emisores en el momento de la transacción**.

> ¿Bajo qué condiciones puede una transacción abandonar el mecanismo más fuerte y continuar con uno más débil? Cuando existe una ruta alternativa, esa ruta es parte de la superficie de ataque. No basta con analizar el camino ideal.

La pregunta para llevarte: cuando una tecnología nueva aparece sobre un sistema viejo, ¿qué parte de la anterior sigue presente? La banda física se usa cada vez menos; sus estructuras de datos sobrevivieron en todo lo demás.