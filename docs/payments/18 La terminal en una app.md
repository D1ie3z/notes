---
title: La terminal en una app
sidebar_position: 18
---

Todas las terminales anteriores eran dispositivos dedicados: hardware certificado, carcasa resistente, llaves cargadas en entorno controlado. SoftPOS lleva la terminal a una app en un teléfono comprado en un supermercado. Nadie discute que sea menos seguro: la pregunta útil es **qué garantías se perdieron, cuáles no existieron nunca y qué sustituyó al resto**. Es el tema de las billeteras desde el otro lado del mostrador: allí un teléfono afirmaba ser tarjeta; aquí afirma ser terminal, y el problema tiene la misma forma y se resolvió en la dirección opuesta.

## Tres cosas reciben el mismo nombre

| Arquitectura | Dónde están las llaves | Qué es el teléfono |
|---|---|---|
| Terminal clásica | Procesador seguro en la misma caja | No hay teléfono |
| mPoS | Siguen en el lector certificado | Pantalla, teclado, red — **y está en la ruta de la transacción** |
| SoftPOS / Tap to Phone | En ningún lugar fuera del alcance del comercio | **Todo**: radio, kernel, pantalla, red, operador |

Un back end de terminal sellada solo autoriza el pago; el de SoftPOS además **decide si quien pide es siquiera una terminal** — esa segunda tarea no existía y no tiene equivalente en las especificaciones EMV. Casi todos los ataques publicados van contra el mPoS (la fila del medio): "te pueden decir que no es SoftPOS porque hay un lector certificado; la mitad que es teléfono sigue siendo teléfono".

## Qué proporcionaba una terminal certificada (y qué cubría la certificación)

Cuatro garantías: llaves no extraíbles (criptoprocesador que las borra ante manipulación), teclado de PIN ligado físicamente, software firmado en plataforma cerrada, identidad por certificación/serie/cadena de suministro. Un teléfono no ofrece ninguna por diseño; algunas de forma **condicional** (SE/TEE si existe y no está comprometido, revisión de la tienda, integridad del sistema) — "ese 'de forma condicional' es toda la diferencia, y cada estándar SoftPOS intenta que esa condición se pueda comprobar a distancia".

La aprobación de tipo EMVCo (Level 2) es una **batería de conformidad del kernel**: ¿envía el APDU correcto, reacciona a una palabra de estado, recorre el flujo? Su alcance: **"El protocolo terminal/host (si existe) no se prueba"** — nada entre la terminal y su adquirente entró jamás en la aprobación, ni siquiera en una terminal sellada. Y va dirigida a "los proveedores de aplicaciones EMV", no al comercio. "Un SoftPOS aprobado por EMV dice algo cierto y limitado: su kernel pasa la misma batería. No dice nada del teléfono." Y eso no es un hallazgo — ninguna aprobación lo dijo jamás. El hallazgo es un despliegue que trata esa aprobación como si cubriera la relación con el host.

**PCI DSS 9.5.1** (POI protegidos contra manipulación/sustitución; lista, inspección, capacitación): en el teléfono del comercio no hay compra que registrar (ya lo tenía, lo cambia sin avisar), la manipulación que importa es de software y no deja superficie, y quien lo opera es el dueño del negocio — "justo la parte a la que un control antifraude debe poner límites". Las notas de aplicabilidad **eximen a los COTS** (smartphones/tabletas) y rebajan la protección a buena práctica.

> PCI no eximió a los teléfonos porque sean seguros: los eximió porque el inventario, la inspección y la capacitación no pueden hacerse en un aparato que el comercio ya tenía y puede reinstalar cuando quiera. Se reconoció que el requisito no era aplicable, y la seguridad que antes aportaba tiene que venir de otro lado.

## Qué se traslada al software

El controlador NFC (radio, anticolisión) es la **única capa que no se movió** — y nunca cargó con seguridad. A partir del SELECT, todo es el Device Host = el procesador de aplicaciones, el mismo que corre el navegador. SoftPOS opera en modo **lector/escritor**; la billetera en modo emulación de tarjeta: modos distintos del mismo controlador, la literatura de uno no vale para el otro, aunque ambos acaben en el procesador de aplicaciones. La tesis de Masaryk (2014, sobre la billetera): "pérdida de seguridad, ya que no hay disponible ningún entorno de ejecución seguro" — cambia billetera por lector y tarjeta por terminal y tienes el modelo de amenazas de SoftPOS escrito en 2014.

