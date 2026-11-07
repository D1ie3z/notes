---
title: Relay - la tarjeta que está en otro lado
sidebar_position: 16
---

**Analogía para empezar**: el relay es un puente telefónico entre dos personas que creen estar hablando cara a cara. La tarjeta real está en una ciudad; la terminal en otra; y un intermediario les conecta las llamadas byte a byte. Nadie miente en la conversación — cada palabra es auténtica, cada firma es válida, el criptograma es real y el contador es correcto. **Lo único falso es la distancia**, y hasta hace poco nada en el protocolo la medía.

## La idea

Dos dispositivos y un enlace: uno junto a la terminal finge ser la tarjeta (Card Emulator); otro junto a la tarjeta real finge ser la terminal (Terminal Emulator). Cada APDU se transporta y cada respuesta se trae de vuelta. **Ninguno de los extremos calcula nada.**

> Es más difícil defenderse del relay que de la clonación o la repetición: no hay datos falsificados que detectar. Todas las contramedidas propuestas se basan en el **tiempo o el contexto**, porque la corrección de los datos no está en duda y no puede servir de criterio.

**Frente a los demás ataques** (qué falsifica / qué puede delatarlo): clonación (tarjeta entera / el chip, no tiene llave); degradación (un campo que dirige / a menudo nada); repetición (respuesta grabada / la frescura, el UN); pre-play (nada criptográfico / contador + RNG, a posteriori); cuña (una respuesta no autenticada / contadores de la tarjeta); **relay (absolutamente nada / solo cuándo y dónde — nada de eso está en los datos)**.

## Cómo es posible que funcione

Tres protocolos apilados: **Capa 1** ISO 14443 (UID, tramas — dispersión 2.36 µs), **Capa 2** ISO 7816-4 (APDUs, reenviados tal cual), **Capa 3** EMV (dispersión 48,858 µs). Un relay que reenvía APDUs vive en la capa 2 y es transparente para la capa 3: **el mismo relay sirve para Visa y Mastercard, con contacto y sin contacto, sin saber nada de ninguno.**

Recorre la transacción buscando un campo que dependa de la distancia: no existe. Importe, país, moneda, fecha, tipo, UN, TTQ, MCC: todos describen qué se compra y quién compra, ninguno dice dónde — y la tarjeta los firma todos fielmente. El TVR (40 bits, 26 con significado) **no tiene ni un bit para el tiempo transcurrido**: el bit 2 del byte 5 (resistencia al relay) lo tomó prestado un kernel de un rango reservado años después — EMV nunca previó ninguna comprobación de distancia.

## Qué no necesita un relay

| Ingrediente | ¿Lo necesita? |
|---|---|
| Material de llaves | No — el lector no puede comprobar el MAC; el relay nunca la ve |
| Certificado falsificado | No — la cadena auténtica se reenvía intacta |
| Conocer el protocolo (capa física) | No — relay de autos "completamente independiente de la modulación, el protocolo o la autenticación" |
| Tocar la tarjeta | No — llaves de auto energizadas a 8 m; bobinas pasivas a 49.6 cm; funciona en bolsillo |
| Energía cerca de la víctima | No necesariamente — ReCoil toma todo del campo del lector |
| El PIN | No por debajo del techo contactless |
| **Una sola tarjeta en el campo** | **Sí** — colisión = pago rechazado |
| **Enlace suficientemente rápido** | **Sí** — la única restricción de ingeniería real |
| **Dos lugares a la vez** | **Sí** — el requisito que nadie ha eliminado; por eso el relay sigue siendo raro |

> Francillon et al. (autos) hacen relay en el dominio **analógico**: "no necesita interpretar ni modificar la señal", solo amplificarla, desplazarla en frecuencia y reemitirla. Reforzar la criptografía no cambia nada en un protocolo retransmitido así. "Usamos AES, así que esto está a salvo del relay" es un error de categoría.

El protocolo le regala al relay: la tarjeta puede pedir más tiempo (WTX de ISO 14443-4 — hay una forma legítima de ser lento), y la fragmentación de tramas afecta el cronometraje — "todo intercambio cronometrado debería usar la trama más pequeña posible".

## El presupuesto

La luz recorre ~300 m/µs: un relay de 1 km cuesta 3.3 µs por sentido. Ese mínimo es la base teórica de toda acotación de distancia. La pregunta inversa: ¿cuánto retardo tolera el sistema honesto? Dispersión honesta (Radu et al., 600 mediciones, Proxmark a 0.074 µs):

| Intercambio | Nivel | Dispersión | Propagación que cabe |
|---|---|---|---|
| ANTICOLLISION | 1 | 2.36 µs | ~0.7 km |
| SELECT UID | 1 | 208.85 µs | ~63 km |
| RATS | 1 | 989.97 µs | ~297 km |
| SELECT AID | 3 | 25,137 µs | ~7,500 km |
| GPO 1 | 3 | 48,858 µs | ~14,600 km |
| GPO 2 | 3 | **571,411 µs** | ~171,000 km |

> Cuanto más abajo cronometras, menos espacio hay para esconderse. La última fila: una Mastercard común, GPO 2 promedia 390,503 µs con desviación de 129,160 µs — un comando tarda 4 décimas y varía más de medio segundo entre presentaciones honestas. Algo se está calculando (operaciones de llave pública). Lo que añada un relay se pierde ahí dentro.

**El límite de 500 ms** (libro de arquitectura contactless, no Book 3): acota la transacción entera una vez que EMV empezó; no es por comando ni mide RTT; es un temporizador de vigilancia, no una acotación de distancia. La aportación del relay es una constante cobrada dos veces por RTT (microsegundos por radio local, decenas de ms por internet) — se pierde en la variación de la tarjeta.

