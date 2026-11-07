---
title: El lado del host
sidebar_position: 19
---

La otra mitad del riel: cuando la terminal decide ir en línea, la transacción sale del mundo de la tarjeta y se convierte en un **mensaje** — pasa por adquirente, red del esquema y host del emisor, y en el trayecto el PIN viaja dentro de módulos de seguridad de hardware.

## ¿En qué frontera estás?

Dos fronteras que no se parecen en nada:
- **Comercio ↔ adquirente**: formato propietario del adquirente (ej. Chase Paymentech OPFS v7.4, 800 páginas: registro ASCII de posiciones fijas que empieza con "P", 84 posiciones obligatorias, Format Indicators de 2 caracteres; **las palabras ISO 8583, MTI y mapa de bits no aparecen en ninguna parte**).
- **Adquirente ↔ esquema ↔ emisor**: **ISO 8583** — la frontera de intercambio. El trabajo del adquirente, en una frase, es traducir entre ambas.

> Antes de leer un número de campo, averigua de qué lado del adquirente estás. "El campo 55 lleva los datos EMV" es cierto en la frontera de intercambio y falso en la de comercio de Chase (los datos del chip viajan en un Format Indicator llamado CP). Un plan de pruebas escrito para el contenedor equivocado produce hallazgos que nadie puede reproducir.

## ISO 8583: el mensaje que transporta el dinero

Estándar de 1987 que todavía transporta casi todas las transacciones con tarjeta. Tres partes: **MTI** de 4 dígitos + **mapa(s) de bits** + elementos de datos. **No hay etiquetas**: el mapa dice cuáles de los 128 elementos posibles están presentes, y quien lee debe conocer el formato de cada uno por adelantado. Fijos = sin longitud; variables = longitud decimal justo antes de los datos.

**MTI** (aprende la gramática, no una tabla de nombres): `0200` = versión 0 (1987), clase 2 (financiera; 1 = autorización, 4 = reversa), función 0 (solicitud; 1 = respuesta), origen 0 (adquirente). `0400`/`0410` = reversa y su respuesta. **Una reversa que nunca llega es una transacción que queda autorizada** — el manejo de reversas es una fuente recurrente de defectos reales.

**Mapa de bits**: 64 bits en 16 hex. Bit n activo → el elemento n aparece después, en orden. Bit 1 → hay mapa secundario (128). Todo lo que el mensaje contiene se decide aquí, antes de interpretar un byte.

**Elementos que encontrarás constantemente:**

| DE | Transporta |
|---|---|
| 2 | PAN, con su longitud de 2 dígitos delante (LLVAR canónico) |
| 3 | Código de proceso — el primer dígito separa retiro de consulta de saldo |
| 4 | Importe en unidades menores, sin punto decimal |
| 7 | Fecha y hora MMDDhhmmss UTC |
| 11 | STAN — empareja respuesta con solicitud |
| 22 | Modo de entrada + dígito de teclado de PIN |
| 35 | Track 2 — el registro de la banda magnética dentro de un campo |
| 39 | Código de respuesta: 00 aprobada, 51 fondos insuficientes |
| 49 | Moneda ISO 4217 |
| 52 | **El bloque de PIN cifrado** — nunca más de uno |
| 54 | Importes adicionales (tipo de cuenta, tipo de importe, moneda, signo, saldo) |
| 55 | Datos ICC: criptograma, ATC, IAD — los datos EMV de la tarjeta en un campo |
| 60/63/127 | Privados: lo que los extremos hayan acordado |

> Los números son estables; **los formatos no**. DE 127: el Debit Switch de Mastercard remite al procesador, STAR espera datos de preautorización, RuPay datos biométricos TLV. Un mismo número, tres significados incompatibles — un decodificador que adivine saca basura que, sin etiquetas, corre hasta el final del mensaje. Y el DE 2 es el PAN **en claro**, sin cifrado propio: lo protege el transporte. Un registro ISO 8583 capturado es CHD en el sentido más estricto — nunca lo compartas sin sanitizar.

## De dónde salen las longitudes

