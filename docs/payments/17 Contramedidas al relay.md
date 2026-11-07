---
title: Contramedidas al relay
sidebar_position: 17
---

Dos artículos: **Basin, Sasse, Toro-Pozo** — "The EMV Standard: Break, Fix, Verify" (modelo simbólico en Tamarin) y **Radu et al.** — "Practical EMV Relay Protection" (mediciones con Proxmark entre tarjeta y lector). Un relay no produce ninguna afirmación falsa, así que solo quedan dos clases de defensa: **tiempo** o **contexto** (quién está presente, hacia dónde mira la tarjeta, cómo se ve el entorno). Los esquemas eligieron la primera.

## Acotación de distancia, en una idea

Nada viaja más rápido que la luz → un RTT tiene un mínimo fijado por la distancia. Reto que no pueda responderse por anticipado + cronometraje preciso = cota de distancia (Brands y Chaum, 1993). Dos requisitos independientes: **la medición tiene que ser ajustada** y **tiene que estar vinculada a algo que importe**. Mastercard mide el tiempo y lo vincula; Visa vincula un valor y nunca mide el tiempo; Apple no era ninguna de las dos — era una **pantalla de bloqueo**: política sobre quién está presente, no sobre dónde está la tarjeta.

Tres familias: acotación de distancia, **activación por el usuario** (gesto, botón, acercar dos veces), **entorno** (luz, audio, GPS, campo magnético). Solo la primera es una afirmación sobre la física; las otras son correlación. El ataque mPoS (lector en el bolso junto a la tarjeta) las separa: solo la familia que pide una acción resiste.

> Ninguna devuelve una demostración: todas devuelven una **clasificación**, con dos tasas de error (honestas rechazadas / ataques admitidos). Las propuestas académicas publican ambas; las de los esquemas no publican ninguna.

## El Relay Resistance Protocol de Mastercard (RRP)

Especificado en el Book C-2 (kernel 2, desde la v2.5, marzo 2015): extensión del PayPass con un **intercambio de nonce cronometrado en la capa 3**. Linaje: un protocolo académico adoptado casi al pie de la letra — **PaySafe** (Chothia et al.); el mismo Chothia firma el artículo que después lo burló 3 de cada 10 veces.

- La tarjeta anuncia soporte con un **AIP 1981** (las capturas de ejemplo tiene 1980: un bit separa una tarjeta corriente de una resistente — bit 1 del byte 2, RFU en el Book 3).
- El lector envía **EXCHANGE RELAY RESISTANCE DATA** (INS EA) con la **Terminal Relay Resistance Entropy = el mismo UN del GENERATE AC** → el intercambio cronometrado y la transacción autorizada hablan del mismo número.
- La tarjeta responde su nonce + **tres tiempos: mínimo, máximo y estimado** — la tarjeta declara su propia ventana (porque las tarjetas difieren; un límite fijo rechazaría lentas honestas o lo admitiría todo).
- Todo se firma en los **Signed Static Application Data (SSAD, tag 93)** — la firma "estática" lleva nonces frescos. Eso vincula el cronometraje a la transacción.
- Regla: RTT < máximo → continúa; **RTT > máximo tres veces consecutivas** → se detiene. (No "tres en total"; el mínimo y la estimación no intervienen.) Mastercard defiende los reintentos como usabilidad/recuperación, no solo oportunidad del atacante.

> Contra un diseño ingenuo, un relay haría el intercambio rápido con una tarjeta cómplice cercana y el resto con la de la víctima — a menos que el cronometraje esté vinculado a lo que cubre la firma. Esa vinculación es lo primero que hay que buscar, y lo que más a menudo falta.

## Los bits que nadie reservó para esto

| Bit | Para qué se usa | Tabla publicada |
|---|---|---|
| AIP b1 b2 | CDCVM en Mastercard (Basin) | Book 3 Tabla 37: RFU |
| AIP b2 b1 | Ofrece RRP (1980 vs 1981) | Book 3: RFU |
| TVR b5 b2 | Resistencia al relay superada ("debería fijarse a 0000000002") | Anexo C5 Tabla 42: RFU |
| TTQ b1 b1 | Autenticación offline para auth online (kernel Visa) — el bit que hace hablar a un iPhone bloqueado | C-6 Tabla 4-16: RFU (nota: lectores Book B deben fijarlo a 0) |

