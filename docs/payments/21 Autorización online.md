---
title: Autorización online
sidebar_position: 21
---

**Analogía para empezar**: en la nota de la criptografía del chip viste a la tarjeta producir un criptograma de 8 bytes — imagínalo como un cheque firmado. Casi todo el material sobre EMV se detiene ahí, y es un lugar raro para parar, porque **todavía no se decidió nada**: la tarjeta no puede aprobar (no tiene reloj confiable, ni saldo, ni forma de hablar con su banco). Lo que produjo es evidencia. Este módulo sigue esa evidencia desde que sale de la terminal: quién la lee, qué verifica y — lo más importante — qué **no** verifica nadie. La respuesta abarca menos de lo que casi todos esperan, y el trabajo está en los huecos entre verificación y verificación.

## El viaje de ida y vuelta, de extremo a extremo

Cinco partes, y cada una **reescribe el mensaje** antes de pasarlo: la tarjeta habla APDU; la terminal habla el formato de su adquirente; el adquirente habla el dialecto ISO 8583 del esquema; el esquema habla el del emisor. En algún punto el criptograma se copia, sin cambios, a un campo llamado **55** — es lo único de todo el mensaje que sobrevive byte por byte a cada reescritura, porque nadie en el camino puede regenerarlo (no tiene las llaves).

> Cada caja del diagrama, salvo la tarjeta, es un sistema al que te pueden dar acceso en un proyecto. La tarjeta es el único participante diseñado para resistir manipulación; todo lo de arriba es infraestructura común corriendo software común — y es ahí donde de verdad se mueve el dinero.

## Los 29 bytes que la tarjeta firmó

El CDOL1 de la tarjeta pide 29 bytes y la terminal los entrega en crudo, sin etiquetas, en el orden pedido (Lc = 0x1D): monto ($70.00), otro monto (0), país (0840 = US), TVR, moneda (0840 = USD — la coincidencia con el país es casualidad de ISO 3166/4217), fecha (2020-10-28 — **la terminal la entrega; la tarjeta no tiene reloj**), tipo, número impredecible.

> Fíjate quién produjo cada valor: **todos vienen de la terminal** — el monto, el país, la moneda, la fecha, el UN, el TVR. La tarjeta no aporta nada a su propia entrada salvo la lista que la exige; después firma lo que le entregaron, sin poder contrastar ni uno solo de esos valores con nada. EMV se diseñó así: la tarjeta es un **oráculo de firma** para una declaración que compone la terminal, y el argumento de seguridad descansa en que alguien más adelante — el emisor — verifique si esa declaración es plausible. Ese alguien está limitado por lo que le llega.

## Campo 55: donde EMV cruza a ISO 8583

ISO 8583 (1987) es una década anterior a EMV. Cuando llegaron los chips, la industria no renumeró la tabla: tomó un elemento reservado, el **DE 55**, y lo definió como una bolsa (hasta 999 caracteres) para llevar datos EMV en TLV. Esa decisión explica dos cosas: el criptograma sobrevive intacto porque es carga opaca que nadie tiene motivo de tocar; y el campo 55 es el **menos estandarizado** del mensaje — el estándar define el contenedor, no qué etiquetas van dentro.

El campo 55 real del tema lleva 14 etiquetas y casi toda la lista del CDOL1 otra vez — porque **el emisor no puede verificar el criptograma sin las entradas que lo produjeron**: tiene que recalcular lo que calculó la tarjeta. Qué contiene: 9F26 (el criptograma — el único campo que falla de forma evidente), 9F36 (ATC — para detectar duplicados), 9F02 (monto firmado), 95 (TVR — "se le aplican políticas, pero el emisor no tiene forma independiente de saber si es cierto"), 9F10 (IAD — el más denso: CVM results, contadores, derivación de llaves), 9F1A/5F2A (país/moneda, entradas del criptograma entregadas por la terminal).

> Dos adquirentes envían conjuntos de etiquetas distintos para la misma transacción. Cuando te entreguen un campo 55, pregunta de quién es la lista de etiquetas antes de preguntar qué significan.

## El monto viaja dos veces (y nadie está obligado a compararlas)

**DE 4** = el campo Amount, transaction: 12 dígitos en claro, cerca del inicio; es el número que **compensa** el adquirente — el del estado de cuenta, el que se le paga al comercio. **9F02** dentro del DE 55 = el monto **firmado**. La misma cantidad, dos codificaciones, dos autoridades. Solo la copia firmada está dentro del criptograma: cambia el DE 4 y **todas** las verificaciones criptográficas siguen pasando (ninguna se calculó sobre él); cambia el 9F02 y el criptograma falla al instante.

