---
title: Conceptos básicos - el diccionario del que empieza
sidebar_position: 1
---

**Analogía general**: un pago con tarjeta es como pagar con un cheque firmado, pero con una cadena de personas que se lo pasan de mano en mano antes de que el banco lo cobre. Cada persona del camino solo ve una parte, y la seguridad del sistema depende de quién firma qué y de quién confía en quién. Esta nota define el vocabulario mínimo para entender el resto: si te pierdes con un término, vuelve aquí.

## Las partes del sistema

- **Tarjetahabiente (cardholder)**: la persona dueña de la tarjeta. En la vida real es quien nota el fraude.
- **Tarjeta**: el plástico. Puede tener banda magnética (la franja oscura), chip (el rectángulo dorado) y antena NFC (lo que permite pagar sin contacto).
- **Chip (ICC, Integrated Circuit Card)**: un mini-computador dentro de la tarjeta. Guarda llaves secretas, ejecuta lógica y produce criptogramas. Es "la tarjeta" de la que habla todo el material.
- **Terminal / POS (Point of Sale)**: la máquina donde deslizas, insertas o acercas la tarjeta. Es el "cajero" del lado del comercio.
- **Comercio (merchant)**: quien vende. Es dueño de la terminal y absorbe la pérdida en un contracargo.
- **Adquirente (acquirer)**: el banco del comercio. Recibe las transacciones del comercio y las enruta hacia la red.
- **Red / esquema (scheme)**: Visa, Mastercard, Amex... la infraestructura y las reglas que enrutan y procesan las operaciones entre adquirentes y emisores.
- **Emisor (issuer)**: el banco del tarjetahabiente. Tiene las llaves y es el único que puede verificar un criptograma.
- **HSM (Hardware Security Module)**: una caja de seguridad criptográfica. Descifra y recifra PINs y llaves en hardware resistente a manipulación, para que el texto en claro nunca exista en software.

> El adquirente y el emisor NO son lo mismo. El adquirente es el banco del que vende; el emisor es el banco del que compra. Una transacción cruza de uno al otro a través de la red del esquema.

## Datos y formatos

- **PAN**: el número de la tarjeta (16-19 dígitos). El dato más valioso y el que toda la seguridad intenta proteger.
- **Banda magnética**: datos estáticos grabados físicamente en la franja oscura. Los mismos bytes siempre; se puede copiar con un lector barato.
- **Byte / nibble / hex**: un byte = 8 bits, se escribe como 2 dígitos hexadecimales (00-FF). Un nibble = 4 bits = 1 dígito hex. Los datos de las tarjetas se leen como hex.
- **BCD (decimal empaquetado)**: dos dígitos decimales por byte (ej. `1234` = bytes `12 34`). Así viajan montos y fechas.
- **ASCII**: la forma en que se escriben letras como bytes (`32` = "2", `50` = "P"). Algunos campos de las tarjetas son texto ASCII legible.
- **TLV / BER-TLV**: la forma de empaquetar datos: **Tag** (etiqueta, qué es), **Length** (longitud, cuánto mide), **Value** (valor, el dato). Es como una etiqueta de precio: "esto es el vencimiento, mide 2 bytes, vale 3012".
- **Tag / etiqueta**: el identificador de un dato dentro de un TLV (ej. `57` = Track 2 Equivalent Data, `9F26` = criptograma). Algunos tags miden 1 byte (`57`), otros 2 (`9F26`).
- **Plantilla (template)**: un TLV cuyo valor contiene más TLVs anidados (una caja con cajas adentro).
- **Campo 55 (DE 55)**: la "bolsa" dentro del mensaje de autorización que lleva los datos EMV de la tarjeta en TLV.

## El diálogo tarjeta ↔ terminal

