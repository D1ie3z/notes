---
title: Límites del toque y cómo se esquivan
sidebar_position: 15
---

Un toque por debajo del límite no le pide nada al tarjetahabiente. Detrás hay **tres límites en el lector** (fijados por partes distintas) y **un cuarto contador en el emisor**. No hay un solo número al que llamar "el límite contactless".

> Los tres límites son política del lado de la terminal, evaluada contra valores que aportan la terminal y la tarjeta. La mitad interesante no es el umbral: es **en quién se confía para decir cuál fue el importe y en quién para decir que se verificó a un tarjetahabiente**. Cambia cualquiera de las dos respuestas y el umbral deja de importar.

## Tres límites (Galloway y Yunusov)

| Límite | Qué hace | Dónde se escribe |
|---|---|---|
| **Reader Contactless Floor Limit** (piso) | Por encima: "la terminal enviará la transacción en línea" (K6 D.9) | TTQ byte 2 bit 8 (criptograma online requerido) + TVR b4 b8 en K5 |
| **Reader CVM Required Limit** | A partir de él: "la terminal pedirá a la tarjeta que realice la verificación del tarjetahabiente" (K6 D.8) | TTQ byte 2 bit 7 (CVM requerido); K5 lo escribe en el Terminal Interchange Profile |
| **Reader Contactless Transaction Limit** (techo) | A partir de él: "la terminal no procesará la transacción e indicará el contacto" (K6 D.10) | En ninguna parte: K5 termina antes de pedir nada |

El piso y el CVM **no rechazan nada**: cambian lo que pide el lector. El techo es un **muro**. K5 orden: límite contactless → CVM → piso. Van den Breekel cuenta 5: el de transacción se desdobla en "sin CVM en dispositivo" y "con CVM en dispositivo" — **un bit decide cuál de los dos techos aplica**.

> Ojo con 9F53: en el K5 es el Terminal Interchange Profile (lo escribe la terminal); en el K6 son los Contactless Card Verification Results (los aporta la tarjeta). Comprueba el kernel antes de nombrar una etiqueta.

## La comparación incluye el umbral (y un libro dice otra cosa)

Book 3 §10.6.1, K5 y Visa: "mayor **o igual**". K6 D.9 (piso): "mayor que" (exclusivo); D.8/D.10: "mayor o igual". Discrepancia sin resolver — en un plan de pruebas un límite exige **tres transacciones**: una unidad menor, exactamente en él, y una por encima. "El límite es £30" sin decir qué pasó con £30.00 exactas dejó fuera el único caso interesante. Los .01 al final (Visa UK: 0.01/30.01/5500.01; MC: 0/30/5500) son la forma de esquivar la ambigüedad.

## Nadie les asignó una etiqueta

Anexo C del K6: el TTQ es 9F66 obligatorio; los tres límites contactless son **"Proprietary"** (dos de ellos ni siquiera obligatorios). 9F1B es el límite de piso de contacto (tema de la gestión de riesgo en terminal). Los valores de Visa los dedujeron los autores: DF04 (piso), DF05 (sin CDCVM), DF03 (con CDCVM): UK £0.01/£30.01/£5500.01; US $0/$50.01/$10000.01 — **reportados el 4 dic 2019; desactualizados desde entonces**. Cita cualquier límite con esquema + país + fecha.

> Muro en un país, puerta en otro: UK el techo y el CVM coinciden en £30 → cruzar termina el toque (6984, "fin de aplicación por configuración de parámetros" → "inserte, deslice o pruebe otra tarjeta"). US: techo muy por encima del CVM → cruzar solo cambia lo que pide el lector. Ninguno es más seguro: son respuestas distintas a quién absorbe la fricción. Ambigüedad: "límite de la tarjeta Visa… especificado en el archivo de configuración de la terminal" vs nota al pie del límite de país de la tarjeta — una sola traza no separa ambas; cambia un lado a la vez.

## Dónde queda escrita la decisión

En Visa el criptograma vuelve en la respuesta al GPO: la decisión de límites tiene que ir en el comando que lo pide. Cabe en un byte: **TTQ byte 2** ("Reader CVM Requirements", bits dinámicos del preprocesamiento). Las capturas de práctica: `32 80 40 00` — byte 2 = 80: criptograma online requerido, CVM no requerido. Ojo: 0x80 es compatible con piso superado **o** con piso en cero; el TVR del GPO siempre va en ceros. `C0` = ambos bits (no está en las capturas de ejemplo).

## Dos bits, y un límite que deja de aplicar

La evasión (Galloway & Yunusov, "First Contact", Black Hat Europe 2019):