> Lo que restringe a un relay no es la velocidad de la luz: son la demodulación y los búferes del propio atacante (~17 ms en el chip NFC; SDR 10-20 ms → FPGA 4 µs). "Los relays también se están volviendo más rápidos, incluso con hardware barato de catálogo" (Man in the NFC, DEF CON 25). Un umbral calibrado para los relays de hoy apunta a un blanco móvil que se mueve a favor del atacante. Y un relay no tiene que retransmitirlo todo: **los registros estáticos se cachean** (los RTT eliminados subieron la tasa de éxito del 40% al 100%).

## Qué cuesta el enlace

| Transporte | Alcance | Costo |
|---|---|---|
| Coaxial | 60 m (estacionamiento) | 350 ns; ~66% de c; se ve |
| Conversión ascendente analógica | 30 m probados, más posible | 120 ns (15-20 ns circuitos); nada se demodula — indetectable como protocolo |
| Wi-Fi / celular | De una sala a una ciudad | El montaje real de Radu et al. |
| Internet / MQTT | **Ilimitado** | Decenas de ms; tarjeta y terminal en continentes distintos |
| LoRa | Kilómetros sin infraestructura | Ancho de banda irrelevante: la respuesta más larga de las capturas son 256 bytes; >95% < 100 |
| Bobinas pasivas | 49.6 cm | Sin enlace y sin alimentación |

> Si una transacción puede completarse con la tarjeta en otro continente, la terminal nunca supo que la tarjeta estaba presente: dio por hecha la presencia a partir de la física de una antena de corto alcance. Nunca hubo un control que burlar.

## ReCoil: el relay sin electrónica dentro

Sun et al. (IEEE IoT 2020): cadena de **bobinas de cobre resonantes** sintonizadas con capacitores variables a 13.56 MHz que guían el flujo magnético del lector hasta la tarjeta. Sin transmisor, sin batería, sin firmware. **49.6 cm contra un límite anunciado de 5 cm: diez veces más.** Hardware: un medio cinturón con dos bobinas cuadradas + una curva, y tres bobinas en una mochila. Robustez: placas de hierro 48.3 cm, teléfonos ajenos 48.2, llaves 48.0; lámina de ferrita recupera y da 49.6; dos tarjetas 45.6, tres 40.5 (sigue seleccionando una). Escenario: la atacante delante de ti en la fila; tu tarjeta paga su compra.

> La propiedad de seguridad es el **silencio**, no el alcance: no transmiten, no modifican ni alteran la temporización — escapan por diseño a la radiogoniometría, a los bytes alterados y a los umbrales de latencia. (Afirman latencia insignificante, sin cifra publicada: trátala como suya.)

## El mismo ataque, en autos

Francillon, Danev, Čapkun (NDSS 2011): acceso pasivo sin llave — 10 modelos de 8 fabricantes, todos cayeron (uno de posventa, ~$200). El reto LF del auto se capta en la manija, se sube a 2.5 GHz, se transporta y se reemite ante la llave; la llave contesta por UHF (~100 m) sin relay. Cable 30 m = 160 ns; inalámbrico = 120 ns; dispersión honesta 11-436 µs; retardo máximo aceptado 35 µs a decenas de ms → relay teórico de 10-3000 km. Alcance hasta la llave: 0.1-8 m (con amplificador de 2-5 W). Costo: $100-1000.

> Los fabricantes fijaron el retardo máximo aceptable en ~20-50 veces la dispersión de respuesta: un parámetro de **confiabilidad** (que quien tiene prisa no quede fuera de su auto), nunca de seguridad — y resulta ser el presupuesto del atacante. Cualquier tolerancia para absorber la variación honesta es, del otro lado, un presupuesto. La proporción la fija la usabilidad, no la criptografía.

Contramedidas: funda metálica (jaula de Faraday — la misma que para tarjetas), quitar la batería (modo pasivo de centímetros). Ambas anulan el acceso sin llave. Ojo: blindar es más difícil de lo que parece y se puede vencer subiendo la potencia. La economía no se parece: el auto se lo llevan entero y sin rastro físico; un pago retransmitido es una transacción limitada por el techo, reversible y ligada a un comercio con relación de adquirencia — por eso los autos produjeron hardware dedicado y los pagos en gran medida no.

## Qué limita de verdad al relay

Operativo, no criptográfico: dos dispositivos en dos lugares en el mismo momento, coordinados, con alguien en cada extremo; una sola compra, en un solo comercio, por un monto limitado por el mismo techo que hizo cómodo el contactless. Por encima del techo el ataque se convierte en un problema de verificación del tarjetahabiente, no de relay. **La medida antirelay más eficaz desplegada es un teléfono que no opera hasta reconocer a su dueño.** Y la detección real es analítica: una transacción en Madrid con una tarjeta usada en Lima hace 4 minutos es imposible, diga lo que diga el cronometraje. La contramedida criptográfica acota; la analítica detecta; solo una está desplegada.

## Por qué una traza no puede mostrarte un relay

Ninguna captura registra un reloj: solo bytes de comando, respuesta y palabra de estado. Una traza de APDUs no puede responder la única pregunta que plantea el relay. **Y sin embargo las capturas de ejemplo sí contienen uno**: la sesión Mastercard la produjo una herramienta que se identifica en texto plano antes del primer comando — "os=relay attack=intercept": tarjeta inteligente virtual + tarjeta real en lector de contacto + dispositivo de acoplamiento por proximidad virtual sobre un socket TCP. Esas líneas están en el archivo de captura; las herramientas de análisis las descartan porque los APDUs son el protocolo y el mensaje de inicio no. Todo cuadra en los bytes, porque todo es auténtico: el relay es el único ataque cuya prueba no está en los datos.