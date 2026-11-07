---
title: PIN, firma y verificación
sidebar_position: 6
---

La autenticación de la tarjeta responde sobre el plástico; la autorización sobre el dinero. En medio queda: **¿la persona que sostiene la tarjeta es la misma a la que se le emitió?** La responde una negociación sin prueba criptográfica detrás. El ataque de la cuña (Murdoch, Drimer, Anderson, Bond — "Chip and PIN is Broken", IEEE S&P 2010) ocurre por completo en esa fase intermedia, no toca certificados ni criptograma, y no necesita el PIN.

> La dirección del ataque: el atacante engaña a la **terminal** para que crea que el PIN se verificó, mientras le dice a la **tarjeta** que no se ingresó ningún PIN. La parte engañada es la terminal; a la tarjeta nunca se le pregunta.

## La puerta: el AIP (bit 5)

Solo si el bit 5 del AIP (CVM supported) está activo, la terminal busca los datos de verificación de la tarjeta. La pregunta "¿esta transacción va a pedir PIN?" ya tiene respuesta en el segundo comando de la sesión.

Ojo con la sesión contactless de Visa de las capturas de ejemplo: AIP = 00 00, sin capacidades. No está rota: Visa traslada la decisión a sus **Card Transaction Qualifiers (9F6C)**. Una CVM List leída sola no te dice nada hasta comprobar si el AIP abrió la puerta.

## La CVM List (tag 8E)

Tres partes, sin encabezados: **X** (4 bytes, importe), **Y** (4 bytes, importe), y reglas de 2 bytes. Las reglas empiezan en el 9º byte; un parser desfasado un byte convierte una política de firma en galimatías. Si el byte de longitud da un número impar de bytes de reglas, la terminal **termina la transacción** en vez de adivinar.

```
8E 10 00000000 00000000 42 01 41 03 5E 03 1F 03
```

| Regla | Bytes | Qué pide |
|---|---|---|
| 1 | 42 01 | PIN cifrado online, si falla sigue, solo efectivo desatendido |
| 2 | 41 03 | PIN en claro por la tarjeta, si falla sigue, si la terminal lo admite |
| 3 | 5E 03 | Firma en papel, si falla sigue, si la terminal la admite |
| 4 | 1F 03 | No se requiere CVM — el último peldaño: nadie verificado |

X e Y son importes binarios con punto decimal implícito (123 = 0x7B = £1.23 con moneda 826). **Todas las listas de las capturas de ejemplo tienen X=Y=0**: "por debajo de X" nunca se cumple con X=0; "por encima" siempre. Estos emisores no expresan política de importes; dejan el escalonamiento a los límites de piso de la terminal.

## Leer una CV Rule (2 bytes)

**Byte 1**: bit 8 RFU; **bit 7 = "aplicar la regla siguiente si falla"** (el bit del que depende casi todo el argumento de seguridad); bits 6-1 = código CVM:

| Código | Método |
|---|---|
| 000000 | Fail CVM processing (parada deliberada; el Book 3 recomienda bit 7 en 0 y la terminal no procesa más CVMs) |
| 000001 | PIN en claro por la tarjeta (offline) — al que apunta la cuña |
| 000010 | PIN cifrado verificado en línea (todo cajero automático) |
| 000011 | PIN en claro + firma (todos deben tener éxito) |
| 000100 | PIN cifrado por la tarjeta (offline, escucha pasiva no sirve) |
| 000101 | PIN cifrado + firma (rara) |
| 011110 | Firma en papel ("éxito" = la terminal puede imprimir la línea; nadie la comprueba) |
| 011111 | No se requiere CVM (aparece como última regla en 3 de las 4 listas de las capturas de ejemplo) |

**Byte 2 (condición)**: 00 siempre; 01 efectivo desatendido; 02 compra corriente (por exclusión); 03 **si la terminal admite el CVM** (la más común, la usan todas las reglas Mastercard); 04 efectivo manual; 05 cashback; 06/07 vs X; 08/09 vs Y. Condición desconocida → omitir la regla en silencio.

> Bit 7 apagado = "fail cardholder verification if this CVM is unsuccessful". Encendido = "apply succeeding CV Rule". Una lista cuya regla de PIN tiene bit 7 activo se conformará con una firma, y después con nada.

## Cuatro listas reales

| Tarjeta | Reglas | Nota |
|---|---|---|
| Tarjeta de prueba (repetición) | 42 01 41 03 5E 03 1F 03 | Chip and PIN clásico; la única con PIN offline |
| Empresarial Mastercard | 1E 03 42 03 1F 03 | Firma primero (sin caída), luego PIN online; no hay PIN offline que suprimir |
| Contactless Mastercard | 42 03 1E 03 1F 03 | Mismos métodos, reordenados: el orden ES la política |
| Visa Debit contacto | 02 01 42 04 1E 04 02 05 5E 00 5F 00 02 00 | 7 reglas: 3 casos de efectivo, 3 comodines, 1 inalcanzable; nunca envía VERIFY |

