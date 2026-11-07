---
title: Pagos al instante y QR
sidebar_position: 11
---

Pix (Brasil), UPI (India), CoDi (México): dinero entre cuentas bancarias en segundos, sin tarjeta, sin red de esquema y sin contracargo. El fraude se mudó con ellos.

## Qué cambia cuando desaparece la tarjeta

| Rieles de tarjeta | Pagos instantáneos |
|---|---|
| Autorizar ahora, liquidar después (días) | Liquidación inmediata y definitiva |
| El contracargo revierte la transacción | Nada se revierte; la devolución es aparte y solo recupera lo que quede |
| Un número de tarjeta es la credencial | La credencial es un alias: teléfono, correo, ID, QR |
| La tarjeta firma la transacción | Nada en el QR está firmado; la autenticación del pagador es la única firma |
| Fraude = robo de credenciales | Fraude = una persona que autoriza un pago que no debería |

> En los rieles de tarjeta, el atacante debe producir una transacción que el emisor acepte (problema técnico). En los instantáneos, el pagador autoriza con sus propias credenciales en su propio teléfono: no hay nada que falsificar. El ataque va contra la persona, y cada control técnico lo deja pasar, como debe.

## El payload del QR es TLV en caracteres imprimibles

EMVCo Merchant-Presented Mode v1.1: ID de 2 dígitos, longitud de 2 dígitos (01-99), valor (1-99 caracteres). Árbol: primitivos + plantillas. Solo dos posiciones fijas: **ID 00 primero** (Payload Format Indicator, valor 01) y **ID 63 último** (CRC).

> El ID no es único: depende del contexto. El ID 01 bajo la raíz = Point of Initiation Method; el ID 01 dentro de la plantilla 62 = número de factura. Un parser que aplana el árbol en un diccionario reporta en silencio un marcador donde había una factura. Probar esto es lo primero con cualquier implementación.

**Raíz** (M = obligatorio, C = condicional, O = opcional): 00 PFI (M), 01 POI (O), **02-51 Merchant Account Information (M, al menos uno)**, 52 Merchant Category Code (M), 53 moneda (M), 54 importe (C), 55-57 propinas, 58 país (M), 59 nombre del comercio (M), 60 ciudad (M), 61 código postal (O), 62 plantilla de datos adicionales (O), 64 idioma alterno (O), 65-79 reservados, 80-99 plantillas libres, 63 CRC (M, último).

El código mínimo válido lleva 8 cosas y **el importe no es obligatorio**.

## Estático y dinámico

El POI (ID 01) vale 11 (mismo código, varias transacciones) o 12 (código nuevo por transacción). Pero es una descripción, no un mecanismo, y es opcional. **Lo que cambia la experiencia es el ID 54**, escrito al revés: "no debe incluirse si la app debe pedir al consumidor el importe". Un código con `010212` y sin 54 es "dinámico" que aun así hace teclear el importe.

> Patrón recurrente: un campo que declara una intención junto a un campo que produce el comportamiento, sin nada que los vincule. Contrasta la declaración con el comportamiento en vez de leerlos por separado.

## Recorrer un payload

```
000201 010211 2633 0013mx.ejemplo.qr 0112DEMO00000001 52045814 5303484 5802MX 5915CAFE DE EJEMPLO 6009MONTERREY 630488EA
00 02 01            → formato v1
01 02 11            → estático
26 33 …             → plantilla Merchant Account Info: 00 = GUID (dominio invertido), 01 = beneficiario
52 04 5814          → MCC
53 03 484           → MXN
58 02 MX · 59 15 "CAFE DE EJEMPLO" · 60 09 MONTERREY
63 04 88EA          → CRC
```

El nombre del comercio es el único campo que el pagador leerá realmente antes de aprobar — y la spec dice que la app "puede mostrar ese nombre": **puede, no debe**.

IDs 02-25 = plantillas reservadas a esquemas de tarjeta (02-03 Visa, 04-05 MC, 09-10 Discover, 11-12 Amex, 13-14 JCB, 15-16 UnionPay). **26-51 = plantillas genéricas** que deben empezar con un Globally Unique Identifier (ID 00): AID, UUID sin guiones, o dominio invertido.

> "El valor del GUID fija el contexto para el resto de la plantilla… el significado de los demás objetos queda fuera del alcance de EMVCo." EMVCo estandariza **el sobre**, no el contenido: cuenta del beneficiario, referencias y autenticaciones viven dentro de una plantilla que EMVCo se niega a definir. "Sigue el estándar de EMVCo" te dice la forma del envoltorio y nada de la seguridad de lo que va dentro.

## El CRC y la calcomanía

CRC = ISO/IEC 13239, polinomio 1021, init FFFF, cubre todos los objetos **incluidos "63" y "04"** pero no el valor. Detección de corrupción accidental; el algoritmo es público y cualquiera lo recalcula. No hay llave.

**Ataque de la calcomanía**: cambia 12 caracteres del beneficiario (`DEMO`→`MULA`), recalcula el CRC (microsegundos, sin secreto), imprime, pega. Los dos códigos son válidos; el atacante copia nombre/ciudad/moneda para que la pantalla se vea correcta. **El único campo que difiere es el que el pagador nunca ve.**