| Capa | Terminal sellada | SoftPOS |
|---|---|---|
| Radio/anticolisión | Controlador en la carcasa certificada | Controlador de teléfono de consumo (la única que no se movió) |
| Transporte APDU | Bus inaccesible desde fuera | Driver, módulo del kernel y servicio del SO, reemplazables con root |
| Kernel contactless | Firmware certificado | Código de aplicación en un paquete instalable |
| Importe y límites | Configuración en la imagen firmada | Un archivo en el directorio de datos de la app |
| Verificación del tarjetahabiente | Teclado cableado al procesador seguro | Píxeles en la misma pantalla que todo lo demás |

## El TTQ lo escribe ahora una app

Byte 1 = descripción del hardware; byte 2 = decisión sobre esta venta (calculada instantes antes del importe); byte 3 = aceptación de CDCVM. Notas al pie del Kernel 6: bit 5 del byte 1 (chip de contacto) se pone a 0 si no hay ranura → **un SoftPOS honesto no tiene fallback al que mandar "inserte su tarjeta"** (va en el reporte); los bits 8/7 del byte 2 "se activan dinámicamente en función del resultado del preprocesamiento". Lo que un teléfono puede afirmar honestamente: b1 b5 = 0 (no hay ranura), b1 b4 = 0 (un SoftPOS cuya seguridad vive en un back end no puede funcionar solo sin conexión), b1 b3 = 0 (CPoC vs MPoC comprimido en un bit), b2 b7 = lo que calcule la app (el bit más atacado del contactless, ahora una variable local), b3 b7 = casi seguro 1 (rechazar billeteras no es opción comercial).

> No exageres: un bit que la terminal escribe sobre sí misma nunca se autenticó ante la tarjeta — la evasión de Galloway es un intermediario entre dos dispositivos certificados. SoftPOS no crea esa debilidad: **traslada la escritura del campo del firmware certificado a una app** — un valor que antes exigía un aparato de relay en la tienda ahora puede ser una opción de compilación. El bit es el mismo, el atacante es otro, el ataque cuesta mucho menos.

## Los límites viven en un archivo

Etiquetas Mastercard (públicas): **DF8123** piso (0£/0$), **DF8124** techo sin CDCVM (30£/10000$), **DF8125** techo con CDCVM (5500£/10000$), **DF8126** CVM requerido (30£/50$). Las de Visa, identificadas por los autores. Dos cosas: la distancia entre 30 y 5500 libras la marcan **dos números en un archivo**, y lo único que mueve una transacción de uno a otro es una afirmación de CDCVM; y las mismas etiquetas llevan valores distintos en países distintos — un hallazgo reproducido en una región puede no reproducirse en otra. En un teléfono: datos de app que llegan por la red que la app eligió; la integridad es lo que construyera el fabricante y nada más. **Ninguna captura de las capturas de ejemplo lleva DF8123-26**: los límites nunca cruzan la interfaz de la tarjeta — en una evaluación hay que ir a leer el archivo, no esnifar la radio.

## CDCVM, desde el otro lado del mostrador

El CDCVM es **la única verificación del tarjetahabiente que un SoftPOS puede aceptar sin resolver el problema del PIN** — casi todo el argumento comercial de Tap to Phone descansa sobre un bit que el dispositivo de aceptación no puede comprobar. Galloway y Yunusov: "¿Cómo sabe la terminal que el CDCVM proviene de un dispositivo de consumo? **No lo sabe.** Ninguna otra información enviada a la terminal permite verificar que la bandera provenga de un dispositivo de consumo, ni de ese dispositivo concreto." Evasión: TTQ b2 b7 1→0 + CTQ b2 b8 0→1 (requiere que la terminal admita CDCVM — las capturas de ejemplo le da la razón; 10/12 tarjetas Visa). Mastercard no: el CDCVM va en el AIP, dentro del criptograma.

> Recomendación que coloca el trabajo donde debe: "Los emisores deben comprobar que el CTQ byte 2 bit 8 esté en 0 para tarjetas físicas: es imposible que una tarjeta física realice CDCVM." La comprobación existe, es barata y vive en el back end del emisor — la única parte que sabe qué emitió. Es el mismo movimiento que hace SoftPOS con la integridad del dispositivo, hecho seis años antes.

La billetera afirma una capacidad que la terminal no puede verificar; el SoftPOS afirma una capacidad que el adquirente no puede verificar. A ambas se respondió igual: mover la comprobación a la parte con la base de datos. La diferencia: la afirmación de la billetera está al menos dentro de datos firmados en algunos esquemas; la del dispositivo SoftPOS va por un canal completamente aparte — **para ese canal existe la atestación**.

## PIN en pantalla, y el límite de lo que se sabe