- **APDU**: el idioma entre tarjeta y terminal. Un **comando APDU** (lo que pide la terminal) y una **respuesta APDU** (lo que contesta la tarjeta).
- **Cabecera del comando**: CLA (quién definió el comando), INS (cuál comando: SELECT, READ RECORD, GENERATE AC...), P1/P2 (parámetros). Después vienen Lc (cuántos bytes de datos siguen), los datos, y Le (cuántos bytes de respuesta acepta).
- **Palabra de estado (SW1 SW2)**: los 2 últimos bytes de toda respuesta. Es el "veredicto": `90 00` = éxito, `6A 82` = archivo no encontrado, `6984` = "así no", etc. Es una FRASE, no un código de error: cada combinación dice algo distinto.
- **SELECT**: el comando para elegir una aplicación/archivo en la tarjeta. La terminal empieza pidiendo el directorio de pagos (`2PAY.SYS.DDF01`).
- **GET PROCESSING OPTIONS (GPO)**: el comando que "arranca" la transacción; la tarjeta contesta qué puede hacer (AIP) y dónde están sus datos (AFL).
- **READ RECORD**: leer un registro de datos de la tarjeta.
- **GENERATE AC**: pedir el criptograma (la "firma" de la transacción).
- **DOL (Data Object List)**: una lista que la tarjeta publica pidiendo datos a la terminal (PDOL para el GPO, CDOL1/CDOL2 para el criptograma). La terminal contesta con los valores en crudo, sin etiquetas, en el orden pedido.
- **AIP**: 2 bytes donde la tarjeta declara sus capacidades (qué autenticación sabe hacer).
- **AFL**: la guía de qué registros leer y cuáles están firmados.
- **TVR (Terminal Verification Results)**: 5 bytes donde la terminal anota lo que le pareció mal de la transacción (el "reporte" de la terminal).
- **IAD (Issuer Application Data)**: datos que la tarjeta escribe para su emisor, dentro del criptograma; su formato es propietario.

## Criptografía

- **Llave simétrica**: una sola llave secreta para cifrar y descifrar (como una caja con candado y una sola llave). El **MAC** es una "firma" calculada con llave simétrica.
- **Criptograma**: un MAC sobre los datos de la transacción, calculado por la tarjeta con una llave que solo comparte con su emisor. El emisor lo recalcula y compara: si coincide, lo calculó la tarjeta de verdad.
- **TC / ARQC / AAC**: los tres tipos de criptograma. TC = "apruebo sin conexión"; ARQC = "mándalo en línea para que decida el emisor"; AAC = "rechazado".
- **Llave asimétrica / RSA**: dos llaves: una pública (todos la pueden ver) y una privada (secreta). Lo que firma la privada lo verifica la pública. La firma digital demuestra quién firmó.
- **Certificado**: un documento firmado por una autoridad que ata una llave pública a una identidad (como un pasaporte de la llave).
- **Cadena de certificados**: raíz del esquema (la terminal la tiene preinstalada) → certificado del emisor → certificado de la tarjeta. Así la terminal verifica la llave pública de la tarjeta sin conocerla antes.
- **ATC (Application Transaction Counter)**: contador de transacciones de la tarjeta; avanza en cada operación y entra en el criptograma. Sirve para detectar repeticiones.
- **UN (Unpredictable Number)**: 4 bytes "frescos" que la terminal genera en cada transacción para que el criptograma no se pueda calcular por adelantado. El tema del pre-play.
- **Nonce**: un número que se usa una sola vez (frescura).
- **SDA / DDA / CDA**: tres niveles de autenticación de la tarjeta. SDA = datos estáticos firmados (débil); DDA = la tarjeta firma un reto (media); CDA = la tarjeta firma el criptograma y la transacción (fuerte).
- **PIN**: tu número secreto. **CVM (Cardholder Verification Method)**: la forma de verificar que eres tú (PIN, firma, biometría del teléfono).
- **CDCVM**: la verificación que hace el propio teléfono (rostro/huella) antes de pagar, y que luego "le avisa" a la terminal.
- **PIN block**: el PIN cifrado en un bloque de 8 bytes, ligado a la cuenta (formato 0) para que no se pueda mover de una cuenta a otra.
- **DUKPT**: método para que cada terminal derive una llave distinta por transacción desde una llave base que nunca ve; si roban una terminal no sacan las llaves de las demás.
- **KSN**: el número de serie de llave que viaja con el PIN cifrado para saber con qué llave se cifró.

