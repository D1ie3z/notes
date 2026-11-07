---
title: El pre-play - respuestas compradas por adelantado
sidebar_position: 14
---

**Analogía para empezar**: imagina un examen oral donde el profesor siempre hace las mismas preguntas en el mismo orden. Un estudiante listo graba las respuestas de otro alumno... y descubre que las preguntas son predecibles. El pre-play es eso: comprarle a la tarjeta, por adelantado, las respuestas a preguntas que todavía no le han hecho — y luego usarlas cuando la terminal hace exactamente esa pregunta.

La fuente es "Chip and Skim: cloning EMV cards with the pre-play attack" (Bond, Choudary, Murdoch, Skorobogatov, Anderson, IEEE S&P 2014): una falla de implementación (terminales con números que no eran impredecibles) y una **falla de protocolo que sobrevive incluso cuando el número es perfecto**.

> La parte que depende de la frescura en el protocolo no es la parte responsable de generarla. El emisor confía en el número impredecible. La terminal lo fabrica. Nada ata a las dos.

## Qué se supone que hace el campo

9F37: 4 bytes, formato b. Descripción normativa: "Value to provide variability and uniqueness to the generation of a cryptogram". **Nada de aleatoriedad, entropía ni quién lo comprueba.** El criptograma es un MAC con llave compartida tarjeta-emisor: el emisor sabe que lo calculó la tarjeta, no **cuándo**. El UN debe aportar eso: si la tarjeta no pudo conocerlo por adelantado, tampoco pudo calcular la respuesta por adelantado.

**El conjunto mínimo del §8.1.1 (Book 2)**, preguntado como "¿puede elegirlo un atacante con una terminal maliciosa?": importe, otro importe, país, TVR, moneda, fecha, tipo y **UN** → todos de la terminal, todos elegibles. AIP → de la tarjeta, estático y leíble por adelantado. ATC → de la tarjeta, solo avanza.

> Para importe/país/moneda/fecha fijos, el UN es casi toda la frescura. Y faltan dos cosas que cualquier diseñador esperaría: **no hay identidad de la terminal** (un criptograma recolectado en una máquina vale en cualquier otra del mismo país) **ni hora del día**.

**ATC ≠ UN**: el contador es de la tarjeta, incrementa, deriva la llave de sesión (§8.1.2) y permite detectar valores vistos — pero no dice cuándo se calculó un criptograma. La tarjeta aporta un número que nunca se repite; la terminal debería aportar uno que no se pueda adivinar. Solo la segunda se midió sobre el terreno.

## Por dónde viaja 9F37

Nunca aparece como valor en una traza: el campo de datos de GENERATE AC **no es TLV**; la tarjeta publica el DOL y la terminal envía la concatenación desnuda. Entrada de DOL = etiqueta + 1 byte de longitud. Etiqueta desconocida → ceros (las longitudes se respetan siempre). En las capturas de ejemplo: CDOL1 termina con 9F37 04 (posición 25); CDOL2 empieza con 8A y vuelve a pedir el UN; el DDOL es solo 9F37 04 (la lista más pequeña de todas las listas). El Book 2: el emisor debe asegurarse de que CDOL1 **y** CDOL2 contengan 9F37. §9.2.1: la terminal debe construir los datos inmediatamente antes de emitir — la spec es consciente del problema, simplemente no puede detectarlo.

**Un valor, tres usos**: se genera una vez y se usa como reto de DDA y en ambos GENERATE AC. En contactless va dentro del GPO (posición 29), mucho antes que en el flujo por contacto.

> Dentro del criptograma y dentro de la firma: el UN es parte del **mensaje**, no de la llave. Cambiarlo después de la respuesta rompe el criptograma; pero hacer la misma pregunta dos veces da dos veces la misma respuesta mientras el ATC no se mueva. En DDA y CDA, los cuatro bytes de la terminal son **lo último que entra en el hash** — lo más fácil de implementar mal y lo más fácil de probar.

## El número que no era impredecible

El caso Gambin: un cliente de HSBC en Malta reclamó transacciones en un cajero de Palma (29 jun 2011). El banco entregó los registros con el UN: `F1246E04 · F1241354 · F1244328 · F1247348`. **17 bits fijos + un contador de 15 bits** que se incrementa cada pocos ms y da la vuelta cada 3 minutos. Un atacante no adivina 32 bits: calibra con una transacción y acierta la posición del contador.