CPoC (Contactless Payments on COTS) vs MPoC (Mobile Payments on COTS) son los programas PCI — este tema los nombra y no los cita (no los ha leído; si tu proyecto depende de una obligación de MPoC, consigue el documento). Lo que se puede decir desde la plataforma: en un teléfono los dígitos son eventos táctiles en una pantalla compartida, entregados por el mismo sistema de entrada que atiende a cualquier otra app, en un proceso que el usuario puede depurar. Tres partes ven un toque; solo una debería:

| Canal | Qué debe hacer el diseño |
|---|---|
| Servicios de accesibilidad | Detectarlos y negarse a funcionar — accesibilidad vs comerciante con discapacidad |
| Captura/grabación de pantalla | Marcar la ventana como segura — bandera aplicada por el mismo SO en el que no confías |
| Superposiciones | Negarse a recibir entradas mientras algo tape la pantalla |
| Root / bootloader desbloqueado | Nada local funciona — el caso de la atestación |

> La fila de las superposiciones cumple doble función: un teclado sobre el que un atacante puede dibujar es un teclado que puede sustituir; un **importe** sobre el que puede dibujar es un recibo por un precio y un cargo por otro. El mismo defecto, la misma solución — un despliegue que pensó en el primero y no en el segundo ha resuelto medio problema.

## Atestación: qué puede y qué no puede decir

El dispositivo genera evidencia sobre su propio estado, firmada con una llave del proveedor de la plataforma (Play Integrity, DeviceCheck/App Attest), verificada por el back end. La criptografía funciona: el back end demuestra que la atestación vino de una llave de Google/Apple, no del comercio. **Lo que no puede demostrar es la conclusión**: aceptar la transacción es política sobre cuánto vale esa evidencia, y la raíz de confianza pertenece a un proveedor que no es parte del pago.

> La atestación es una fotografía, no un video: la firma es auténtica y la afirmación era cierta cuando se hizo — nada de eso dice el estado un segundo después, que es cuando ocurre la transacción. Eleva el costo y desplaza el ataque del software al hardware; no es la misma afirmación que una carcasa que responde a la manipulación. Es un enfoque de **detección haciendo el trabajo de uno de prevención** — llámalo así en cualquier evaluación. Y pregunta qué hace el despliegue cuando la atestación falla: ¿señal de riesgo o barrera? (dos controles distintos con modos de falla distintos). El lector Square ya bloquea transacciones con las Opciones de desarrollador activadas: un lector certificado formándose una opinión sobre el teléfono de al lado.

## El teléfono del comercio ya estaba en la ruta de confianza

Tesis de Mahshid Mehr Nezhad (Warwick, 2023), capítulo 4, sobre **mPoS** (SumUp Air + lector Square, Pixel 6):

1. **Emparejamiento BLE**: el teléfono pide conexión segura con protección MITM y ofrece distribuir las llaves; el lector responde declarando "ausencia de capacidades de E/S pese a tener teclado y pantalla" y rehúsa la conexión segura → **LE Legacy → Just Works** (ambas llaves temporales en cero: sin protección contra escucha ni MITM). Ya viste esa forma dos veces: un dispositivo declara una capacidad, nada la contrasta, y el protocolo decide a partir de la declaración.
2. **Ruta de red**: HTTPS + mitmproxy (proxy manual 8080, instalar CA, parchear certificate pinning: Apktool → sustituir network security config → parchear pinning → reconstruir → uber-apk-signer; apk-mitm automatiza). El teléfono actúa de proxy entre el lector y el servidor (buen diseño: las llaves quedan en el lector), pero no todos los sobres van sellados: **leave_protected_session** (comando del propio fabricante para recuperarse de errores) + **SHOW DEFAULT MESSAGE** (base64/ASCII arbitrario) → la pantalla del lector dice "Declined" mientras el pago se autoriza. Defensa del cliente: pedir el recibo.
3. **El pitido**: lo controla `playSoundEffect` en `AudioManagers` de la app del comercio; eliminar declaraciones y llamadas → lector silencioso. "Apoyarse únicamente en un pitido audible como función de seguridad es insuficiente."

Tras eliminar el lector: las llaves BLE desaparecen (no hay enlace), la intercepción TLS es idéntica y más valiosa (**ese canal lleva la atestación y los límites**), la pantalla es peor (la misma pantalla que la app ya controla), y hay más que quitar. Mitigaciones del autor: Secure Connections, ofuscar comandos de terminal, proteger comandos con texto libre, ofuscación y antimanipulación — **controles de software sobre un dispositivo que el fabricante no posee**: la misma apuesta de SoftPOS, propuesta por quienes acababan de demostrar por qué es una apuesta. (Cita con cuidado: es mPoS, la debilidad BLE de 2018 ya estaba corregida, y nada de esto dice que un teléfono no pueda aceptar tarjetas con seguridad.)

