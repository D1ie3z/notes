---
title: Pagos sin conexión
sidebar_position: 20
---

**Analogía para empezar**: EMV se diseñó como un vendedor que SIEMPRE llama al banco antes de cerrar la venta. El lector sin conexión es el vendedor que se quedó sin línea: no puede llamar, así que decide con reglas de pulgar ("si es menos de X, lo acepto"). El problema no es la regla — un puesto de mercado sin señal o un taxi en un túnel es negocio real. El problema es que varias empresas le fueron añadiendo reglas a un protocolo que asumía que el teléfono siempre funcionaría, y ninguna podía ver qué había supuesto la otra. Los ataques viven en esas costuras, no dentro de ninguna función.

## La tesis: funciones añadidas por separado

Square añadió: lectores sin conexión que aceptan **teléfonos pero rechazan plástico** (un teléfono ya verificó a su dueño; el plástico no verificó a nadie, y sin red no hay emisor a quien preguntar). Apple/Google/Samsung añadieron: modos transporte que pagan desde dispositivo bloqueado (un torniquete no espera códigos). Visa/Mastercard añadieron: reglas regionales de PIN para pagos altos (la regulación difiere por país).

Cada decisión era razonable para quien la tomó, con su propio problema delante. La vulnerabilidad está **entre** ellas: una costura es donde la suposición de una empresa choca con el mecanismo de otra, y nadie vio ambas piezas juntas.

> Para evaluar un sistema construido por varias organizaciones: la especificación dice qué prometió cada una, no qué **supuso** cada una. Las costuras están en las suposiciones. Pregunta qué da por cierto cada parte sobre las demás y qué mecanismo garantiza cada creencia. En los cuatro ataques siguientes, la respuesta es "ninguno".

## El banco de pruebas (reproducible, sin equipo exótico)

Proxmark3 RDv4 (esnifa trazas y emula lector), emuladores Android escritos por los autores (la escena que ve la caja: alguien acerca un teléfono), **Square Terminal** (la única con modo offline comprable en UK sin empresa registrada — todos los ataques offline van contra este dispositivo), SumUp Air/Solo + Square Reader (4 lectores, 2 fabricantes, **2 países**), tarjetas Visa/MC de varios países y billeteras Samsung/Nokia/Apple.

> El mismo lector comprado dos veces (UK y Rumania) convierte una observación en una **comparación controlada**: si un pago alto pide PIN en la terminal o te manda a la ranura lo impone una regulación regional, no el protocolo. Con un solo país no puedes saber cuál estás viendo. Costó unos cientos de libras — eso es método, no presupuesto.

## La forma de todos los ataques: dos fases

Los relays anteriores tenían una fase (te metes entre tarjeta y terminal y la transacción se completa o no). Ante un lector sin conexión la transacción se completa **dos veces**: en el mostrador (sin red, la terminal decide sola, se entrega la mercancía) y horas después cuando vuelve la red (el emisor la rechaza — pero ya es un asiento contable, no una defensa). Los autores lo llaman **ataque de almuerzo gratis**: no se roba dinero, el criptograma es auténtico y el rechazo queda registrado. Lo que se lleva el atacante es el intervalo entre las dos fases, y ese intervalo se mide en **mercancía**.

> Detalle que decide quién carga con la pérdida: Square no ofrece al comercio forma de recuperar el dinero. La pérdida cae sobre quien vende por su cuenta en un puesto de mercado — exactamente la persona para la que se construyó el lector, y la que menos capacidad tiene de absorberla. Quien asume el riesgo no es quien eligió la función.

## Ataque 1 — cómo preguntarle a una tarjeta si es un teléfono

Square quiere que su lector offline acepte teléfonos y rechace plástico. **Busca en la especificación EMV el campo que distingue un teléfono de una tarjeta: no existe.** Quince libros, y ninguna forma definida. Así que Square la inventó: comparando dos trazas (un toque con iPhone que funcionó vs un intento con plástico que falló) la diferencia estaba en el primer comando. Ante el teléfono, la terminal no empezaba con el SELECT de pago: primero pedía `SELECT OSE.VAS.01` — el protocolo **VAS** (Value Added Services, Google lo llama Smart Tap): lealtad, cupones, pases de transporte. Solo bajo NDA, reconstruido por ingeniería inversa. Los teléfonos lo hablan; las tarjetas no.

> En vez de preguntar "¿eres un teléfono?", Square hace una pregunta cuya respuesta **solo conoce un teléfono** y toma cualquier respuesta como prueba de identidad. Una comprobación de capacidad ocupando el lugar de una comprobación de autenticación — la improvisación más vieja del diseño de protocolos, que funciona mientras nadie intente engañarla.