El motivo es estructural: el Book 3 (2011, contacto primero) no conoce las funciones de los kernels posteriores, que son por esquema y algunos no públicos. El mismo bit significa una cosa en el kernel 2 y nada en el kernel 6, y el byte no dice qué kernel lo produjo. (Como la colisión de etiquetas 9F66 TTQ vs PUNATC: anota de qué tarjeta salió la traza.)

## VISA-L1: la contramedida en la capa 1

La tarjeta presenta un **UID aleatorio de 4 bytes** en la anticolisión (L1SessionParameter) y se ata a la capa 3 (el SDAD — "se basa en nuestras conversaciones con Visa Research", no está en la spec). Si el UID de la capa 1 no coincide con el de la capa 3, se rechaza como posible relay. El UID viaja con un **BCC = XOR** (3F xor AF xor E3 xor 54 = 27): toda la integridad de un UID es un checksum.

Argumento de seguridad de Visa: (1) es difícil fijar el UID, especialmente en teléfonos; (2) el relay en capa 1 es más difícil. **Roto con un Nexus 5 rooteado** (BCM20793M): editar `/etc/libnfc-brcm-20791b05.conf` — añadir `NFA_DM_START_UP_CFG` + `NCI LA_NFCID1` (0x33) + longitud 0x04 + el UID, sumar 6 al byte de longitud, reiniciar NFC. El teléfono emulador de tarjeta adopta el UID de la víctima antes de la anticolisión: todo lo que el lector ve coincide, porque el valor vino de verdad de la tarjeta. Total: ~181 ms.

> VISA-L1 vincula un valor a la firma pero **no incluye ningún reto cronometrado**: el UID viaja en un solo sentido. "No hay medición de tiempo de ida y vuelta dentro del protocolo de Visa" — la seguridad "no depende de ninguna entrada del lado del lector". Los 181 ms son gratis: la tarjeta puede esperar en el estado PROTOCOL antes del SELECT 2PAY, y el reloj del límite de 500 ms no ha arrancado.

> "Visa no tiene acotación de distancia" (Basin). Y el límite de 500 ms es **especificado, no observado**: "EMV in a nutshell" midió terminales contactless con timeouts por encima de **50 segundos**. Tres órdenes de magnitud entre ambas cifras — pregunta cuál midió el reporte que citas.

## Los dos campos de Visa, en las capturas de ejemplo

**TTQ** (no llega como etiqueta: la tarjeta lo pide en su PDOL, 9F66 primero, 4 bytes en crudo dentro del GPO): `32 80 40 00`. **CTQ** (tag 9F6C, en la respuesta al GPO): `00 00`. El bit de **CDCVM realizado (CTQ b2 b8)** es el que activan Basin et al. y Radu et al. — la edición que nadie autentica. El decodificador solo nombra ese bit, y en condicional: la disposición vive en el VCPS propietario; nombrar los 16 sería inventar una especificación.

## Cómo son los tiempos en realidad

Banco de pruebas: ACR122u + Proxmark esnifando (nunca el reloj del propio lector), 5 ángulos × 6 distancias (5-30.6 mm) × 20 mediciones = 600, unidad = periodo de portadora (0.074 µs).

- Capa 1: WUPA ~340 µs, ANTICOLL ~699 µs, SELECT UID ~1127 µs — dispersión 2.36 µs (salvo WUPA de MC/Visa: 146 µs). "Respuesta que no requiere cálculo."
- RATS: primer mensaje con procesamiento → dispersión sube 2-3 órdenes (246-990 µs).
- **Los intercambios de nonce de RRP: 53,000 / 40,100 / 40,100 µs de media, desviaciones de 13,170 / 15,700 / 15,680 µs** — 4 órdenes más que el SELECT UID (0.91 µs). Y el primer reto: **la tarjeta responde primero con una petición de espera (WTX)** — el único intercambio cronometrado de la transacción que empieza con la tarjeta pidiendo más tiempo: un reto cronometrado que admite una petición formal de demora tiene, por construcción, una manera de ser lento indistinguible de estar lejos.

