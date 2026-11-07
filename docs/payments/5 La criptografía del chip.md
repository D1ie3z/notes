---
title: La criptografía del chip
sidebar_position: 5
---

Si cualquiera puede observar el intercambio, ¿qué impide anotarlo y repetirlo? Tres respuestas: la tarjeta demuestra que es auténtica, el tarjetahabiente que está presente, y la transacción que es esta transacción y no la copia de otra.

## Dónde viven las reglas

EMV = 4 libros: **Book 1** (capa física/eléctrica + selección), **Book 2** (seguridad y llaves: certificados, criptogramas, jerarquía — el de este tema), **Book 3** (aplicación: etiquetas, flujo — el que más abres), **Book 4** (tarjetahabiente/operador/adquirente).

## La forma de una transacción

Selección → GPO (devuelve **AIP** = qué puede hacer la tarjeta y **AFL** = dónde están los datos) → READ RECORD → **autenticar** → verificar tarjetahabiente → GENERATE AC.

> El orden no es casual: la autenticación va después de leer los registros porque su firma los cubre; la CVM va antes del criptograma porque su resultado es una entrada para él. Un ataque es llevar algo al otro lado de una de esas fronteras.

**No existe un comando "AUTENTICAR"**: SDA no pide nada (todo llegó en los registros), CDA activa un bit en GENERATE AC, solo DDA tiene comando propio (INTERNAL AUTHENTICATE). En una traza, la autenticación offline es sobre todo ausencia de tráfico.

## SDA, DDA, CDA

| Método | Qué demuestra |
|---|---|
| SDA | El emisor firmó los datos estáticos. Nada sobre la tarjeta: copia los datos a otra tarjeta y SDA los sigue dando por buenos |
| DDA | La tarjeta posee una llave privada y firma un reto. Suficiente contra copia directa; no dice nada de la transacción |
| CDA | La tarjeta firma los datos de la transacción **junto con el criptograma**, en una sola firma. La más resistente al relay |

SDA existe porque el chip no puede hacer RSA ("no es capaz de realizar operaciones RSA" — Murdoch, Drimer, Anderson, Bond). El emisor firma una vez en la personalización y la tarjeta lleva el resultado.

> Casi toda debilidad duradera en pagos tiene la misma forma: una respuesta razonable a una restricción que ya desapareció. Chips baratos sin coprocesador eran serios en 1996; las tarjetas emitidas bajo esa restricción siguen funcionando y las terminales siguen aceptándolas.

**AIP (tag 82)** leído como bits (Mastercard `1980` = 0x19): b7 SDA, b6 DDA, b5 CVM, b4 riesgo terminal, b3 autenticación emisor, b1 CDA. Ojo: la tarjeta Visa de prueba responde GPO en **formato 1** (tag 80 sin estructura: 2 primeros bytes = AIP, resto = AFL) — mismo campo, mismas asignaciones, sin etiqueta a la vista.

**La escalera (§10.3 Book 3):** ¿CDA en ambos? → CDA. ¿DDA en ambos? → DDA. ¿SDA en ambos? → SDA. Si no → ninguno → **TVR byte 1 bit 8**. La terminal no puede insistir: una terminal que admite las tres ejecuta SDA con una tarjeta que solo admite SDA.

> Bits distintos para falla y ausencia: "SDA falló", "DDA falló", "CDA falló" y "no se realizó autenticación" son 4 banderas separadas en el byte 1 del TVR. El registro de la terminal distingue una comprobación que dijo que no de una que nunca se ejecutó.

**El AFL es una segunda opinión sobre el AIP**: el 4º byte de cada entrada = cuántos registros ofrece la tarjeta para la firma. Suma esos bytes en todo las capturas de ejemplo: las 2 tarjetas con cadena de certificados designan exactamente 1 registro; las que no llevan certificados, ninguno. Que discrepen = algo que reportar.

## La cadena de certificados

```
Raíz del esquema (en la terminal, índice 8F) → Cert. emisor (90) → Cert. ICC (9F46) → firma
```