Tres formas: **fija** (el importe de Chase = 12 posiciones, justificado a la derecha, 2 decimales implícitos que nunca se escriben: `000000007575` = $75.75 — leerlo como entero se equivoca por un factor de 100 en la dirección que nadie nota hasta la liquidación), **LLVAR** (2 dígitos, ≤99), **LLLVAR** (3, ≤999). Trampa de Chase: el encabezado de 3 dígitos del indicador de chip cuenta **la versión ASCII expandida** del binario (el comercio convierte el BER-TLV binario a hex ASCII): un criptograma de 200 bytes → 400 caracteres → el encabezado debe decir 400. Equivocarse hacia el lado seguro = medio mensaje; hacia el otro = rebasar 999 y perder el final en silencio — el emisor ve un criptograma que no puede verificar y la falla aflora como declinaciones inexplicables.

## Códigos de respuesta

Interchange (DE 39): 00 / 51 — los dos valores que escribía FASTCash. Frontera de comercio (Chase, 3 dígitos): tres categorías — **éxito, rechazo** (nunca llegó a la red; lo que hay que corregir está en tu mensaje) y **declinación** (volvió del emisor; arreglar tu mensaje no cambiará). Útiles: 100 aprobada (el único éxito); 000 sin respuesta (para esto existen las reversas); 301 emisor no disponible; 303 declinación del procesador; 305 ya reversada (ventana de débito: 90 min en Chase); 306 importe no coincide (las reversas parciales fallan aquí); 307 autorización no encontrada (número de orden reutilizado); 225 dato de campo inválido (el rechazo comodín).

> Tres de ocho códigos existen solo para describir una reversa que no pudo emparejarse: así te dice la especificación dónde se rompen sus integraciones. Y los Format Indicators de respuesta **no se devuelven en los rechazos de front-end**: un código que lee desde la posición 85 sin revisar antes el código de respuesta falla justo en la ruta más difícil de reproducir.

## Modo de entrada: la degradación, en el cable

01 tecleada a mano · 05 chip, pista confiable · 07 chip sin contacto · **79 chip → tecleo manual (fallback)** · **80 chip → banda (fallback)** · 90 banda completa · 95 chip con pista no confiable. Los modos 79/80 son la degradación del tema de la clonación y la degradación en el vocabulario del adquirente — y no viajan solos: junto al modo va el **código de capacidad del lector**. "Esta terminal lee chips" + "esta transacción usó la banda" en dígitos contiguos = una degradación **autodeclarada**; cualquiera que sepa mirar dos dígitos en vez de uno puede contarla en todas las transacciones de un comercio. El adquirente es la única parte en posición de alertar sobre esa proporción.

## Los PIN y las cajas donde viven

Un PIN en línea nunca viaja en claro y nunca se descifra en software: se cifra en el teclado de PIN y cada salto hasta el emisor lo vuelve a cifrar dentro de un **HSM** (descifra con la llave entrante, recifra con la saliente, en hardware resistente). Bloques de PIN (ISO 9564): formato 0 = XOR con el PAN (**ligado a la cuenta**), formato 1 = sin PAN (cuando aún no hay cuenta), formato 3 = relleno aleatorio (contra diccionarios de PIN cortos), formato 4 = era AES.

> En esa vinculación está toda la propiedad de seguridad. Un servicio de traducción que convierta un bloque entre formatos o entre cuentas sin comprobar la autorización ayudará a mover un PIN a una cuenta para la que nunca se ingresó — la literatura sobre ataques a las APIs de HSM es esa observación, aplicada con paciencia. Y el espacio que le da una interfaz real: 16 caracteres al PIN cifrado + 16 al KSN, sin identificador de formato ni algoritmo: un bloque DES de 8 bytes. El formato 4 de AES (16 bytes) no cabe en un campo dimensionado en los noventa — migrar es ensanchar el campo, y todas las partes a la vez.

## DUKPT: una llave por transacción

Cada terminal recibe una llave inicial derivada de una **llave base que nunca ve**, y deriva de forma irreversible una llave por transacción. Comprometer una terminal no revela nada de las otras (se derivaron por separado), ni sus transacciones pasadas (la derivación solo avanza). Por eso el **KSN** viaja junto al bloque de PIN: el receptor no puede derivar la llave sin saber qué dispositivo y qué contador la produjeron — el KSN es la mitad del descifrado. Un número de serie completo son 20 hex; el campo de Chase tiene 16 — la interfaz recorta en alguna parte, y los dos extremos tienen que recortar lo mismo.