> Todas las contramedidas desplazan el problema: dinámico → la falsifica quien ponga una pantalla; mostrar el nombre → el atacante lo copia (gratis); vincular a identidad registrada → traslada el problema al alta. Ninguna hace auténtico el payload: lo hacen más difícil de colocar.

| Riel | Objeto confiable | Comprobación |
|---|---|---|
| Tarjeta | Llave privada | Firma importe+nonce+contador; el emisor verifica |
| QR | No hay llave | Checksum que cualquiera recalcula; una persona lee un nombre |

## Quién inicia, quién controla el importe

- **Merchant-presented**: el comercio muestra el QR, el pagador escanea. El comercio nunca toca el dispositivo; el banco del pagador solo ve un ID de cuenta que salió del código. Las dos comprobaciones (leer el nombre, autenticarse ante su banco) **no dicen nada de si el código era del comercio**.
- **Consumer-presented**: el teléfono muestra el código, la terminal lo lee. El código es un **valor al portador en una pantalla**: vida corta obligatoria (pueden fotografiarlo). El importe lo aporta el comercio — la posición que un comercio hostil quiere estar.

> Pregunta clave: ¿quién controla el importe y quién se lo repite a la otra parte? El estándar QR admite las tres disposiciones sin preferir ninguna.

## CoDi y una asimetría que copiar

CoDi es un esquema **request to pay**: el vendedor envía mensaje de cobro (QR, NFC o internet); el pagador acepta, rechaza o pospone; el pagador instruye la transferencia a su banco (SPEI). Beneficio declarado: "se evitan los contracargos" — la aceptación explícita elimina la exposición del comercio **y, en el mismo acto, le quita su recurso al pagador defraudado**. El fraude de este tema se concentra en la segunda lectura.

La asimetría: **los terceros solo pueden construir software de cobro**; la funcionalidad de pago es exclusiva de los participantes del SPEI.

> La frontera está donde una petición se convierte en una autorización. El lado que compone una instrucción está abierto (una petición mala se rechaza); el lado que autentica a una persona y saca dinero queda restringido a instituciones reguladas (una app de pago mala es una pérdida sin límite). En cualquier ecosistema abierto, encuentra esa frontera primero.

## Qué hace realmente un riel en tiempo real

SPEI: híbrido de liquidación bruta en tiempo real + compensación neta diferida. Ciclos **cada 3 segundos o cada 300 pagos** — "tiempo real" es un lote corto. 24x7 (el fraude opera a las 3 AM). Saldos siempre ≥ 0 (sin sobregiros: no hay riesgo de crédito que buscar). Prioridad: saldos reservados vs no reservados. Activo: dinero del banco central. Membresía: instituciones reguladas — "el perímetro es una autorización, no un control técnico". Identidad: certificados digitales **entre instituciones**; el aviso de liquidación lo firma el banco central.

> Nada en ese mecanismo autentica a la persona que inició el pago, ni comprueba que la cuenta tecleada sea la que quería. El riel es criptográficamente sólido y el fraude ocurre por encima de él.

## La firmeza la define un mensaje, no un reloj

- **México** (Ley de Sistemas de Pagos): la orden es aceptada cuando el SPEI la liquida **y** envía el aviso a emisor y receptor. Aceptada = firme e irrevocable.
- **FedNow** (OC 8 §7.1): firme cuando se registran los cargos/abonos **o** cuando se envía el Advice of Credit — "con independencia de cuándo se reflejen los asientos… y de si el participante puede verlos".

> Definir firmeza por mensaje la convierte en un hecho que el sistema produce, observable por ambas partes y reproducible desde la bitácora. La Fed la desliga de lo que el participante puede ver: una pantalla lenta no es una defensa legal. Pregunta a cualquier diseño de liquidación qué evento hace firme un pago y si ambas partes pueden señalar el mismo.

## Firme no es lo mismo que irrecuperable

**MED (Mecanismo Especial de Devolução, Brasil)**: el participante **debita unilateralmente** la cuenta de su propio cliente sin autorización por transacción, bajo procedimiento con relojes. Nadie revierte: se saca lo que siga ahí. Relojes: caso se abre con ≤80 días (30 si se impugna una devolución); receptores analizan 7 días; institución pagadora concluye en 72 h; cada receptor ejecuta en 6 h secuenciales; **bloqueo cautelar hasta 72 h** (se puede poner en minutos, antes de decidir nada); devolución voluntaria dentro de 90 días. El directorio emite notificaciones de infracción automáticamente aguas abajo — persigue la cadena de mulas. Además: marca de fraude (con dueño, cancelable) y disputa de la disputa.

> Suma los relojes: la única variable que controlaban era el tiempo hasta el congelamiento. Todo lo demás depende de un dinero que una mula está intentando mover.

## Los alias son el directorio