Solo el primer eslabón viene preinstalado. La terminal guarda **6 llaves raíz por RID** (§11.2.2 Book 2); una llave se identifica por RID (5 bytes, del AID) + índice (1 byte, lo aporta la tarjeta, tag 8F). Ninguna mitad es secreta y ninguna basta sola.

> El AID importa más allá del enrutamiento: selecciona un ancla de confianza. El índice 06 no significa nada sin su RID. Dos esquemas, dos espacios de llaves sin relación.

**Tabla 12 del Book 2** (longitudes en función de los temas RSA):

| Tag | Objeto | Longitud |
|---|---|---|
| 8F | Índice de llave raíz | 1 |
| 90 | Cert. llave pública del emisor | NCA (módulo raíz) |
| 92 | Resto llave emisor (si existe) | NI − NCA + 36 |
| 9F32 | Exponente llave emisor | 1 o 3 |
| 9F46 | Cert. llave pública ICC | NI (módulo emisor) |
| 9F48 | Resto llave ICC (si existe) | NIC − NI + 42 |
| 9F47 | Exponente llave ICC | 1 o 3 |

**Regla de oro**: si el cert de la ICC no mide lo mismo que el módulo de la llave que lo firmó, la autenticación falló. Una firma mide lo que su llave (Anexo B2.1). En las capturas de ejemplo: cert emisor 248 bytes → raíz de **1984 bits**; cert ICC 176 → emisor de **1408 bits**; exponente 03.

> Puedes leer los tamaños de llave de un esquema en un volcado hexadecimal sin descifrar nada. En cualquier protocolo con RSA crudo, la longitud de la firma es la longitud de la llave. 1408 bits en 2026 no da tranquilidad, y persiste porque cambiar una raíz toca todas las terminales.

**Los 7 pasos de la tarjeta Visa de prueba** (única con cadena completa): 90 = 176 → NCA 1408 bits; campo llave emisor NCA−36 = 140; 92 presente = 36 → NI = 176; 9F46 = 176 ✓ (coherente); campo llave ICC NI−42 = 134; INTERNAL AUTH devuelve 128 → NIC = **1024 bits**; 134−128 = 6 bytes de `BB` → no hace falta 9F48.

## De dónde salen el 36 y el 42

EMV usa **ISO/IEC 9796-2 con recuperación de mensaje**: la firma ES el mensaje cifrado. Bloque recuperado = `6A` (1) + mensaje (N−22) + SHA-1 (20) + `BC` (1) → 22 bytes de sobrecarga.

- Cert emisor: 14 bytes fijos (formato, id emisor 4, vencimiento 2, serie 3, alg/long 4) → campo llave = NCA − 22 − 14 = **NCA − 36**
- Cert ICC: 20 bytes fijos (PAN de aplicación 10 en vez de id 4) → **NI − 42**
- Firma estática: 4 fijos → NI − 26, **todo relleno** (los datos que autentica entran en el hash, no viajan en la firma)
- Firma dinámica: 3 fijos + datos → NIC − LDD − 25

> La firma estática no lleva carga útil: todo su espacio recuperable es relleno. Un certificado EMV cubre muchos más datos de los que le caben — los datos entran al hash, no al bloque.

## Qué dice un certificado cuando lo abres

No es X.509: es un bloque de formato fijo (Tabla 13/14 Book 2): `6A`, formato (02 emisor / 04 ICC), identidad (id emisor 4 / **PAN de aplicación 10**), vencimiento MMYY, serie 3, algoritmos/longitudes 4, llave, SHA-1 (20), `BC`.

Comprobaciones: id emisor vs primeros 3-8 dígitos del PAN (comparación de **prefijo** — impide prestar un certificado a otra tarjeta), vencimiento (el reloj de la terminal), y **lista de revocación** (§6.1.2, indexada por RID/índice/serie — mínimo 30 entradas por RID con desalojo manual).