> Las dos Mastercard contienen los mismos métodos y condiciones y solo difieren en cuál va primero. La terminal toma la primera regla cuya condición cumple y se detiene: el orden es la política. La regla 7 de la Visa Debit es código muerto (tras "no CVM", todo terminal la deja inalcanzable).

## Recorrido y huellas (TVR byte 3)

Tres desvíos silenciosos a la siguiente regla: condición no se cumple, CVM no reconocido, terminal no lo admite. Un método ejecutado y fallido vuelve a la siguiente solo si bit 7 lo dice. **Dos de esos desvíos dejan huella en el TVR y dos no.**

TVR byte 3: b8 CVM no exitosa (el recorrido terminó sin nadie verificado); b7 CVM no reconocido; b6 límite de intentos superado (63C0/6983/6984); b5 se requería PIN y no hay teclado; b4 se requería PIN, había teclado, no se ingresó (omisión); b3 **PIN online ingresado** (único bit de éxito).

> No hay en todo el byte 3 un bit que diga "el PIN offline se verificó con éxito". El TVR enumera sobre todo fallos; en caso de éxito no indica qué método se usó. El ataque es un corolario de esa frase.

## Así viaja el PIN offline

```
00 20 00 80 08 24 12 34 FF FF FF FF FF
00 20  → VERIFY (el único comando que entrega un PIN)
00     → P1 fijo
80     → P2: bloque de PIN en claro (88 = cifrado)
08     → Lc: 8 bytes (el bloque siempre ocupa 8, la longitud no filtra nada)
24     → control fijo 2 + longitud del PIN (4)
12 34  → el PIN, un dígito por nibble, EN CLARO
FF…    → relleno a 8 bytes
```

La tarjeta compara con método propietario; la spec solo fija la respuesta: `9000` (coincidió — único caso de éxito), `63Cx` (incorrecto, quedan x), `63C0` (sin intentos), `6983/6984` (bloqueado o falló recuperación de PIN cifrado).

> La respuesta de la tarjeta no está autenticada: no hay MAC sobre el 9000 ni nonce que devolver. Dos bytes, y cualquier dispositivo en la línea los produce tan convincentemente como la tarjeta.

## Lo que la terminal anota: CVM Results (9F34)

3 bytes: método ejecutado (codificación del byte 1 de una regla), condición de la regla, resultado (Kernel 5: 00 desconocido, 02 exitoso; el diagrama del Book 3 añade 01 fallido). Ejemplo real: `1E 03 00` = firma, si la terminal la admite, resultado desconocido.

| Desenlace | Byte 1 | Byte 3 |
|---|---|---|
| Sin CVM | 1F | 02 exitoso |
| Obtener firma | 1E | 00 desconocido |
| PIN online | 02 | 00 desconocido |
| Código de confirmación (móvil) | 01 | 02 exitoso |
| Nada ejecutado | 3F | 00 desconocido |

> Los CVM Results llegan a la tarjeta solo si la tarjeta los pidió (9F34 en su CDOL). Una tarjeta que no lo incluye nunca se entera de qué método cree la terminal haber ejecutado; el emisor tampoco. La Visa Debit no pide 9F34 (firmará un criptograma sin que jamás se le diga cómo se verificó al tarjetahabiente); la Mastercard 2022 sí.

## CVM List reescrita en tránsito (de las capturas de ejemplo)

El montaje de interceptación de la captura Mastercard imprimió "Found CVM tag!" y entregó a la terminal una lista **idéntica salvo un byte**: `42→1F` (de PIN online a "no se requiere CVM"). Resultado, dos transacciones consecutivas misma tarjeta/terminal/importe:

| Campo | Lista propia | Lista reescrita |
|---|---|---|
| Método del recorrido | Regla 2: firma | Regla 1: no CVM (toda terminal lo admite) |
| CVM Results | 1E 03 00 | 1F 03 02 (**exitoso**) |
| TVR byte 3 | 00 | 00 — idéntico |
| Respuesta | ARQC | ARQC, sobre datos que afirman "no hacía falta verificación y tuvo éxito" |

> Un byte llevó a la terminal de "se tomó una firma y no sé si era auténtica" a una afirmación positiva de verificación completada. Un byte, en un registro que nada autentica. La contradicción (lista que empieza por PIN online vs "no CVM exitoso") queda en los datos de autorización; que alguien la relacione es cuestión de trastienda, no de protocolo.