**Correlación con la distancia**: WUPA/ANTICOLL/SELECT UID: ninguna significativa (−0.08 a 0.06); RATS: 0.69-0.82; toda la capa 3: 0.72-0.85 (los nonces de RRP: 0.82/0.85/0.85). La dependencia es la equivocada: más lejos = menos fuerza de campo = **calcula más despacio**. La variación que la cota debe tolerar y la que necesita el atacante son la misma.

**Resultado**: 3 de 10 relays cayeron dentro de los tiempos honestos (67.79, 74.70, 77.05 ms vs máximo honesto 79.62 ms), sin hardware especial. Artefacto: los tiempos dentro del programa de repetición daban ~17 ms de más — es el manejo del chip PN532 (ACR122u y Adafruit usan el mismo). **Mide desde fuera de la pila que cronometras.**

Mastercard respondió bien a la divulgación (sugirió el intercambio en capa 1; tarjetas nuevas más rápidas — blanco móvil). **Despliegue**: RRP en specs desde 2016, "aún no está implementado en lectores comerciales ni en las tarjetas de los clientes"; no pudieron comprar una; la que midieron es un prototipo de ICC Solutions.

## L1RP: el arreglo que implican las mediciones

El nonce cronometrado de Mastercard **bajado a la capa 1** + la vinculación a la firma de Visa. La tarjeta anuncia en el **ATQA (bit 9, reservado)** — un cuarto bit reservado, esta vez propuesto y no desplegado. NONCE_REQ (código libre 0x99 + 4 bytes de `getrandom` + CRC) y NONCE_RES (nonce + BCC) en el hueco del estado ACTIVE antes del RATS (una tarjeta que no conoce el protocolo sigue viviendo: el lector manda RATS y listo). RTT medido: **1116 µs, desviación 2.3 µs** en 30 ejecuciones; la mayor parte es transmisión (~1037 µs), no preparación.

> Si casi todo el intervalo es transmisión, el intervalo se acerca a una constante física: no hay procesamiento que recortar. El diseño consiste en cronometrar **un mensaje que no hace nada** — frente a RRP, donde la tarjeta pasa decenas de ms calculando y la transmisión es un error de redondeo.

El BCC es un XOR: la seguridad viene del nonce impredecible del lector + cronometraje + **la tarjeta firma ambos después** (firma aparte, no SDAD: un READ RECORD nuevo tras el criptograma). Degradación cerrada: capacidad en el AIP, AIP firmado en SDAD, lector comprueba. Contra su propio ataque a VISA-L1: el atacante tendría que **adivinar el nonce del lector por anticipado** — probabilidad 2⁻³². Un dato unidireccional se copia; un reto hay que adivinarlo. Salvedad honesta: el modelo de amenaza no incluye relays de hardware en capa 1 (el trabajo de autos) — pregunta abierta.

## Lo que la verificación formal no dice

Basin et al.: modelos de Tamarin (60 reglas, 793-846 líneas, 43 s-47 min por configuración, 6+ meses). La decisión clave: **la terminal y el banco NO son un solo agente** (los modelos anteriores lo suponían; la terminal no puede verificar el MAC del emisor). Cuatro propiedades: ejecutabilidad, "el banco acepta", autenticación ante la terminal (acuerdo inyectivo), autenticación ante el banco.

> **Un relay no viola ninguna de las cuatro**: la tarjeta sí ejecutó el protocolo con esa terminal, sí coinciden en cada campo, la aceptación sí es única. "Mastercard con CDA está demostrado seguro" y "a una Mastercard con CDA se le puede hacer relay" son ciertas las dos: la demostración trata de acuerdo y frescura; el ataque trata de geografía. Cuando te entreguen un resultado de verificación, pregunta qué propiedades se escribieron.

La verificación de L1RP (marco de Mauw et al.): distancia y tiempo se abstraen a un **orden de eventos** sobre las trazas (envío del reto, respuesta de la tarjeta, recepción, verificación). Tamarin: 327 s para demostrar que la respuesta cae entre envío y recepción. El teorema es la mitad; la otra mitad es el supuesto físico (fase cronometrada corta) — la mitad que falla para RRP. Exclusiones: bancos/terminales honestos, un solo intermediario, sin fraude de distancia ni terrorista.