## Una forma, cuatro veces

Un aparato declara una capacidad y nada la contrasta: el lector con teclado que declaró no tener ninguno (BLE); la tarjeta sin sensor que declaró verificar una huella (CDCVM); el teléfono con root que declara no modificado (atestación); y el lector certificado sin conexión que le hace a un protocolo de lealtad una pregunta que solo un teléfono responde y **nunca lee la respuesta** (tema de las terminales sin conexión). "Una comprobación de capacidad hace el trabajo de una comprobación de autenticación, y funciona justo hasta que alguien intenta burlarla."

## Dónde estaba la confianza, y adónde se fue

| Propiedad | Terminal certificada | Teléfono |
|---|---|---|
| Resistencia a manipulación | Física, borra llaves al abrirse | Ninguna (root si lo quiere; 9.5.1 lo reconoce) |
| Software conocido | Imagen fija certificada en conjunto | Afirmado en un instante, por el propio dispositivo |
| PIN de confianza | Teclado cableado al procesador seguro | Pantalla táctil sobre la que puede dibujar cualquier app |
| Calificadores honestos | Firmware certificado + límites en imagen firmada | Código de app + archivo de configuración en aparato del comercio |
| Quién avala | Un laboratorio, una vez, antes del despliegue | Un back end, por transacción, con evidencia que no puede confirmar de forma independiente |

> La certificación era una afirmación sobre una **clase** de dispositivo, hecha una vez, por alguien que lo tuvo abierto en su banco de pruebas. La atestación es una afirmación sobre un **dispositivo en un instante**, hecha por ese dispositivo, evaluada por un back end que nunca lo ha tocado. Una falla de certificación es sistémica y lenta; una de atestación es individual e instantánea.

**La misma idea, probada en campo** (tema de las terminales sin conexión): un teléfono no se distingue de otro hardware por inspección → el lector preguntaba a un protocolo de lealtad y nunca leía la respuesta; la seguridad se traslada al back end → la regla tap-and-PIN de Mastercard vive en un backend al que una terminal sin conexión no llega (no hace falta cambiar ningún bit); cualquiera puede comprar el hardware → 4 lectores de 2 fabricantes, 2 países, y una terminal con capacidad offline sin empresa registrada.

> Una terminal certificada no necesitaba preguntar con qué hablaba: el adquirente ya había decidido quién podía tener una. Quita eso y al dispositivo solo le queda inferir la identidad del comportamiento, y el comportamiento lo controla el atacante. Todo despliegue SoftPOS tiene alguna versión de esa pregunta — averigua cuál es la suya.

## Cómo probar uno

Pruebas de apps móviles, con la lista del especialista en pagos: ¿qué hace el back end cuando falla la atestación (rechazar o registrar)? — **provócala a propósito e intenta cobrar**; ¿de dónde salen los límites y qué los protege? (intercepta el aprovisionamiento, lee el directorio de datos de la app); ¿el importe en pantalla es el de la autorización? (dibuja una superposición o intercepta la petición); ¿funciona en un dispositivo con root y cómo lo decide? (decisión local = consejo, no control); ¿pueden observarlo un servicio de accesibilidad o un grabador de pantalla? (actívalos y observa); ¿se cifran los datos de tarjeta antes de la memoria de la app? (la respuesta honesta suele ser no).

> Casi toda esa lista son pruebas móviles corrientes: el conocimiento de pagos se gana el sueldo sabiendo qué dos bytes del GPO mirar y qué hace el archivo de límites. Un equipo solo de pagos se pierde casi todo; uno solo de apps móviles también.

## Por qué esta dirección no se revertirá

Que un puesto de mercado en Lima o Lagos acepte tarjetas con un teléfono que su dueño ya tiene amplía muchísimo quién puede cobrar electrónicamente, gratis. El rumbo está marcado; lo útil es precisar **qué garantías pasaron del hardware al monitoreo**. Y mantén el límite de tu conocimiento: cita a EMVCo (qué prueba la aprobación), a PCI DSS (qué no exige a un teléfono), al Kernel 6 (qué bits se calculan), a Galloway (un bit que nadie puede comprobar), a la tesis de Warwick (un lector que mintió sobre su teclado). No cites CPoC/MPoC si no los has leído — quien lea tu reporte irá a la afirmación que le convenga, y esa es la que tiene que estar respaldada.