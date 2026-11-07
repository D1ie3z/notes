---
title: Clonar datos, no tarjetas
sidebar_position: 13
---

Primer tema de ataques. Fillmore (Black Hat 2015) lo resume: **no puedes clonar tarjetas de forma económica, y sí puedes clonar transacciones**. Casi toda discusión confusa mezcla esas dos afirmaciones; casi todo ataque real es la segunda con el nombre de la primera.

## Tres cosas distintas llamadas clonación

| Qué se copia | Qué cuesta | Qué lo derrota |
|---|---|---|
| **La tarjeta** (sus llaves) | Extracción de llaves de hardware certificado (Common Criteria EAL 5+, resistente a manipulación). Nadie lo hace con ánimo de lucro | El chip, como fue diseñado — la parte que EMV acertó |
| **Los datos** (PAN, vencimiento, service code, discrecional) | Un lector + escritor (MSR605 < $100, tarjetas vírgenes $20/100) | Nada en la banda. En el chip, solo una comprobación que alguien tenga que realizar de verdad |
| **Una transacción** (las respuestas grabadas) | Una grabación y cómo presentarla — aquí viven los ataques publicados | Un valor nuevo que aporta la terminal + un contador que el emisor se tome la molestia de comparar |

> Antes de discutir si una tarjeta es clonable, di a qué fila te refieres. "Se clonó la tarjeta" cuando quieres decir "se repitió una transacción" te lo corregirá el esquema.

## Clonación: copiar lo que nada protege

La banda es estática y sin firmar; leerla y escribirla reproduce los datos con exactitud. Una tarjeta que solo ofrece **SDA puede copiarse**: la firma estática sigue siendo válida en la copia. DDA/CDA rompen eso (la copia necesitaría la llave privada).

> Primera pregunta ante cualquier tarjeta: ¿qué autenticación declara el AIP? (tag 82, primer byte). Una tarjeta con chip que solo ofrece SDA está más cerca de una banda que de la tarjeta de al lado.

**El chip lleva la banda por dentro**: la etiqueta 57 (Track 2 Equivalent Data) = PAN + separador D + vencimiento + service code + **discrecional**. El discrecional es el único valor que difiere entre interfaces: ahí vive el código de seguridad.

**Generaciones de códigos de seguridad**: CVV/CVC (banda), CVV2/CVC2 (impreso, constante — su filtración es permanente), **iCVV/Chip CVC** (chip por contacto, deliberadamente distinto de la banda), dCVV/dCVC (modos banda contactless, regenerado por toque).

**Cyber R&D Lab** ("It Only Takes a Minute to Clone a Credit Card", 11 tarjetas, 10 emisores): leyeron cada tarjeta por banda + chip + contactless, pusieron el iCVV del chip en la banda, grabaron en tarjeta virgen e intentaron pagar. **4 de 11 autorizaron.** Una aceptó datos aleatorios; dos pasaron con una sola pista; solo 2 tarjetas tenían Track 2 distinto por interfaz; del mismo emisor, una vulnerable y otra no — configuración por producto.

> La falla está en la comprobación, no en la criptografía. El iCVV existe y el emisor puede distinguirlo del CVV — pero **no existe requisito de comprobarlo** en transacciones sin presencia de tarjeta, con chip o contactless. Una defensa que la spec te permite omitir es una defensa que parte de los emisores va a omitir.

Corrección barata (del lado del emisor): toda autorización lleva el **modo de entrada** (deslizada/insertada/acercada). Compara el código de seguridad recibido con el modo de entrada declarado y el código del chip en una banda deslizada no tiene dónde esconderse.

## Fallback: la degradación con cinta adhesiva

El fallback permite aceptar un deslizamiento cuando el chip no se deja leer (chips sucios, contactos desgastados — razón legítima). El método de Cyber R&D Lab: **tapa el chip con cinta o inserta a medias, repite hasta que la terminal pida deslizar**. No hay paso de protocolo que atacar: es política del adquirente que se dispara contando lecturas fallidas, y el atacante controla la cuenta.

> El fallback deja un rastro inequívoco: el modo de entrada dice "tarjeta con chip, se replegó a banda", distinto del deslizamiento ordinario. Un emisor puede contarlos y rechazarlos. En una evaluación, pregunta si alguien vigila la tasa.

## Degradación: decirle a la terminal que el chip no está