Una tarjeta de plástico responde como ISO 7816 manda: "servicio no disponible" → Square interpreta "no es un teléfono" y corta. El hallazgo que lo vuelve ataque: **Square no consume los datos VAS**. El contenido nunca se usa — el hecho de responder era toda la prueba. Entonces: captura una respuesta VAS, repítela ante la terminal, y después haz un relay directo de la transacción de pago a la tarjeta real. Solo el primer intercambio se falsifica, y se falsifica por **repetición**, sin entender nada de VAS ni tener tarjeta de lealtad. El resto es una tarjeta auténtica haciendo un pago auténtico: todas las firmas verifican. Una sola repetición echa abajo una política diseñada a propósito (sin conexión, solo teléfonos). Por sí solo es elusión de política y no fraude (bajo el límite igual no había verificación) — pero los ataques 3 y 4 se construyen sobre él.

## Desvío: la misma tarjeta se comporta distinto en dos países

¿Cómo decide un lector si en un pago alto pide PIN en la propia terminal (**tap-and-PIN**, España/Francia/Alemania) o te manda a la ranura del chip (**non-tap-and-PIN**, UK/Singapur)? Con tarjetas de 4 países y lectores de 2 países, esnifado todo:

- **Mastercard**: todas hicieron tap-and-PIN con el lector rumano y ninguna con los británicos. Los únicos campos que diferían eran los que siempre difieren (nonce, hora, criptograma, firma). **Nada en el intercambio codificaba la regla.** Probando la hipótesis: falsificaron TVR y CVM Results para decir "no se ingresó PIN" y la tarjeta completó igual la transacción por encima del límite → **la tarjeta no aplica la regla en absoluto**. Mastercard la aplica en el **backend** — lugar razonable para una regla regional (se cambia sin reemitir nada) y lugar al que una terminal sin conexión no llega. Por eso el ataque 4 no necesitará trucos criptográficos.
- **Visa**: una tarjeta non-tap-and-PIN ante el lector rumano no completaba la transacción alta. La literatura había concluido "esas tarjetas no hacen contactless sobre el límite". **Falso.**

## Ataque 2 — el error que no era una negativa (6984)

La tarjeta no calla: responde **6984** — "dato referenciado bloqueado, de forma **reversible**". No es "de ninguna manera", es "así no". Tratar 6984 como un muro detuvo una línea de investigación durante años; leído como objeción concreta es una **instrucción sobre qué cambiar** (tema de la comunicación APDU: una palabra de estado es una frase, no un código de error — este es el ejemplo más costoso de todos los que hay en estas notas).

Apagaron la bandera que provocaba la objeción (TTQ byte 2 bit 7, CVM requerido) y las trazas por fin comparables revelaron la regla: las tarjetas tap-and-PIN activan **CTQ byte 1 bit 8** (PIN en línea requerido); las non-tap-and-PIN lo dejan apagado. **En Visa la regla es un bit en un campo que envía la tarjeta** — ni en la spec, ni en el código de país, ni en el backend. Primera explicación publicada de cómo distinguen los lectores. Con dos bits reescritos al vuelo (apagar CVM requerido, encender PIN en línea) el lector pide un PIN contactless a una tarjeta que nunca debió ofrecerlo. Limitación honesta: el atacante aún necesita el PIN. Su valor: explica el mecanismo y vulnera una regulación que los emisores están obligados a cumplir.

> Detalle académico que vale más que el ataque: dos artículos previos discrepaban sobre si hay que apagar el bit de CVM requerido (Galloway: sí; Basin: no hacía falta). Ninguno se equivocaba: Galloway trabajaba en UK con tarjetas non-tap-and-PIN que objetan si el bit no se apaga; Basin en Suiza con una tap-and-PIN que no objeta. **La discrepancia era la geografía, una variable que nadie registró.** Si tus hallazgos dependen de qué tarjeta llevabas en la cartera o de en qué país estaba registrado el lector, dilo — si no, lo escrito no se puede replicar y cualquiera te contradirá de buena fe.

## Ataque 3 — una firma sobre la copia que nadie lee

Galloway y Yunusov habían dicho que su manipulación de bits no podía funcionar sin conexión: en modo offline Visa firma el CTQ dentro de los Signed Dynamic Application Data — cambia el CTQ y la firma falla. Razonamiento correcto e **incompleto**: el bloque firmado no contiene el CTQ, contiene una **copia** del CTQ dentro del campo Card Authentication Related Data (CARD). En la misma transacción el valor aparece dos veces: el CTQ que la terminal lee y usa (sin firmar), y la copia protegida por la firma (nunca leída). **¿Compararlos? La terminal no lo hace.**