| Cambio | Dirección | Campo |
|---|---|---|
| Dejar de pedir CVM | Terminal → tarjeta | TTQ byte 2 bit 7: 1 → 0 |
| Afirmar que ya ocurrió | Tarjeta → terminal | CTQ byte 2 bit 8 (CDCVM realizado): 0 → 1 |

Proxy NFC entre tarjeta y terminal reales. El criptograma es auténtico (ninguno de los bytes alterados entra en él). La terminal mide el importe contra el **techo de dispositivo de consumo** (el bit elige un límite en vez de burlarlo). Pagos demostrados: £31 (sobre el límite de 30) y £100, sin CVM. **10 de 12 tarjetas Visa funcionaron** (2 de banca tradicional británica resistieron, mecanismo desconocido — no inferir). Contra Google Pay solo hace falta el cambio en el TTQ: el CTQ de CDCVM **siempre vale 1** en un dispositivo.

> Una bandera que siempre vale 1 no transporta información: la terminal no sabe si se comprobó un rostro o se encendió una pantalla. Además, el CDCVM "se completa antes de que empiece la interacción" — antes de que nadie sepa el importe. La verificación que desbloquea el techo alto ocurrió cuando nadie sabía cuánto se iba a gastar.

**Por qué Mastercard no estaba en la lista**: el CDCVM viaja en el **AIP (tag 82), cubierto por el criptograma**; en Visa viaja en el **CTQ (9F6C), sin cubrir** (ni CTQ ni TTQ entran en ninguna versión de criptograma). Recomendaciones: Visa debe meter CTQ y TTQ en el criptograma; los emisores deben comprobar que el CTQ b2 b8 = 0 en tarjetas físicas — "es imposible que una tarjeta física realice CDCVM".

> Los arreglos baratos en pagos son comparaciones que nadie está haciendo: la afirmación de CDCVM y el factor de forma llegan en el mismo mensaje.

**Un kernel que sí los compara**: el K5 (JCB) desde feb 2016 — **Cardholder Verification Status (9F50)**, autenticado por CDA, en la respuesta al GENERATE AC: si el TIP dice "CVM requerido por el lector" y el CVS dice que no hubo CVM, el kernel **debe rechazar**. Valores: 00 sin CVM, 10 firma, 20 PIN online, 3x código de confirmación. La comprobación es expresable y barata: "el protocolo no lo permite" no vale.

**Los contadores que la tarjeta lleva**: K6 publica el interior de su IAD — **CL-CVR (9F53)**, 8 bytes: byte 5 = contactless consecutivas (b8), **acumuladas (b7)**, importe único, contadores offline; byte 3 = CVM requerido + 6 límites; byte 7 = eco del TTQ para el emisor. Contadores del lado de la tarjeta documentados desde 2016; lo que varía es qué esquema los adoptó y si alguien lee el resultado.

## Antes de la regla, estaba la responsabilidad

Antes de PSD2 no había límites obligatorios del lado del emisor: los fijaban adquirentes y comercios, y eran opcionales (UK £30 hasta abr 2020, £45 después). Casi nadie subía mucho: **el tarjetahabiente no es responsable del fraude contactless — lo es el comercio o el adquirente**. El límite era un control de responsabilidad, y funcionaba porque quien lo elegía era quien pagaba.

> Casi toda la seguridad en pagos es asignación de responsabilidad con una superficie técnica. Cuando no entiendas por qué un control está donde está, pregunta quién paga cuando falla.

El fraude que siguió: **dividir por el límite**. £135 de mercancía = 3 pagos de £45, ninguno pide PIN. La respuesta es el **límite acumulado**: 5 transacciones consecutivas o un total acumulado (£150 antes de abr 2020, £225 después) → la terminal pide insertar.

| Control | Lo mantiene | Se reinicia con |
|---|---|---|
| Límite por transacción | La terminal (config del adquirente) | Nada: aplica a cada toque |
| **Límite acumulado** | **El emisor, como contador** | Una transacción que el emisor **cree verificada** |
| Contador en la tarjeta | La tarjeta (1 de los 5 bancos probados) | Una transacción por contacto |

## Tres verificaciones, y el hueco entre ellas

El emisor verifica la solicitud tres veces, cada una sólida por separado; el ataque aprovecha que **los resultados no se contrastan**:

1. **HSM**: importe y moneda intactos (alterarlos rompe el criptograma).
2. **Riesgo**: lee TVR, IAD y resultados CVM.
3. **Contador**: ¿chip y PIN? → reiniciar a cero.