Tipos de llave Pix y su adivinabilidad: teléfono (E.164 — espacio pequeño y denso), correo (desde corpus de filtraciones), CPF (11 dígitos — generar uno válido es barato), CNPJ (registros públicos), **llave aleatoria (UUID del directorio — no adivinable, esa es su razón de ser)**. El sistema ofrece ambas y deja elegir.

Alta de una llave: código fuera de banda + **cotejo con el registro fiscal (el nombre debe coincidir palabra por palabra)**. El nombre que el pagador ve en la confirmación es la salida de esa comprobación: un nombre editable convertiría la confirmación en puro teatro.

> Un alias no es más fuerte que su alta. Pregunta qué hace una implementación por encima del mínimo, y en particular qué pasa cuando una llave se mueve entre instituciones: un flujo de portabilidad es un flujo de alta con otras palabras.

## Encarecer la enumeración: el token bucket del DICT

El directorio no puede distinguir una consulta de un ataque, de una en una — así que les puso **precio**:

| Evento | Efecto |
|---|---|
| Tamaño del balde | 100 fichas (baldes separados: teléfono/correo vs ID nacional/aleatoria) |
| Consulta válida | Cuesta 1 |
| Llave no registrada (404) | Cuesta **20** |
| Consulta seguida de pago real | Devuelve 1 |
| Paso del tiempo | +2 fichas/minuto |
| Balde vacío | HTTP 429 (saldo puede quedar negativo) |

El manual hace las cuentas: 5 fichas, un 404 → −15 → 8 minutos de espera. Un barrido se **detiene**, no se ralentiza. Además, los participantes deben vigilar: relación consultas/órdenes de pago ("ligeramente superior a 1") y proporción de NOT FOUND por institución y usuario; sospecha fundada → "bloquear inmediatamente".

> La mitad que copiaría primero: la devolución por una consulta que acaba en pago. Un usuario honesto no gasta fichas, así que el límite nunca hay que subirlo por carga legítima (que es como mueren los límites de tasa). Un umbral sobre volumen hay que fijarlo para el usuario legítimo más grande; un umbral sobre **la forma** escala solo.

## Cuando el directorio se filtra

El BCB publica comunicados numerados (art. 32, VIII). Incidente 21: 6 meses de exposición de nombre, CPF, institución, sucursal, número y tipo de cuenta, fecha de apertura, fechas de creación/posesión de la llave. No se accedió a contraseñas, saldos ni movimientos; la información **no permite pagar ni transferir**. En un riel de tarjeta eso sería casi el final; aquí no lo es:

> El nombre de alguien, su banco, su sucursal, su tipo de cuenta y el día en que abrió la cuenta son el guion de una llamada telefónica convincente. No se rompió nada criptográfico, y la exposición es grave igual.

## Dónde están realmente las pérdidas

Fraude de pago autorizado: se convence a la víctima de enviar dinero, y lo envía. El sistema funciona correctamente durante todo el proceso. Reino Unido hizo **obligatorio el reembolso** (7 oct 2024, PSR PS24/7 + PS25/5): la institución remitente reembolsa; **la receptora paga el 50%** (la única parte que estuvo en posición de impedir que existiera la cuenta mula); solo 2 excepciones (fraude o negligencia grave del consumidor); 5 días hábiles; deducible opcional tope £100; sin mínimo; techo £85,000; 13 meses para reclamar; consumidores vulnerables excluidos de deducible y excepción; fraude en varios pasos dentro del alcance.

> Ninguno de los dos reguladores intentó construir un control que identifique el fraude. Movieron un costo hacia la parte mejor situada para impedir la precondición (la cuenta o el barrido) y dejaron que esa parte resolviera cómo. Cuando la acción abusiva es indistinguible de la legítima, pregunta quién soporta hoy la pérdida y quién habría podido evitarla: suelen ser partes distintas, y ese hueco es el hallazgo.

Cierre: una monografía uruguaya de 2012 y un comunicado del BCB de 2026 dicen **la misma frase** ("el banco nunca llamará pidiendo tus claves"). Catorce años, otro continente, otra tecnología: el único control dirigido al mecanismo real de pérdida no cambió, porque el mecanismo no cambió. El trabajo técnico y la pérdida llevan mucho tiempo separándose — ten claro cuál de los dos te pagan por reducir.

## Por qué no hay captura

Los rieles instantáneos no tienen tarjeta ni lector: no hay interfaz sobre la que colocarse. Lo que sí puedes hacer: fotografiar un QR de pago real y decodificarlo a mano (caracteres imprimibles, CRC verificable). Antes de lo que esperas, encontrarás uno en la calle que no coincide con su propio checksum.

**Comprobaciones que valen, en orden**: qué muestra la app del pagador (¿puede un atacante aportarlo todo?); qué hay dentro de la plantilla de cuenta (EMVCo no la definió); dónde cae la frontera petición→autorización; qué cobra el directorio por una consulta que no lleva a nada; cómo se da de alta un alias y cómo se mueve; qué evento hace firme la transferencia y cuánto tiempo después aún se puede congelar; y quién paga cuando sale mal — esa respuesta predice las demás en unos dos años.