**Hallazgos del modelo**: evasión del PIN en Visa (CTQ no autenticado: apagar b1 b8 = PIN online, encender b2 b8 = CDCVM; la tarjeta sigue creyendo que pidió PIN online); transacciones offline no auténticas (Visa bajo importe, MC con SDA/DDA: la tarjeta no autentica el criptograma ante la terminal; no lo probaron — habría defraudado a un comercio); **Mastercard con CDA demostrado seguro** (CDCVM en el AIP, cubierto). Arreglos: toda terminal activa el bit 1 del byte 1 del TTQ + **verifica el SDAD**; para el hueco offline: todo en línea (TTQ b2 b8) o ampliar la firma — prefieren el primero: "no exige cambios en el estándar y por tanto no afecta a las tarjetas de consumo en circulación". **Medio arreglo desplegado**: los lectores fijan el bit "y simplemente ignoran el SDAD y no lo comprueban". La confusión de marca es otro artículo (Card Brand Mixup, USENIX 2021).

## Cuando la contramedida es la pantalla de bloqueo

Apple Pay exigía huella/rostro/código — la medida contra relay más eficaz desplegada. **Express Transit** (iOS 12.3, mayo 2019; Samsung octubre 2019) rompió eso: teléfono bloqueado paga en torniquetes. Radu et al. capturaron en el metro de Londres (Proxmark RDV4): un **mensaje extra estático de 15 bytes** antes del comando de despertar — los **Magic Bytes** (no publican su valor por razones éticas). Repetirlos desbloquea Apple Pay (Visa y MC) sin biometría. Para Visa hay que editar además el TTQ (2 bits del byte 1: autenticación offline para auth online + modo EMV). El bit de CDCVM debe activarse en **dos etiquetas**: 9F6C y 9F69 (Card Authentication Related Data) — con ambas: **£1000 de un teléfono bloqueado**.

Tasas: ~40% en vivo (8/20) — no por protección de Apple sino por el cronometraje del reenvío; **cachear las respuestas a READ RECORD → 100%**. Mastercard sobrevivió: un iPhone bloqueado solo ejecuta MC para MCC de transporte (4111, 4131), y el MCC está dentro de los datos firmados.

Cómo hallaron el campo: comparar trazas con/sin verificación en el dispositivo — en MC solo diferían UN, AC, SDAD e IAD; por eliminación, el IAD; confirmado con un MITM que insertaba el IAD autenticado en una transacción sin autenticar (rechazada) y por Mastercard. IADs móviles: Apple verificado `1F4A5732`, Apple transporte `1F4A5760`.

> "Durante el proceso de divulgación Visa lo confirmó, y confirmó que esos bytes estaban en el AC, pero que Visa **no los comprueba**." El campo que habría detenido esto estaba presente, autenticado y sin leer — el mismo CVR dentro del IAD sin leer en los temas 10, 15, 20 y aquí, por grupos distintos en cinco años. Una capacidad que existe, está protegida y nunca se consulta es indistinguible de una que no existe.

Disputa entre equipos: Basin atribuye la evasión a la falta de protección del CTQ; Radu dice que la causa raíz son las **comprobaciones ausentes en el back end** (el IAD de una tarjeta de plástico habría revelado la mentira). Pregunta abierta: ¿el TTQ entra en el criptograma de Visa? (Galloway: no; Basin: sí; Radu: "no está claro" — déjalo sin resolver y di por qué). Samsung como control: un Samsung bloqueado siempre responde a comandos EMV, pero trata importe cero como transporte y cualquier otro como normal → el relay con importe distinto de cero se cancela. Desenlace: Apple → "Visa debe comprobar el CDCVM"; Visa → "es problema de Apple"; los autores hicieron el ataque varias veces, por importes altos, "y nunca nos bloquearon ni nos marcaron por fraude"; sin arreglo publicado; consejo: desactivar el modo transporte en tarjetas Visa; Apple no pagó recompensa (anunció $100k).

## El ataque que una acotación no puede ver: mPoS

Mehr Nezhad y Hao: lector NFC + enlace inalámbrico + emulador de tarjeta remoto + terminal de pago remota **en un solo dispositivo compacto**. "Introdujimos un importe arbitrario por debajo del límite en un dispositivo SumUp y pudimos deducir discretamente ese importe de la tarjeta de un usuario en su bolso o bolsillo." La contramedida principal es un pitido — lo silenciaron con ingeniería inversa de la app Android. **RRP, VISA-L1 y L1RP fallan todos**: la tarjeta está a centímetros del lector; la acotación no es aplicable.