¿Por qué no se activa el bit 5 del TVR en la transacción honesta? Por la condición 03: si el método no se admite, la condición misma no se cumple, y una condición incumplida es omisión silenciosa. Contrasta con la Visa Debit (TVR byte 3 = 0x90, bits 8 y 5): sus reglas de PIN online tienen condición "efectivo", que sí se cumple → el bit se activa.

## La cuña

> La falla central del protocolo: el paso de verificación del PIN **nunca se autentica explícitamente**. Un dispositivo entre tarjeta y terminal intercepta el VERIFY, no lo reenvía y responde 0x9000 en nombre de la tarjeta. Cualquier PIN de mentira se acepta.

El exploit publicado son 3 líneas de Python: si el comando empieza por `0020`, devuelve `9000`. Nada más cambia: el ARQC lo calcula la tarjeta auténtica sobre datos auténticos. No es un relay: está en un solo lugar. El PIN tecleado no llega a ninguna parte y el contador de intentos no se mueve — **no queda el rastro forense habitual**.

Qué cree cada parte: la terminal cree que el PIN se verificó (un 9000 que nada autentica); la tarjeta cree que no se pidió PIN (ausencia de VERIFY); el emisor cree que la terminal era incapaz de pedir PIN (decodifica el IAD, no sabe qué CVM eligió la terminal); el recibo puede decir "verificado por PIN".

TVR byte 3 durante el ataque (apéndice del artículo): **00, todos los bits apagados**. El byte solo se marca si el PIN se intentó y falló: la terminal cree que tuvo éxito (byte en cero), la tarjeta cree que no se intentó (acepta el cero). El IAD (formato propietario, Visa criptograma v10) tampoco reporta PIN offline ejecutado: byte 5 = A0, cuatro bits apagados.

> La terminal sabe qué método se eligió pero no puede decodificar el IAD (propietario, no especificado). El emisor puede decodificar el IAD pero no sabe qué método se usó. Ninguna de las dos partes puede identificar la incoherencia, y no hay una tercera que sostenga ambas mitades.

## Qué comprobación lo habría detectado

Que la tarjeta pida los **CVM Results en su CDOL** (9F34). En 2010 los autores habían visto UNA tarjeta que lo pidiera; la Mastercard de 2022 sí lo pide. En el Reino Unido, APACS 70 Book 2 exige mandar IAD + CVM Results al adquirente — "es información suficiente para que el emisor detecte el ataque, pero nuestros resultados muestran con claridad que no lo están haciendo".

> Agujero del fix: si los CVM Results no están en el CDOL, no tienen protección de integridad — un segundo intermediario entre terminal y adquirente también puede manipularlos. Un campo que la tarjeta exige dentro del criptograma está protegido; el mismo campo viajando al adquirente es solo una afirmación. Di cuál de los dos estás auditando.

**No sirven**: SDA→DDA (autentican la tarjeta, que ocurre antes de la CVM) ni CDA (el ataque no toca la entrada ni la salida de la autorización). Sustituir el MAC por una firma no cambia nada respecto a un comando que nunca se envió.

## Yes cards ≠ cuña

- **Yes card**: tarjeta **falsificada** que responde "sí" a cualquier PIN. Funciona solo sin interacción en tiempo real (el criptograma no se comprueba antes de que salga la mercancía). La derrotan DDA, la autorización online o ambas.
- **Cuña**: usa una tarjeta **auténtica**, funciona en línea, independiente de SDA/DDA. "Se arregló pasando a DDA" confunde una cosa con la otra.

**Smart Card Detective** (Omar Choudary, MPhil): interceptor de mano (~£100, AT90USB1287, 2 pilas CR2430, PCB con forma de tarjeta). Aplicaciones: Forward Commands (solo observar — siempre empezar ahí), Store PIN, Modify PIN, Filter Amount (defensiva: detiene el GENERATE AC y muestra el importe), No PIN (el ataque de Murdoch). Pruebas de campo: cafetería del departamento y tiendas de Cambridge, PIN 0000, libros y DVD por +£50, nadie notó nada.

## Qué llevarte

El diagnóstico del artículo: EMV compartimenta el MAC del emisor respecto a la negociación del CVM. El TVR y los resultados de verificación fueron concebidos como **listas de fallos posibles en máscara de bits, no como el informe de una ejecución**. Un campo de banderas que solo registra qué salió mal no responde "¿qué ocurrió?", y cada parte llena ese silencio con una suposición.

> Cuatro preguntas para cualquier paso de verificación: ¿qué parte realiza la comprobación? ¿A qué parte se comunica el resultado, y en un campo que esa parte pueda analizar de verdad? ¿Está el resultado vinculado a lo que se autoriza, o solo viaja a su lado? ¿Y cuando el paso se omite en lugar de fallar, el registro distingue ambas cosas? Chip and PIN respondió con un byte en cero, y siguió una década de transacciones disputadas.