¿Por qué construirlo así? La prueba de conformidad solo exige 4 transacciones consecutivas **distintas**. Un contador pasa siempre; un generador criptográfico tiene una probabilidad pequeña pero real de fallar (paradoja del cumpleaños). Quien lee la prueba en vez del modelo de amenazas elige el contador.

> Una prueba de conformidad que se supera con una construcción que el modelo de amenazas prohíbe es una instrucción para construir lo incorrecto. Pregunta qué mide la certificación antes de preguntar qué afirma la documentación.

**Trabajo de campo** (1000+ transacciones, 22 cajeros, 5 POS; consultas de saldo, no retiros — los retiros repetidos disparan la detección de fraude): ATM5 = contador tras prefijo; ATM1/ATM2 = **característica C** (bit alto y tercer nibble siempre cero → 27 bits de entropía, no 32; 11 de 22 cajeros, de épocas y SO distintos → kernel EMV que posprocesa); POS1 = fuerte pero primer bit siempre cero (¿entero con signo?). Clases de falla: algoritmo obviamente débil; generador simple con mala semilla; generador forzable a un estado conocido.

> Las plataformas modernas suelen usar funciones decentes del SO; las heredadas son o fuertes o pésimas. El peor caso: una plataforma heredada portada a una moderna, donde la llamada propia de aleatoriedad acabó mapeada a la función de biblioteca estándar más a mano. Juzga el linaje del software, no la edad de la máquina.

## Pre-play, y por qué no es repetición

Un delincuente con **acceso temporal** a la tarjeta le pide criptogramas para transacciones que aún no ocurrieron: aporta importe, país, fecha y el UN que espera que produzca un cajero concreto, y guarda las respuestas. Después presenta esas respuestas. Cada criptograma se usa una vez, ante el reto para el que se calculó: **no se repite nada**, y el atacante nunca tiene la llave (tampoco es un clon). Para los registros de un banco, un pre-play se ve idéntico a la clonación que EMV se diseñó para impedir.

| | Repetición | Pre-play | Clon |
|---|---|---|---|
| Qué tiene | La grabación | Respuestas a preguntas no hechas | La llave |
| Tarjeta presente | No, pero solo responde al reto grabado | No — prestada antes, ya lejos | No, nunca más |
| ¿Adivinar el UN? | No puede | Sí (variante generador) / No (variante protocolo) | Nunca |
| El contador | Lo detiene de plano | Lo acota (gastar en orden) | Lo acota (colisión) |
| En el registro del emisor | Duplicado obvio | **Indistinguible** | Indistinguible hasta que los contadores se cruzan |

La recolecta: leer estáticos + GENERATE AC por cada número candidato. ~30 segundos (timeout de autorización estándar) → **más de 100 criptogramas en una visita**. La tarjeta de ataque lleva RTC + capacitor y usa bytes 0x60 (petición de más tiempo); con 10 valores consecutivos no necesita acertar el instante: si el UN no está en la tabla, finge una falla y se reintenta. Demostración de indistinguibilidad: dos tarjetas con misma llave/contador → trazas idénticas, incluso con la tarjeta de pre-play programada.

## La variante que un buen generador no arregla

La terminal genera el UN; el emisor confía en él; en medio hay adquirente, switch y red, **ninguno autentica el valor de extremo a extremo**. Un atacante graba un criptograma para un número elegido por él y lo presenta en una terminal que generó honestamente otro; en algún punto del camino, cambia el valor de la terminal por el suyo. Cinco lugares para la reescritura: malware en el cajero, cadena de suministro saboteada, comercio cómplice, cuña entre terminal y adquirente, dispositivo en el enlace de red — y el flujo de datos entre comercio y adquirente no suele tratarse como sensible.

> En las tarjetas desplegadas no hay ningún mecanismo que permita a la terminal confirmar que su UN se incluyó en el MAC. La terminal no puede comprobar la aritmética de la tarjeta, y el emisor no puede comprobar la honestidad de la terminal. Faltan las dos mitades de la verificación a la vez.

> Esta variante no necesita generador débil, ni tarjeta en el momento del ataque, ni enlace en tiempo real. Un relay exige la tarjeta genuina bajo control mientras el ataque corre; el pre-play eliminó ese requisito — eso le permitió operar a gran escala.

## Una repetición detectada en las capturas

En la sesión de repetición: los retos de INTERNAL AUTHENTICATE difieren (`E52AB5FA` vs `F402C575`) — la terminal produjo un número fresco. El emulador respondió con la misma firma de 128 bytes (no tiene la llave). El TVR del GENERATE AC repetido: primer byte `08` = **bit 4 "DDA failed"** (vs 00 en la genuina). Un pre-player habría obtenido por adelantado la firma para F402C575 y ese bit habría quedado en cero — nada llamaría la atención.