> Nada en ISO 8583 exige que las dos coincidan. Cualquier conciliación es una regla que alguien agrega encima, en un esquema, un host o un adquirente — y una regla que vive en una implementación varía según la implementación. ¿Alguien lo verifica? Es trabajo **empírico**; ninguna especificación lo resuelve. El patrón se repite: moneda en 5F2A y DE 49; país en 9F1A y en el enrutamiento; fecha en 9A y en DE 7/12/13. Aprende el patrón, no el caso.

## La respuesta del emisor, y qué la prueba

La decisión viaja en el **DE 39** (2 caracteres, "00" = aprobado) — trivial para la terminal. Lo interesante es hacérsela llegar a la **tarjeta**, que pasó todo el tiempo con una transacción abierta y no tiene motivo para creer nada de lo que la terminal diga. Por eso el emisor **firma su respuesta**: calcula un ARPC sobre el ARQC verificado con la misma llave de sesión, y lo devuelve como **tag 91 (Issuer Authentication Data)**; la tarjeta puede verificarlo derivando la misma llave. Es el segundo GENERATE AC (P1 = 40, pide TC): CDOL2 = 8A (Authorisation Response Code "00") + el CDOL1 textual + 91 (4 bytes ARPC + 4 bytes **Card Status Update**).

El **CSU es el control remoto del emisor**: byte 2 — b8 aprueba en línea (el único encendido aquí), b7/b6 bloquean tarjeta/aplicación (desactivación remota autenticada), b5 actualiza el contador de intentos de PIN (así desbloquea un banco una tarjeta sin tocarla), b3 = CSU creado por un **proxy** (stand-in declarado — señal verificable de que el emisor nunca vio la transacción), b2/b1 actualizan contadores offline (una codificación los pone en cero: la tarjeta recupera todo su margen offline).

> El tag 91 es **opcional**: si el emisor no lo envía o el adquirente no lo reenvía, la tarjeta recibe el 8A y nada más — un código de aprobación sin prueba de origen, entregado por la terminal. El Book 2 dice que un ARPC "debería" devolverse solo si el ARQC verificó — y ese "debería" no está de adorno. La criptografía es sólida; lo que decide si la autenticación del emisor protege algo es si el ARPC llega y si la tarjeta lo exige. Y el Book 2 abre toda la sección de criptogramas diciendo que sus métodos **no son obligatorios** — dos emisores pueden cumplir la spec y comportarse distinto.

## La última palabra de la tarjeta

Formato 1, dos respuestas lado a lado: CID `80` (ARQC) → `40` (TC); ATC `0046` en ambas (**el contador identifica la transacción, no el criptograma** — el ARQC y el TC de una compra lo comparten); criptogramas completamente distintos (el TC cubre el CDOL2, con el 8A y el 91). El **TC es lo que el adquirente presenta para compensación**: la firma de la tarjeta sobre la transacción completada, código de aprobación incluido — la evidencia más fuerte del intercambio, y la que más probable es que falte: si la terminal se queda sin energía o pierde la tarjeta, no hay TC y la transacción se resuelve por otros medios (la siguiente sección).

## Emparejar una respuesta con su solicitud

ISO 8583 lo hace con campos de 1987, ninguno criptográfico y ninguno producido por la tarjeta: **DE 11 STAN** (6 dígitos, se reinicia en 999999 y suele hacerlo cada día — único por originador y por día en el mejor caso), **DE 37 RRN** (12 alfanuméricos, "para toda la vida" — pero su construcción queda a criterio del adquirente y nadie puede verificarla), **DE 7/12/13** (fechas/horas de la terminal, sin autenticar — la deriva del reloj se vuelve un problema de emparejamiento), y el **ATC** (el único contador autenticado, pero corresponde a la tarjeta, no a la transacción, y el switch no lo usa para enrutar).

> Ningún campo de una autorización es a la vez único para la transacción y autenticado de extremo a extremo. En ese hueco aparecen los cargos duplicados y cada reversa que no encuentra su original.

## Autorizar no es pagar

**0100 (doble mensaje)**: retiene fondos, no mueve dinero; le sigue un archivo de compensación horas o días después, en otro formato (crédito, algo de débito). **0200 (mensaje único)**: retiene y compensa a la vez (débito y ahorro). Cambia incluso qué significa que un ataque tenga éxito.

> En el doble mensaje se **espera** que el monto autorizado y el compensado difieran: el restaurante agrega propina, la gasolinera autoriza un monto nominal y compensa el real. Esa variación legítima es lo que hace difícil ver una ilegítima: los mecanismos de detección pelean contra un sistema diseñado para que el monto cambie.

## Stand-in: cuando el emisor nunca la ve