## El mundo de los mensajes (lado host)

- **ISO 8583**: el idioma entre adquirente, red y emisor (los "rieles"). Mensaje = MTI (tipo) + mapa de bits (qué campos hay) + elementos de datos (los valores).
- **MTI**: 4 dígitos que dicen qué tipo de mensaje es (ej. `0200` = solicitud financiera, `0400` = reversa).
- **Mapa de bits**: 64/128 bits que indican qué elementos de datos están presentes (un "índice" del mensaje).
- **DE (Data Element)**: un campo numerado (DE 2 = PAN, DE 4 = monto, DE 39 = código de respuesta, DE 55 = datos EMV).
- **STAN**: número de rastreo para emparejar una solicitud con su respuesta.
- **RRN**: referencia de recuperación, para encontrar una transacción después (disputas).
- **Autorización**: pedir permiso al emisor (retener fondos). **Compensación/liquidación**: cuando el dinero se mueve de verdad (días después).
- **Contracargo (chargeback)**: el mecanismo para revertir una transacción (solo existe en rieles de tarjeta; los pagos instantáneos no lo tienen).
- **Reversa**: mensaje para deshacer una autorización (fondos retenidos que se liberan).

## Tecnologías y ataques

- **Contactless / NFC**: pagar acercando la tarjeta o el teléfono. Mismo protocolo EMV pero por radio y con el guion comprimido.
- **Tokenización**: sustituir el PAN por otro número (DPAN) que solo funciona en un contexto (tu teléfono, un comercio). La bóveda (vault) guarda el mapa token↔PAN real.
- **Fallback**: cuando la terminal no puede leer el chip y se "repliega" a banda magnética. Es una puerta para la degradación.
- **Degradación (downgrade)**: convencer al sistema de usar un mecanismo más débil (decirle "no hay chip" cuando sí lo hay).
- **Relay**: retransmitir los bytes entre una tarjeta lejana y una terminal cercana, para que la tarjeta "pague" sin estar presente.
- **Pre-play**: pedirle a la tarjeta, por adelantado, criptogramas para transacciones que todavía no ocurren (porque el número impredecible se puede predecir o reescribir).
- **Cuña (wedge)**: un dispositivo entre tarjeta y terminal que intercepta el VERIFY del PIN y responde "9000" (éxito) sin preguntarle a la tarjeta.
- **Replay/repetición**: volver a presentar una respuesta grabada.
- **Skimmer**: dispositivo que roba datos de la banda (o del chip) al pasar la tarjeta.
- **SoftPOS**: la terminal convertida en una app del teléfono del comercio (sin hardware certificado).

## Cifras y unidades que aparecen siempre

- **µs / ms**: microsegundos (millonésima de segundo) y milisegundos. Los tiempos de respuesta de una tarjeta se miden en estas unidades.
- **13.56 MHz**: la frecuencia de radio del NFC (ISO 14443).
- **Luhn**: el algoritmo del último dígito del PAN (dígito verificador). Solo detecta errores de tipeo, no autentica nada.
- **SHA-1**: una función hash de 20 bytes que EMV usa dentro de sus firmas.

## La pregunta que se repite en todo el material

Ante cualquier dato: **¿quién lo genera? ¿Quién puede modificarlo? ¿Está firmado? ¿Quién puede verificar la firma? ¿Qué decisión depende de él?** Si un dato decide algo importante y nadie puede verificar que sea cierto, ahí hay un problema. Esa es la herramienta de análisis que usan todas las notas.