> El cert de la ICC **contiene el número de tarjeta** y las llaves raíz están publicadas: cualquiera puede recuperarlo. Por eso el sanitizador aleatoriza la 9F46: tratar los certificados como "texto cifrado ilegible" habría publicado el PAN original en forma de ruido. Guardar lo cifrado no es seguro cuando la llave es pública.

Dos tablas para el mismo objeto: la **Tabla 11** (lo que firma el emisor) incluye los datos estáticos autenticados (los registros del AFL); la **Tabla 14** (lo que recupera la terminal) no tiene espacio para ellos. El certificado los cubre sin llevar un byte: la terminal hashea los registros + campos recuperados y lo compara con el hash interno.

> Una tarjeta DDA/CDA obtiene gratis la autenticación de datos estáticos. Por eso ningún registro corrupto aparece como "los registros están mal" sino como "no se pudo recuperar la llave de la tarjeta". Y por eso ninguna captura de las capturas de ejemplo lleva tag 93: no es omisión, es lo esperable.

**9F4A (Static Data Authentication Tag List)**: solo puede contener `82` (el AIP). La tarjeta pide que su propia afirmación de capacidades quede firmada — sin ella, un atacante apagaría los bits del método fuerte y la terminal se replegaría (el tema de la clonación y la degradación hace eso con el service code de la banda; aquí alguien se dio cuenta y lo arregló).

**Hash de registros (§10.3)**: SFI 1-10 → entra todo salvo etiqueta 70, longitud y SW; SFI 11-30 → entra todo (etiqueta y longitud incluidas). Dos implementaciones que discrepen en eso producen dos hashes distintos y un error de 20 bytes al final. Detalle invisible en prosa, letal en código.

## La firma dinámica

**DDA** = INTERNAL AUTHENTICATE. El DDOL **debe** incluir el número impredecible, o DDA falla antes de empezar. Bloque recuperado (Tabla 17): `6A 05`, alg hash, LDD, datos dinámicos, relleno, SHA-1, `BC`. Lo que la terminal envió como reto **no viaja dentro**: los datos del DDOL entran al hash. Primera comprobación: la firma debe medir lo mismo que el tema (128 bytes en las capturas de ejemplo = 1024 bits).

**CDA** = bit en GENERATE AC; la tarjeta responde con firma en lugar del criptograma a secas. Datos dinámicos de la ICC (Tabla 19): nonce de tarjeta (2-8), CID (1), **el criptograma (8)** y **hash de toda la transacción (20)** = 32-38 bytes. El hash (§6.6.1) cubre los valores del PDOL/CDOL1 + tags de la propia respuesta de la tarjeta; la firma queda excluida (no puede hashear algo que está produciendo).

> El hash de 20 bytes es todo el argumento de CDA: importe, moneda, fecha, TVR y la respuesta de la tarjeta, dentro de una firma que la terminal verifica sin red. CDA mete lo único que solo el emisor podía comprobar (el criptograma) dentro de lo único que la terminal sí comprueba (la firma).

Ojo: **en un rechazo no hay firma CDA** (§6.6): la terminal debe pedir sin firma y la tarjeta no produce ninguna. La autenticación más fuerte queda apagada justo para las transacciones rechazadas. Quien convierta una aprobación en rechazo también apaga la firma.

## Lo que nada de esto demuestra

"Chip and PIN is Broken" (Murdoch et al., 2010): pasar de SDA a DDA no cambia su ataque — la autenticación de la tarjeta ocurre **antes** de la verificación del tarjetahabiente, y su ataque no interfiere con la entrada ni la salida de la autenticación.

| Demuestra | No demuestra |
|---|---|
| Los registros vienen de este emisor (SDA) | Que esta tarjeta sea la emitida (DDA) |
| La tarjeta posee la llave privada (DDA) | Que firme esta transacción y no otra (CDA) |
| Importe y criptograma van juntos (CDA) | Que se haya verificado al tarjetahabiente (tema de la verificación del tarjetahabiente) |
| El criptograma solo lo producen tarjeta y emisor | Que sea válido: solo el emisor lo comprueba, y una terminal offline nunca pregunta |