Su propuesta (OPay): tarjeta y terminal miden cada una su **orientación** y la envían al banco (8 bytes de floats de media precisión, cifrados con la llave tarjeta-emisor; la terminal no puede falsificarlos; **compara el banco, no la terminal** — el contraste estructural: el juicio donde vive el historial de fraude, a costa de exigir línea; no funciona en un torniquete sin conectividad). Cifras publicadas (umbral 5°): falso rechazo 4.76% (1.05 toques promedio), falsa aceptación 0.96% (orientación aleatoria) / 15.24% (deliberada); EER 12% / 1%; ataque del 100% → 1-15%.

| Diseño | FR publicada | FA publicada |
|---|---|---|
| OPay 5° | 4.76% | 0.96% / 15.24% |
| Sensores de entorno | 0% (audio) a 67.5% (GPS) | hasta 18.06% |
| **RRP** | **No publicada** (los reintentos la absorben) | **3 de 10** en el único ensayo |

> Una comprobación de proximidad es un **clasificador**: mover el umbral intercambia clientes rechazados por atacantes admitidos, y no hay ajuste con ambos en cero. Las propuestas académicas publican ambas tasas porque un revisor las pide; las de los esquemas no publican ninguna — alguien decidió ese intercambio y no lo puedes auditar. Pregunta con qué tasa de falso rechazo funciona, cómo se midió y con qué tarjetas.

## Qué puede y qué no puede mostrar una traza

449 comandos, 9 bytes de instrucción; **ninguno es 0x72 (ERRD)** — ninguna sesión ejecutó RRP. Ni una línea con marca de tiempo. Lo que sí muestra: la frescura cazando la repetición — dos INTERNAL AUTHENTICATE con retos distintos (E52AB5FA vs F402C575) respondidos con **la misma firma de 133 bytes** (80 81 80 88 2A 03 CD F9…); TVR byte 1: `00` → `08` (bit 4, "falló la autenticación dinámica"). La terminal lo notó, no bloqueó nada y nada se cronometró.

> La frescura cazó la repetición; el cronometraje no habría cazado nada (una grabación responde al instante, más rápido que una tarjeta real). Invierte el caso: un relay reenvía la respuesta auténtica al reto auténtico — la frescura no tiene nada que comprobar, solo al cronometraje le queda algo que decir. **Ninguna defensa contiene a la otra.**

## Cómo leer una contramedida

¿Qué mide exactamente? ¿La medición está vinculada a lo que se autoriza o solo al lado? ¿Qué parte comprueba y tiene incentivo para omitirlo? ¿Cuáles son sus dos tasas de error? ¿Qué ocurre cuando falla: rechaza o se repliega?

| Diseño | Mide | Vincula | Falla por |
|---|---|---|---|
| RRP | RTT capa 3 | Sí (firma) | Varianza y despliegue |
| VISA-L1 | Nada | Sí (valor unidireccional) | Un teléfono que elige su ID |
| L1RP | RTT capa 1 | Sí (firma aparte) | Sin probar vs relays de hardware (reconocido) |
| Express Transit | Ninguna de las dos | No | Comprobación de back end que nadie hace |
| OPay | Orientación | Sí (cifrada al emisor) | Su FA publicada con honestidad |

> Pocas de esas fallas son criptográficas: una propiedad estadística del hardware, una ida y vuelta ausente, un campo sin leer en back office, un hueco admitido en el modelo de amenaza, una tasa de error publicada. La criptografía hace lo que dice en todos — quien audite solo la criptografía aprobará los cinco. Y el estado del despliegue importa tanto como el diseño: RRP se especificó en 2015/16 y nadie lo encontró en una tarjeta emitida por un banco en 2021. Pregunta cuándo se especificó una contramedida, y aparte si alguien la ha visto alguna vez.

Cierre: en 2016 el sector decía que el relay no era atractivo ("solo importes pequeños, no en efectivo, rastreable"). Cada parte quedó anulada: una evasión del PIN quitó el techo, un teléfono bloqueado soltó £1000, y una terminal que cualquiera puede comprar está ahora junto al bolsillo de un desconocido. Lo que cambió no fue el relay, sino las razones para ignorarlo.