**Ceremonias de llaves**: varios custodios, cada uno con un componente; los componentes se combinan dentro de un HSM para que nadie tenga nunca la llave completa; documentado y ante testigos. El adquirente suele **delegarla y regularla por contrato**: las llaves del teclado de PIN las instala una Encryption Service Organization aprobada y auditada contra TG-3. El control es un informe de auditoría, no algo observable en un mensaje.

> Ningún escáner encuentra nada de esto: ¿los componentes se guardan juntos? ¿se fue un custodio? ¿una ceremonia sin registro? ¿una sola persona tuvo todos los componentes alguna vez? ¿venció la aprobación del proveedor de inyección hace dos renovaciones? La criptografía es intachable; el riesgo vive en el proceso que la rodea.

## FASTCash: atacar el switch, no la tarjeta

Análisis de Kevin Perlow (Black Hat 2020): grupo vinculado a Corea del Norte que desde ~2016 saca dinero de cajeros **sin tocar un solo cajero** — el malware vive en el **switch de pagos**. Inyecta una biblioteca que hookea `send` y `recv`; de cada mensaje extrae MTI, DE 2 y DE 3 y pregunta: ¿llegó de la dirección interna esperada? ¿es solicitud y no respuesta? ¿el PAN está en la lista? Si alguna respuesta es no → pasa intacto. Si todas son sí → **construye la respuesta él mismo**: copia los campos que deben coincidir (PAN, proceso, importe, STAN, vencimiento, modo de entrada, IDs de terminal y aceptante, moneda), convierte el 0200 en un **0210**, escribe **00 en el DE 39**, y lo devuelve al cajero. El emisor nunca se consulta: nunca se comprueba cuenta, saldo ni límite.

> La lista de permitidos te dice a qué temían: aprobar todo repartiría dinero a clientes normales y se notaría el mismo día. La lista existe para evitar la detección, no para elegir objetivos. La versión Windows añade una lista de bloqueo (retirar una tarjeta sin redesplegar) — propia de un malware que espera quedarse residente.

Detalles que filtran: decide por el primer dígito del DE 3 (retiro = aprobación; consulta = saldo fabricado); la versión Windows exige modo de entrada empezando por 9 (banda completa o chip con pista no confiable) — **los operadores querían que sus mulas usaran plástico real en cajeros reales**, para que el tráfico parezca ordinario. La moneda de los saldos fabricados (DE 54) está quemada en el código: AIX = 356 (rupia india), Windows = 949 (lira turca) — una constante de 3 dígitos delataba el país objetivo de cada versión.

> La técnica es poco común porque **no escala**, no porque sea difícil: cada red implementa ISO 8583 distinto → reconstruir por víctima, y el cash-out sigue necesitando mulas. Lo que elimina es el cajero como objetivo: no hay skimmer, ni malware de dispensador, ni acceso físico. Las máquinas se comportan como fueron diseñadas y la mentira se cuenta un salto más arriba, en un campo de dos caracteres. Contraste: **Cobalt** (Group-IB 2016) entró por phishing, tomó el dominio y manejó el dispensador por XFS hasta vaciar casetes. El mismo delito en los extremos opuestos: Cobalt se apodera de la máquina; FASTCash se apodera de la respuesta que la máquina está esperando. Un modelo de amenazas que solo cubre uno cubre la mitad del parque.

## ISO 20022 y por qué la migración es lenta

XML, autodescriptivo, datos más ricos, sin mapas de bits que memorizar. Llega despacio porque **un formato de mensaje es un idioma que todos los participantes deben hablar a la vez**, no software que una parte actualiza sola. La superficie de ataque más interesante de la próxima década: **la traducción entre los dos formatos** — un campo opcional en uno es obligatorio en el otro, un nombre se trunca, un importe estructurado se encuentra con dos decimales implícitos. Toda migración construye una capa de conversión, y una capa de conversión es donde se encuentran las suposiciones de ambos lados. FASTCash vivía en un lugar del mismo tipo: el proceso que traduce entre dos protocolos.