> El **IAD (9F10)** lo escribe la tarjeta, viaja dentro del criptograma y no puede modificarse en tránsito. Cuando una terminal afirma que se verificó un PIN y la tarjeta sabe que no, **ambas declaraciones llegan al emisor en el mismo mensaje**. La evidencia ya está en la solicitud.

**El PIN-OK**: cambiar `63C2` (falló, quedan 2) por `9000`. La palabra de estado es toda la respuesta y nada la firma. Conocido desde 2010 (Cambridge); el crimen organizado francés lo usó por +€500k. Requisito previo: falsificar la lista CVM para que el PIN offline sea el método preferido (tema de la verificación del tarjetahabiente, ofensivo). Invisible para DDA, visible para CDA → encontrar una terminal sin CDA o degradarla.

**Lo que la tarjeta anota**: "Offline PIN Verification Not Performed" + "Terminal Erroneously Considers Offline PIN OK" (Visa: bits 2-3 del byte 2). Funcionó igual en 3 de 5 bancos: la etapa de riesgo no actuó sobre la bandera y la del contador confió en la terminal.

> La falla no es criptográfica: la evidencia llega y nadie la lee. Mucho más común y mucho más difícil de encontrar probando criptografía.

**Dos esquemas, dos superficies**: Mastercard requería la terminal propia con CDA deshabilitado; Visa bastaba con cualquier terminal no atendida (parquímetro, comida rápida) porque las tarjetas solo usaban DDA en contacto. Variantes: mismas llaves y versiones de criptograma en contacto y contactless → datos NFC repetibles por chip y al revés; firma como primer CVM (comprobación = un vistazo a un garabato).

> Un banco se defendió correctamente (declaró PIN en línea → exige bloque de PIN → HSM) y un defecto del software de autorización lo aprobó igual y reinició el contador. Un control correcto en la spec e inalcanzable en la implementación no protege a nadie. El banco con el contador en la tarjeta: mejora real, y aun así cayó — acercar el control al activo eleva el costo sin cambiar la forma.

## Terminales sin conexión

Square/SumUp pusieron terminales EMV certificadas en manos de cualquiera, y algunas aceptan un pago **sin red**. Rompen el límite acumulado de 4 formas (tema de las terminales sin conexión). Mastercard no necesita cambiar ningún bit: su regla tap-and-PIN se aplica en el **backend**, al que una terminal sin conexión no llega, y la terminal no comprueba el CVR del IAD. **El mismo campo de antes: la tarjeta anotó lo ocurrido, dentro de la firma, y nadie lo leyó.**

## Las correcciones (baratas)

- Verificar en el **HSM** los bits de PIN offline del IAD y rechazar si no concuerdan → toda la familia PIN-OK.
- Reiniciar el contador solo con un PIN realmente verificado (offline por la tarjeta o online por el HSM).
- Llaves y versiones de criptograma **distintas** para contacto y contactless.
- Monitorear intentos/fallas de CDA/DDA en TVR e IAD (señal débil por separado, decisiva en conjunto — no bloquear por una sola falla: las terminales se averían).

## Cuatro límites, cuatro dueños

Lector (3 límites sin etiqueta) + tarjeta (su límite de país) + emisor (el contador) + 9F1B (quinto, de contacto). El contacto tiene el **registro opcional de transacciones en la terminal** contra ventas fraccionadas; **el contactless no tiene memoria**: cada toque se compara por separado contra un umbral.

> El límite acumulado existe por esa ausencia: si cada toque se mide solo, dividir burla el límite, y el único sitio que ve más de un toque es la tarjeta o el emisor. Un lector con registro obligatorio tendría que llevarlo rápido — se supone que un toque dura menos de medio segundo. Concesión de diseño, no descuido.

## Qué probar (en un emisor)

¿Cuáles son los 4 valores de límite y de dónde los leíste? (no tienen etiqueta: alguien tiene que abrir la config) · ¿qué ocurre exactamente en el límite? · ¿el TTQ admite CDCVM y hace falta? · ¿son de verdad distintos los dos límites de transacción y por cuánto? (la distancia es lo que vale una afirmación falsificada de CDCVM) · ¿qué reinicia el contador acumulado? (un evento concreto y verificado) · ¿se evalúan los bits de PIN offline del IAD, y dónde? (en el HSM, en el mismo paso que el criptograma) · ¿comparten llaves contacto y contactless? · ¿los resultados CVM pueden decir "PIN en línea" sin bloque de PIN adjunto? (el defecto que le costó el contador a un banco).

> El campo que habría detenido estos ataques (el IAD) es propietario, no está documentado y varía por esquema y versión de criptograma. El secreto sobre un formato no es un control, pero encarece implementar el control — y esto es lo que eso cuesta. El K6 demuestra que el campo **puede** documentarse.