La firma es real y se verifica porque el relay nunca toca lo que cubre: edita la otra copia. Falta una comprobación de igualdad que la especificación nunca le pidió a nadie. Con la precaución de dejar en paz la copia firmada, el ataque offline es el mismo: apagar CVM requerido en el TTQ + encender **CDCVM realizado en el CTQ (byte 2 bit 8)** → la Square Terminal sin conexión acepta un pago alto con plástico, sin verificación de ningún tipo.

> Clase de falla, dicho con precisión: lo más probable es un error de implementación de Square (podría comparar el CTQ con su copia y no lo hace). No es cifrado roto ni falla de protocolo. Una firma más fuerte no lo evita: **firmar un valor no sirve si quien depende de él lee otra copia** — y una especificación con campos redundantes sin decir que deben compararse está invitando a esto.

## Ataque 4 — Mastercard, y nada que cambiar

Sin tocar un bit: ataque 1 (respuesta VAS repetida + relay directo) llevó una transacción **por encima del límite** desde la Square Terminal offline a una Mastercard de plástico, y fue aceptada. La regla de tap-and-PIN de Mastercard vive en el backend, y una terminal sin conexión **no tiene backend**. Lo único que queda localmente son los **Card Verification Results dentro del IAD** (donde Mastercard registra si hubo verificación en el dispositivo) — y la Square Terminal offline **no los comprueba**.

> Tres grupos de investigación, tres años, el mismo campo: el CVR dentro del IAD, presente, firmado y sin leer. Un banco reiniciaba un contador que la tarjeta le dijo que no reiniciara (tema de los límites contactless); un servicio de tokens autorizaba un criptograma marcado como rechazo (tema de las billeteras); aquí una terminal acepta un pago alto sin verificación. "El protocolo de Mastercard era el más seguro" se concluyó de transacciones **en línea**, porque en línea era lo que se estudiaba. Lleva el mismo protocolo a un escenario sin conexión y las protecciones siempre estuvieron en otro lugar.

> "A es más seguro que B" describe A y B bajo las condiciones en que alguien midió, nunca A y B a solas. Mastercard poniendo su comprobación en el backend es mejor diseño en cualquier situación donde se pueda llegar al backend, y peor donde no se pueda.

## Corregirlo, y demostrar la corrección

Los autores modelaron las funciones añadidas en **Tamarin** (ampliando el modelo del card brand mixup), propusieron la corrección, verificaron que no abriera otro ataque, dialogaron con EMVCo y **trabajaron con Square para implementarla**. Compara con otras divulgaciones de la literatura: Apple confirmó que no haría cambios (tema de las billeteras); el vencimiento sin mitigación confirmada (tema de la gestión de riesgo en terminal); el contador atendido a medias (tema de los límites contactless). Lo que distingue este desenlace no es la gravedad: **es que un fabricante respondió**.

## Compruébalo en una tarjeta que tengas

Los ataques dependen de lo que una tarjeta afirma sobre sí misma — y está en las capturas de ejemplo: la respuesta al GPO de la Visa contactless lleva el AIP (tag 82) = **0000**. Ni una sola capacidad: sin autenticación offline, sin CVM, sin gestión de riesgo, sin autenticación del emisor. La tarjeta de un curso de seguridad le dice a cada terminal que no admite ninguna de las protecciones de los temas anteriores. Las Mastercard responden 1800 y 1980. **La diferencia es una decisión de producto, no un límite técnico.**

## Qué llevarte a una evaluación

- ¿Cómo decide esta terminal que habla con un teléfono? Si es una capacidad y no una afirmación autenticada → ataque 1 con otro nombre.
- ¿Qué campos aparecen dos veces, y hay algo que los compare? Una copia firmada no protege nada si quien depende del valor lee la copia sin firmar.
- ¿Qué comprobaciones viven en el backend y qué ocurre sin conexión? Una regla aplicada donde la terminal no llega no se aplica en absoluto en modo offline.
- ¿Se evalúa el CVR del IAD, y quién lo hace? Tres ataques de la literatura terminan en ese campo, disponible e ignorado.
- ¿Cuál es la ventana entre la aceptación offline y el rechazo en línea? Ese intervalo es la pérdida, medida en mercancía.

Ninguna de esas preguntas necesita un Proxmark: se responden con una especificación, una configuración y una conversación. Y ninguno de los cuatro ataques exigió romper nada criptográfico.