> Ese bit registra un resultado, no una causa. La inferencia es segura solo porque la captura muestra el DDOL (solo el UN) y dos números distintos. Lee un bit del TVR como prueba que hay que corroborar.

## Qué lo detecta y qué no

| Defensa | Quién | Qué aporta |
|---|---|---|
| Generador criptográficamente sólido | Fabricantes, adquirentes, operadores de cajeros | Cierra la variante del número débil y nada más; quienes pagan no son quienes soportan el fraude |
| Rechazar contador < máximo visto | Emisores | Limita la recolecta a la ventana antes del siguiente uso honesto; solo online |
| **Verificar meticulosamente el certificado de transacción** | Emisores | La mejor defensa a corto/mediano plazo contra la variante de protocolo; detecta a posteriori |
| Leer el contador antes de ofrecer el UN | Proveedores de terminales | Obliga a comprometerse antes de ver el reto; no ayuda si el número se predijo exacto |
| Que el emisor aporte el nonce | Nadie, en la práctica | El arreglo teóricamente correcto: la frescura la genera quien depende de ella; cuesta un viaje de ida y vuelta por la red |

El certificado de transacción: en un pre-play **se verifica correctamente**, pero la tarjeta no pudo completar la autenticación del emisor (el emisor real nunca generó la respuesta). Los bits del IAD de Visa registran si la autenticación del emisor se realizó y tuvo éxito. La prueba forense no es "¿es válido el criptograma?" sino "¿muestra el certificado que la tarjeta recibió respuesta de su propio banco?".

**No son defensas**: la firma estática se copia tal cual (y las terminales declaraban en el TVR que ni siquiera la verificaban); DDA no salva al POS — el UN de INTERNAL AUTH es el mismo que el de GENERATE AC, un solo par recolectado cubre ambos.

**Límites del ataque** (logísticos, no criptográficos): país, fechas e importe por adelantado; chip+PIN exige el PIN en la recolecta; el contador acota la ventana.

## Medir una terminal por tu cuenta

Instrumentación: tarjeta de monitoreo fresada (PIC18F24K22 + flash adelgazada, 0.8 mm, seguía siendo tarjeta de pago) y el **Smart Card Detective** (~£100). Pruebas: repetición consecutiva (concluyente, no necesita estadística); **bits y nibbles constantes** (alinear columnas — así se encontró la característica C); monotonía vs reloj (los registros tienen precisión de 1 s: detecta contador lento y oculta uno rápido); comportamiento tras apagar/encender (generador fuerte con semilla débil); pruebas generales de aleatoriedad (no dieron significativo: el posprocesamiento oculta al generador — 4 bytes por transacción es un canal estrecho; una hipótesis concreta se prueba con muestra pequeña, una búsqueda abierta no).

> "No observamos estructura" solo es defendible si dices cuántos valores observaste y qué buscabas. Seis valores no son una muestra.

## Qué cambió y qué no

Abril 2012: boletín de EMVCo — el UN debe ser "verdaderamente impredecible incluso para quien tenga acceso a todos los anteriores" e inviable controlar el siguiente. El texto nuevo habla de la **capacidad del adversario de predecir**, no de que los valores sean distintos: la propiedad correcta. Pero aborda solo la primera falla; ~2 años después la variante de protocolo seguía sin respuesta (con un caso probable en ataques reales).

> El análisis formal lo pasó por alto porque modelaba el UN como un nonce fresco (EMV nunca lo exige) y a la terminal y al emisor como un mismo principal (no lo son). La especificación del campo está en la página 1498 de un conjunto de más de cuatro mil.

Tres lecciones generales: un nombre no prueba que algo mida la propiedad ("impredecible" fue solo un nombre durante una década); la parte que depende de un valor y la que lo produce pueden ser distintas — mira la distancia entre ellas; y los registros valen lo que un atacante no pudo escribir en ellos — aquí solo era la firma de la tarjeta, y la tarjeta firma lo que le digan.

> Tres formas en que una autenticación que se verifica correctamente puede ser falsa: se calculó **demasiado pronto** (pre-play), **demasiado lejos** (relay), o **para una pregunta que nadie hizo**. La resistencia a la manipulación era la razón de ser del chip; el pre-play concede esa premisa — la llave se queda dentro, y el ataque produce igual transacciones indistinguibles llegando al local, a la terminal antes de venderse o a la línea de red de atrás. La defensa sigue funcionando como se diseñó y ya no decide nada.