Service code, primera posición: 2 o 6 = hay chip. El dígito vive en la banda **sin firmar**: cámbialo de 2 a 1 y la terminal cree que no hay chip y procesa con el mecanismo más débil.

```
4000001234567899=2512 2→1 01…
```

La misma lógica en cada capa donde una parte declara una capacidad que la otra no puede comprobar (TTQ/CTQ incluidos).

## El mismo truco en el chip: el AIP

El AIP es la declaración de la propia tarjeta sobre sus defensas, y llega **antes de que ocurra autenticación alguna**. Formato 2 = tag 82 en plantilla 77; formato 1 = tag 80, los 2 primeros bytes del valor (la Visa de repetición responde así — quien busque la etiqueta 82 dirá "no envió AIP" y se equivocará). Apaga bit 6 (DDA) y bit 1 (CDA) y la tarjeta declara no poder hacer autenticación dinámica.

> Circularidad: el AIP decide si ocurre la autenticación offline, y la autenticación offline es el mecanismo que habría detectado un AIP manipulado. Todo lo que la tarjeta diga después es, para la terminal, un dato sin autenticar con la forma correcta. Una bandera no puede protegerse a sí misma.

**El parche existe y es opcional**: 9F4A (Static Data Authentication Tag List) — si está, solo puede contener 82, arrastrando el AIP dentro de los datos firmados. La spec reconoció así que el AIP era el único campo fuera de los registros firmados que hubo que meter dentro.

**Procedimiento de Fillmore (dCVV Visa)**: leer y copiar registros → **poner el AIP en 0080** (activa el bit 8 del byte 2, "reservado para las specs contactless", y deja el byte 1 en cero: retira toda capacidad que pudiera contradecir el modo banda) → repetir registros ante la terminal → cobrar. Para Mastercard, apagar el bit M/Chip de la 82. El trabajo interesante es una edición de dos bytes.

## Clonar una transacción: los modos banda contactless

Los estándares contactless incluyeron modos para equipos antiguos que solo entienden banda. Inventario de Fillmore: **M/Chip** (MC, EMV completo sin captura de PIN), **MagStripe** (MC, heredado: COMPUTE CRYPTOGRAPHIC CHECKSUM + códigos dinámicos, la terminal construye la pista), **VSDC** (Visa, autenticación combinada completa, pocas terminales), **qVSDC** (Visa recortado, sin GENERATE AC), **CVN17** (Visa, criptograma en GPO, sustituto de dCVV), **dCVV** (Visa, obsoleto, READ RECORD — **muchas tarjetas implementan un valor estático, cosa que los estándares de Visa permiten**).

> Un modo llamado "valor de verificación dinámico" en el que se permite a la tarjeta devolver una constante: el estándar hizo opcional su propia propiedad de seguridad. Cuando un campo tenga "dinámico" en el nombre, comprueba si dos lecturas consecutivas difieren. Treinta segundos.

**Ataque de diccionario (modo banda Mastercard)**: el único elemento dinámico es el código atado al número impredecible de la terminal. La longitud del UN = bits del mapa de la pista − dígitos del contador. 4 bytes binarios = 4 mil millones; BCD = 100 millones; **2 dígitos = 100**. Con 100 no hay que adivinar: pide a la tarjeta todas las respuestas posibles por adelantado, guarda la tabla y busca el UN que la terminal produzca.

Procedimiento: leer registros (1 contacto) → armar la tabla (el único paso caro, y su costo lo fija una **decisión de configuración**, no criptografía) → cambiar el bit del AIP → repetir a la terminal → buscar el UN → cobrar sin tarjeta.

**Correcciones de Fillmore**: UN de al menos 4 dígitos (diccionario fuera de alcance); detectar el ataque a posteriori (recolectar respuestas hace saltar el ATC); segundo factor tras transacción fallida; procesadores: rechazar contactless no-M/Chip y desactivar dCVV; probar los RNG de las terminales (tema de el pre-play).

> Quién paga cada corrección y quién carga con la pérdida son preguntas distintas: el diccionario lo derrotan el generador de la terminal y la config del emisor; el fraude lo soportan el emisor o el comercio. Un hallazgo que le cuesta dinero a quien lo lee y se lo ahorra a otro necesita un responsable escrito al lado.

