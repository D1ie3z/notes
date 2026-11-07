---
title: Sistemas de pagos de seguridad
sidebar_position: 1
---

## Fundamentos

> **¿Llegaste sin saber nada?** Empieza por la nota [Conceptos básicos - el diccionario del que empieza](Conceptos%20b%C3%A1sicos%20-%20el%20diccionario%20del%20que%20empieza): define cada término (APDU, TLV, criptograma, adquirente, emisor...) con analogías, y de ahí vuelves aquí.

**Analogía para empezar**: pagar con tarjeta es como pedir algo en un mostrador y firmar un vale. La terminal (la caja registradora del comercio) le habla a la tarjeta (el mini-computador dentro del plástico), la tarjeta responde, y si hace falta, la terminal pregunta al banco del comprador antes de decir "ok". Todo esto pasa en segundos. La pregunta de seguridad que recorre estas notas es: **cuando alguien dice "ok", ¿quién lo dijo y con qué evidencia?**

### ¿Cómo se verifica y procesa una transacción?

Una transacción con tarjeta dura apenas unos segundos, pero en ese tiempo pasan varias cosas seguidas:

1. La **terminal** establece comunicación con la **tarjeta** (la insertas, la deslizas o la acercas).
2. Se ejecuta una secuencia de **comandos y respuestas**: la terminal pide, la tarjeta contesta. Es un diálogo, no un monólogo.
3. Se procesan datos de la aplicación (qué tarjeta es, qué puede hacer, qué registros tiene).
4. Se hacen comprobaciones criptográficas (la tarjeta "firma" algo).
5. Según el caso, la terminal consulta al **adquirente** (el banco del comercio) y al **emisor** (el banco del comprador) para que aprueben o rechacen.

El diálogo entre tarjeta y terminal usa un idioma llamado **APDU** (Application Protocol Data Unit): la terminal envía un **comando** (una petición, por ejemplo "muéstrame tus aplicaciones") y la tarjeta devuelve una **respuesta** (los datos pedidos + una palabra de estado, que es como un "veredicto" de 2 bytes). Ese idioma está definido por estándares (ISO/IEC 7816 y las especificaciones EMV).

### ¿Por qué el canal no está cifrado?

**Analogía**: imagina que firmas un contrato en una sala llena de gente. Todos pueden ver lo que escribes, pero solo el banco puede verificar si tu firma es auténtica. Ver la conversación no te convierte en el que firma.

La comunicación entre tarjeta y terminal **no es un canal secreto**: cualquiera con un lector puede observar cada byte. Lo que protege la transacción no es esconder la conversación, sino lo que pasa después:

- La tarjeta genera datos criptográficos (un **criptograma**: una "firma" calculada con una llave secreta que solo comparte con su emisor) usando llaves que **la terminal no tiene**.
- El **emisor** (el banco del comprador) es el único que puede verificar ese criptograma. Es el árbitro final.
- También hay **certificados** (documentos firmados que atan una llave pública a una identidad), **contadores** (números que avanzan y sirven para detectar repeticiones) y **llaves** por todos lados — pero cada uno protege algo distinto.

> **Idea clave**: poder ver una conversación no significa poder modificarla con éxito. Ver los datos no te da las llaves para crear datos válidos. La pregunta correcta no es "¿qué puedo observar?" sino "¿quién genera cada dato, quién puede modificarlo, quién puede verificarlo, y qué decisión depende de él?".

### Por qué no es "la terminal verifica la tarjeta"

Es tentador describir EMV como "la terminal comprueba que la tarjeta es auténtica". Es incompleto. La arquitectura **reparte** la autenticación y la autorización entre varias partes:

- La **tarjeta** genera datos que la terminal no puede generar (porque no tiene las llaves).
- El **emisor** verifica el criptograma y decide (porque es el único con las llaves).
- La **terminal** decide cosas locales (riesgo, límites, si puede aprobar sin preguntar).

Cada parte sabe algo distinto y confía en algo distinto. Ahí es donde vive la seguridad — y también donde viven los ataques.

### ¿Y cuando no hay conexión?

A veces la terminal no puede hablar con el emisor (sin señal, modo offline). EMV tiene reglas para eso: la terminal decide localmente si la transacción puede continuar **offline**, aplicando sus propias comprobaciones de riesgo y los límites configurados.

> Esto **no** significa que la terminal esté creando una autorización equivalente a la del emisor. Está decidiendo con lo que tiene a mano. Es una decisión local con reglas locales — y esas reglas son parte de la superficie de ataque (ver la nota de pagos sin conexión).

### La idea que sostiene todo

> La seguridad de pagos no consiste solo en impedir que un atacante modifique un dato; consiste en **controlar qué decisiones pueden tomarse a partir de datos que no están bajo el control de quien toma la decisión**.

Si la terminal decide "esto es seguro" usando un dato que el atacante puede cambiar, la decisión vale lo que valga ese dato. Por eso, ante cualquier sistema de pagos hay que hacerse siempre las mismas preguntas:

- ¿Quién genera este dato?
- ¿Quién puede modificarlo?
- ¿Está autenticado (firmado)?
- ¿Quién puede verificar esa autenticidad?
- ¿Qué componente confía en él?
- ¿Qué ocurre si el dato es incorrecto?
- ¿Qué consecuencias tiene esa decisión para el resto del sistema?

Estas preguntas valen más que memorizar una lista de etiquetas (tags) EMV. Un tag te dice qué es un dato; estas preguntas te dicen si ese dato puede ser una puerta.

## Una tarjeta también es un sistema que genera datos

La banda magnética no proporciona las mismas propiedades criptográficas que el chip EMV. En esencia almacena información que el lector recupera mediante la interacción electromagnética entre la banda y el cabezal magnético.

**MagSpoof (Samy Kamkar, 2015)**: un dispositivo capaz de generar un campo magnético variable que un lector de banda interpreta como los datos de una tarjeta. Lo interesante no es el dispositivo, es el principio de seguridad de hardware:

> Si un sistema interpreta un fenómeno físico como información, un atacante puede estudiar qué propiedades de ese fenómeno necesita reproducir para que el sistema acepte los datos generados.

En la banda, determinados datos le dicen a la terminal características de la aplicación, entre ellos el **código de servicio** (por ejemplo si hay función de chip). Estos datos de banda no dan por sí mismos la autenticidad criptográfica de una transacción EMV por chip, pero se pueden relacionar datos entre banda y chip.

> Un mecanismo de menor seguridad puede transportar información que influye en la decisión de utilizar un mecanismo de mayor seguridad. Si una decisión importante depende de información que no está autenticada criptográficamente, esa información es una frontera de confianza que hay que analizar.

- El problema no es que una banda se pueda emular. Es identificar qué decisiones toma el sistema a partir de esos datos y qué garantías hay sobre su integridad y autenticidad.
- Este patrón se repite en la práctica: en ataques de degradación (usar la banda para que no se use el chip) y en ataques donde se confía en un contador como campo.

## Cuatro partes, y por qué importa

| Parte | Rol |
|---|---|
| Tarjetahabiente | Tiene la tarjeta. Suele ser la única parte que nota cuando algo sale mal. |
| Comercio | Es dueño de la terminal. Quiere que la venta pase y absorbe la pérdida en un contracargo. |
| Adquirente | El banco del comercio. Enruta la transacción hacia la red del esquema. |
| Emisor | El banco del tarjetahabiente. Tiene las llaves y es la única parte que puede verificar un criptograma. |

Cada componente tiene información y capacidades diferentes, y ahí es donde vive la confianza. Por eso no se debe describir EMV como "la terminal verifica la tarjeta": la arquitectura reparte autenticación y autorización entre tarjeta, terminal y backend.

## Cuatro tecnologías, todavía en uso

| Tecnología | Característica principal |
|---|---|
| Banda magnética | Datos estáticos que pueden ser leídos y reproducidos |
| EMV por contacto | Chip con procesamiento dinámico y generación de datos criptográficos |
| EMV sin contacto | EMV vía NFC con flujos optimizados para transacciones rápidas |
| Tokenización | Credencial alternativa que representa un instrumento de pago en un contexto determinado |

> La coexistencia de estas tecnologías tiene una consecuencia práctica: el mismo instrumento de pago puede recorrer caminos de procesamiento completamente diferentes según cómo se presente ante la terminal.

La pregunta clave: ¿qué información necesita presentar el medio de pago para que una nueva transacción pueda procesarse?

- **Banda**: la información permanece constante entre operaciones.
- **EMV**: la tarjeta participa activamente y produce valores criptográficos vinculados a los datos de esa operación.
- **Contactless**: los mismos mecanismos EMV dentro de un intercambio inalámbrico con requisitos de tiempo y comunicación.
- **Tokenizado**: el token que circula puede no ser el número de cuenta primario (PAN) original.

## El canal no tiene que ser secreto

Las tramas APDU transportan información necesaria para ejecutar el protocolo: selección de aplicaciones, lectura de registros, procesamiento de datos, autenticación... Parte de esa información debe ser interpretable por la terminal para que ejecute el flujo.

La propiedad de seguridad aparece cuando esos datos participan después en mecanismos criptográficos o en decisiones sujetas a reglas. Una captura puede revelar el contenido de una comunicación sin dar las llaves secretas para generar valores criptográficos válidos.

Una captura se analiza en dos niveles:

1. ¿Qué información intercambiaron los participantes?
2. ¿Qué información puede usarse o alterarse para producir una nueva transacción válida?

> Encontrar un PAN, un AID, una etiqueta de aplicación o una secuencia completa de APDU puede ser técnicamente interesante, pero nada de eso demuestra que una transacción pueda clonarse o modificarse con éxito.

## De los bytes al fraude

La explotación de una vulnerabilidad en pagos rara vez es una única operación. Hay una diferencia enorme entre obtener información de una tarjeta y conseguir que esa información produzca una transacción económicamente válida:

**Obtener → Reproducir o modificar → Ser aceptado → Obtener beneficio**

Solo los dos primeros eslabones son técnicos. El tercero depende de las condiciones que debe superar la transacción para ser aceptada; el cuarto es convertir la operación aprobada en beneficio económico y evadir los controles posteriores.

> Un reporte técnicamente sólido debe establecer dónde termina la evidencia. "El dato puede obtenerse" es una afirmación. "El dato puede modificarse" es otra. "La terminal acepta la modificación" es otra. Y "la modificación permite completar una transacción no autorizada" es una conclusión distinta que requiere evidencia adicional.

## El protocolo visto desde otra perspectiva

Una captura APDU permite seguir la operación desde el primer comando. En contactless, uno de los primeros pasos es la selección de una estructura conocida por la terminal.

Primer comando de la terminal:

```
00 A4 04 00 0E 32 50 41 59 2E 53 59 53 2E 44 44 46 30 31 00
```

| Bytes | Valor | Qué es |
|---|---|---|
| `00 A4 04 00` | SELECT | El encabezado del comando: operación SELECT |
| `0E` | 14 bytes | El campo de datos contiene catorce bytes |
| `32 50 41 ...` | `2PAY.SYS.DDF01` | ASCII: la terminal pide seleccionar ese identificador (el PPSE) |

No hace falta ninguna operación criptográfica para interpretar esto. Solo estructura APDU + ASCII.

La respuesta trae estructuras TLV con las aplicaciones disponibles:

```
6F5B840E325041592E5359532E4444463031A549BF0C4661224F07A0000000031010500A5649534120444542495487010142034000005F5502555361204F07A00000009808405008555320444542495487010242034000005F550255539000
```

| Tag | Valor | Qué es |
|---|---|---|
| `84` | `2PAY.SYS.DDF01` | Dedicated File Name |
| `4F` | `A0000000031010` | Application Identifier (AID). El prefijo registrado de Visa es `A000000003`; toda aplicación Visa del planeta empieza con esos cinco bytes |
| `50` | `VISA DEBIT` | Application Label. Es lo que muestra la terminal en pantalla; es una cadena de presentación **sin ningún valor de seguridad**. La tarjeta puede afirmar lo que sea aquí |
| `87` | `01` | Application Priority Indicator: la tarjeta le dice a la terminal qué aplicación elegir primero |
| `42` | `400000` | Issuer Identification Number |
| `5F55` | `US` | Issuer Country Code |
| `4F` | `A0000000980840` | El AID de la segunda aplicación: otra red, en la misma tarjeta |
| `50` | `US DEBIT` | Application Label de la segunda aplicación |

La tarjeta no respondió con una aplicación: respondió con dos, cada una en su propia plantilla (`61`), con su nombre legible y una prioridad que dice cuál debería preferir la terminal.

> La tarjeta declara una preferencia y se confía en que la terminal la respete. Nada obliga a la terminal a elegir la primera aplicación, y una terminal que elige la segunda está teniendo otra conversación, con otras reglas y otro conjunto de verificaciones. Ese es el mecanismo detrás de un ataque publicado.

La dificultad no está en reconocer cada campo, está en entender la relación entre ellos. Así una captura deja de ser una secuencia hexadecimal y se convierte en una transacción que puede explicarse, reproducirse y, cuando existe una debilidad, ponerse a prueba.

## En qué punto está la investigación en 2026

Tres papers que resumen el estado del arte de la investigación en pagos sin contacto:

- **SoK: Security of EMV Contactless Payment Systems** (Mehr Nezhad, Hao, Epiphaniou, Maple, Yunusov · IEEE EuroS&P 2025): ordena la literatura en **7 vectores de ataque** en 3 áreas: qué aplicación se selecciona, cómo se verifica al tarjetahabiente y cómo se autoriza la transacción.
- **More is Less: Extra Features in Contactless Payments Break Security** (Pavlides, Clee, Boureanu, Chothia · USENIX Security 2025): lección arquitectónica, no técnica. Nadie diseñó las fallas: varias partes le fueron agregando funciones a EMV por su lado (restricciones de lectores offline, transporte público, reglas regionales para pagos altos) y los ataques están en los huecos entre ellas. Uno logró que una terminal aceptara un pago fraudulento de **£25,000**.
- **Zombie Cards Back Online: Reviving Expired Credit Cards for Contactless Payments** (Anwar, DeCunha, Raza · USENIX Security 2026): el vencimiento es una comprobación de política que hace la terminal, no una propiedad de la tarjeta. En la configuración Visa probada la fecha no estaba cubierta por la firma de la tarjeta. Dos teléfonos y software de relay revivieron una tarjeta vencida en una terminal real.

> La terminal decide que una aplicación está vencida y escribe ese juicio en un bit de los **Terminal Verification Results (TVR)**, y los códigos de acción publicados por Visa mandan ese bit al emisor en vez de rechazar la transacción por él. Lee la especificación y los papers actuales juntos; ninguno alcanza por sí solo.