**Break, Fix, Verify** (Basin, Sasse, Toro-Pozo, 2021 — EMV modelado en Tamarin): de 19 configuraciones, **todas las SDA y DDA incumplen "el banco acepta"** (el banco discrepa de la tarjeta sobre el último criptograma); todas las CDA la cumplen — pero 4 de 7 modelos CDA siguen fallando por el **CVM**: la terminal y la tarjeta discrepan sobre qué verificación se usó. La autenticación de tarjeta más fuerte sigue callando sobre el PIN.

## Por qué se omite (la práctica real)

1. **Sin llave raíz** (§6.2): si la terminal no tiene la llave para ese RID+índice, la autenticación "ha fallado" y ya. Único punto de falla, y es el único eslabón que no viaja con la tarjeta.
2. **No se toman la molestia**: el paper del pre-play encontró en registros reales que los TVR declaraban la firma estática sin verificar. Razones: tiempo de cómputo en cajeros modestos + costo de mantener raíces. "Las falsificadas se detectarían en línea de todos modos."
3. **CDA se desactiva**: autentica más datos → más cosas pueden estar mal → falla en transacciones correctas pero inusuales → los adquirentes lo apagan.
4. **Anexo D1**: un certificado debe caber en un registro (254 bytes) y una firma en una respuesta (256). Techos: llave emisor 247 bytes (1976 bits); ICC sin datos de app 240 (1920); ICC con máx de datos de app del emisor **205 (1640)**.

> 32 bytes de datos propietarios del emisor cuestan 35 bytes de llave: un campo que nada tiene que ver con la criptografía fija un parámetro criptográfico, porque comparten un presupuesto de 256 bytes. En protocolos con restricciones, los parámetros de seguridad los decide quien compite por los mismos bytes.

## Verificación del tarjetahabiente (adelanto)

La tarjeta publica su lista CVM (tag 8E): montos + reglas de 2 bytes (método, condición), en orden de preferencia. Ejemplo: `42 03` (PIN cifrado online, bit 0x40 = si falla continúa), `1E 03` (firma), `1F 03` (no se requiere CVM — el último recurso, y al que un atacante quiere que llegue la terminal). Recorrido: ¿método admitido? ¿condición se cumple? → ejecutar; falla con bit de continuar → siguiente regla.

## El criptograma y las costuras

El criptograma es un **MAC** sobre los datos de la transacción con una llave derivada que solo comparten tarjeta y emisor. Un observador puede leer cada byte y no puede producir un criptograma válido: no tiene la llave. El **ATC** (contador de transacciones) entra en el criptograma: una tarjeta real no produce el mismo criptograma dos veces. La repetición se neutraliza haciendo que la respuesta de ayer ya no sirva hoy.

| | Firma dinámica | Criptograma |
|---|---|---|
| Tipo | RSA (asimétrica) | MAC (simétrico) |
| Llave | Solo la tarjeta; pública en certificado | Tarjeta y emisor (derivada de maestra) |
| Quién verifica | Cualquier terminal con la raíz, sin red | El emisor, y nadie más |
| Protege contra | Tarjeta falsificada vs terminal offline | Transacción fabricada que llega al emisor |
| Inútil cuando | La terminal se la salta / no tiene raíz | Nadie se conecta en línea |

**Comprobaciones reales de la terminal**: existe llave raíz para RID+índice; cada cert mide lo de la llave superior; cada bloque empieza en 6A y acaba en BC; cada hash coincide con el recalculado; id emisor y PAN concuerdan; ningún cert vencido. Cada una es un punto donde una implementación puede no tomarse la molestia, sin que nadie lo note.

> SDA cubre los datos y no la tarjeta, DDA la tarjeta y no la transacción, la lista CVM describe una preferencia y no un requisito. El criptograma no se puede falsificar, pero solo el emisor lo verifica, y una terminal sin conexión nunca pregunta. El trabajo está en las costuras entre mecanismos.