**Las 6 fallas estructurales de EMV según Fillmore**: capacidad de degradar el método de autorización, prevención insuficiente de repetición, sin protección frente a intermediarios, sin protección frente a relay, generación insegura de números aleatorios, transmisión en claro de datos sensibles.

## Repetición, y por qué importa el contador

Grabar es trivial (el protocolo va en claro). Repetir falla por el **ATC**: se incrementa por transacción y entra en el criptograma — un criptograma repetido llega con un contador que el emisor ya vio.

> La defensa tiene una condición previa: **alguien tiene que comprobar**. El ATC lo verifica el emisor, y una transacción aprobada sin conexión nunca llega a uno. Todos los resultados de repetición de la literatura giran en torno a una ruta donde la comprobación no ocurre: offline bajo el límite, formato heredado sin criptograma, adquirente que no reenvía el campo.

En la captura de repetición de las capturas de ejemplo: 28 pares comando/respuesta, la terminal envió **25 comandos idénticos byte a byte**. Los 3 que difirieron son los únicos donde la terminal inyecta algo propio: INTERNAL AUTHENTICATE y los dos GENERATE AC. Todo lo demás es reproducible: SELECT, cada READ RECORD, **el GET DATA del contador de intentos de PIN**, y el **VERIFY con el PIN offline** (el bloque de PIN son los mismos 8 bytes, repetidos y aceptados). El muro: INTERNAL AUTHENTICATE (un reto que la tarjeta nunca vio — el emulador repite los viejos 133 bytes y ahí muere). GENERATE AC: mismo contador y mismo criptograma para un **importe distinto** — solo lo ve un emisor, y solo si compara.

> El contador es el campo que hace detectable la repetición, y es detectable en el emisor y en ningún otro sitio. La terminal estuvo dispuesta a seguir: nada mal formado, nada fuera de orden. La repetición la detecta quien compara dos autorizaciones.

## El contador de reintentos de PIN

La tarjeta responde 63CX (X = intentos restantes). Es un estado guardado en la tarjeta, leído con GET DATA 9F17. En la ejecución repetida, la respuesta sale de la grabación: el mismo valor, de algo que no es una tarjeta y **no tiene estado que decrementar**. El trabajo publicado sobre reiniciarlo: **PINATA** (Salvador Mendoza, DEF CON 29) — el arreglo está del lado del emisor, no de la tarjeta.

> Cualquier contador, límite o bloqueo almacenado en el mismo dispositivo al que limita, y reportado por ese dispositivo cuando se le pregunta, defiende solo contra un atacante que siga las reglas. Un límite de reintentos es una promesa que hace justamente la parte a la que se pretende limitar. Pregunta dónde se guarda la cuenta y en quién se confía para reportarla.

## Qué detiene cada uno de estos

| Defensa | Quién | Qué se gana |
|---|---|---|
| Comparar código de seguridad vs modo de entrada | Emisores | Acaba con el ataque chip→banda. La más barata |
| Vigilar y rechazar fallback a banda | Emisores, adquirentes | Elimina el lector que la banda clonada necesita |
| Rechazar contactless no-M/Chip; desactivar dCVV | Procesadores | Elimina la ruta de modo banda; configuración |
| UN de al menos 4 dígitos | Emisores (perfil) | Pone el diccionario fuera de alcance |
| Comparar ATC con el máximo visto | Emisores | Lo único que detecta repetición directa (detecta, no previene; solo online) |
| Segundo factor tras transacción fallida | Emisores | Convierte el intento fallido en costo, no en reintento gratis |

> Ojo de Fillmore: las terminales solo-EMV no requieren resistencia a manipulación; la certificación cubre interoperabilidad, no seguridad; no se les exige prueba de seguridad lógica; EMVCo no define los mecanismos de actualización. Una defensa escrita como "la terminal debería" es una defensa sin certificación detrás. Prefiere las filas que dicen emisor o procesador: son las partes con un mensaje que inspeccionar y un motivo para inspeccionarlo.

## Cómo razonar sobre uno nuevo

Todos los ataques de este tema tienen la misma forma: **un campo que decide un resultado está donde el paso criptográfico final no lo cubre** — una afirmación que la otra parte no puede verificar (service code, AIP), una comprobación que nadie lee (código de seguridad), o un estado guardado en un dispositivo que el atacante tiene en la mano (contador de PIN). Todo lo que el paso criptográfico final no cubre es negociable.