El host emisor se cae → el esquema responde en su nombre con reglas que el emisor dejó fijadas (montos pequeños, tarjetas conocidas, número limitado de operaciones). La caja ve una aprobación común; el dinero es real; la parte que verificó el criptograma **no es la que tiene la cuenta**. Si el stand-in verificó el criptograma depende de si el esquema tiene las llaves — varía por esquema, producto y acuerdo. Lo que no cambia: el bit de proxy del CSU **debe** estar encendido si un proxy lo generó — uno de los pocos lugares donde el mensaje está obligado a admitir algo sobre sí mismo.

> En un proyecto, pide tráfico de stand-in explícitamente: es otra ruta de código, corre tan poco que recibe menos pruebas que la principal, y es la ventana donde una tarjeta que el emisor habría rechazado resulta aprobada. Muestrear solo tráfico normal no te dice nada.

## Reversas y repeticiones

Los fondos retenidos se liberan reenviando el mensaje original con el dígito de clase del MTI cambiado a 4 (`0200` → `0400`). La reversa lleva el DE 90 (los elementos originales: MTI, STAN, fecha/hora, IDs de institución — toda la clave de emparejamiento explícita) y el campo 55. Las reversas no deben perderse → se reintentan: una repetición es el mismo mensaje con el último dígito del MTI en 1 (`0400` → `0401`). **Más allá de ese dígito, nada distingue el segundo intento del primero.**

> Toda la detección de duplicados depende del **estado del receptor**: tiene que recordar que ya procesó este STAN de este adquirente en esta fecha, incluso después de un reinicio y del corte de fin de día. **Revierte dos veces y habrás acreditado una cuenta dos veces.** Lo primero que yo revisaría en un switch — y no es criptográfico. Y la reversa repite el patrón de las dos copias: repite el monto en DE 4 y arrastra el campo 55, pero el criptograma de ese campo lo calculó una tarjeta que ya no está y a la que no se le puede preguntar nada. Una reversa es una repetición de datos autenticados adosada a una instrucción no autenticada — y la instrucción es la que mueve dinero.

## El problema del dialecto, demostrado

Un mensaje real (123 caracteres, sin PAN — el bit 2 del mapa apagado, así que se puede imprimir). El mapa de bits nombra DE 3, 4, 7, 11, 12, 13, 15, 18, 32, 37, 42, 48, 49 y 60. Todo se lee inequívoco hasta los últimos 15 caracteres (tres campos restantes: DE 48, 49, 60): con la tabla del estándar tal cual, el primer prefijo de longitud variable sería `333` — un campo más largo que el mensaje entero. El mensaje **no se puede decodificar** con el estándar solo. Hay **diecinueve** lecturas plausibles que consumen el mensaje exactamente, cada una con un merchant ID distinto y una moneda distinta.

> Un mensaje ISO 8583 no se autodescribe: el mapa de bits dice qué campos hay, no cuánto miden; las reglas de longitud viven en una especificación que tiene el adquirente. El primer documento que hay que pedir en cualquier proyecto del lado host es **la especificación de interfaz del enlace exacto que te dieron, en la versión que está en producción** — el estándar ISO no resolverá ni uno de los diecinueve. Y las versiones importan: hay tres ediciones en uso (1987, 1993, 2003), las redes las conectan con **adaptadores**, y cada adaptador es software que reescribe mensajes — un campo puede perderse, rellenarse, truncarse o reinterpretarse, y cada caso es un punto donde dos sistemas acaban creyendo cosas distintas de la misma transacción.

## Qué probar en realidad

- **¿La autenticación del emisor está presente y se exige?** Busca el tag 91; luego verifica si el comportamiento de la tarjeta difiere cuando falta (una tarjeta que termina igual en ambos casos no exige nada).
- **¿El switch detecta reversas duplicadas?** Repite una reversa después de un reinicio y tras el corte de fin de día — el reintento es indistinguible del original.
- **¿Qué pasa en stand-in?** Pide las reglas y tráfico de muestra; contrasta el bit de proxy del CSU con lo que los registros del emisor dicen que aprobó.
- **¿Qué etiquetas pone este adquirente en el campo 55?** Muestrea tráfico real; luego verifica qué hace el host cuando falta una etiqueta esperada (la omisión es más común que la corrupción).
- **¿Concuerdan los valores duplicados?** DE 4 vs 9F02, 49 vs 5F2A, fechas vs 9A, en una muestra real. Mides si algún sistema lo notaría.

## La pregunta abierta

Con qué frecuencia un sistema en producción **compara** las copias duplicadas del monto/moneda/fecha no está documentado en ninguna parte. Es una pregunta empírica, abierta. La distinción vale para todo el material: **casi toda la literatura sobre seguridad en pagos afirma como hechos lo que son suposiciones sobre implementaciones que nadie ha estudiado.** Cuando estés por escribir "el emisor verifica X", pregúntate qué documento lo dice — y si ese documento obliga a alguien.