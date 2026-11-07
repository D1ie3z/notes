---
title: Sistemas de pagos de seguridad
sidebar_position: 1
---

## Fundamentos

¿Cómo se verifica y procesa una transacción con la terminal, por qué el protocolo APDU no está cifrado y qué protege la transacción en su lugar?

Una transacción con una tarjeta bancaria puede ejecutarse en apenas unos segundos. Durante este intervalo de tiempo, la terminal establece una comunicación con la tarjeta, ejecuta una secuencia de comandos y respuestas, procesa datos de aplicación, realiza comprobaciones criptográficas y, dependiendo del flujo de autorización, puede comunicarse con el adquirente y el emisor antes de decidir si la transacción debe aprobarse o rechazarse.

La comunicación entre una tarjeta EMV (Europay, Mastercard y Visa) y una terminal no consiste simplemente en un canal cifrado en el que toda la información intercambiada permanece secreta.

En el entorno de contacto o NFC, la comunicación se estructura mediante comandos y respuestas APDU (Application Protocol Data Unit) definidos por las especificaciones de ISO/IEC 7816 y por las especificaciones de EMV. La arquitectura utiliza autenticación, criptografía, llaves secretas, certificados, contadores y criptogramas para proteger determinadas decisiones y datos críticos.

Poder observar una trama de APDU no significa automáticamente poder modificar la transacción de forma útil o poder explotarla. La pregunta relevante no es únicamente qué datos pueden observarse, sino qué componente genera cada dato, quién puede modificarlo, quién puede verificarlo y qué decisión depende de él.

En una transacción EMV, la tarjeta puede generar datos criptográficos utilizando llaves que no están disponibles para la terminal. Dependiendo del flujo de la transacción, el emisor puede posteriormente verificar un criptograma generado por la tarjeta o validar otros datos criptográficos asociados con la operación. Por eso es importante no describir EMV simplemente como un mecanismo mediante el cual “la terminal verifica la tarjeta”. La arquitectura distribuye las funciones de autenticación y autorización entre la tarjeta, la terminal y los sistemas que se encuentran en el backend.

La situación cambia cuando la terminal debe tomar determinadas decisiones sin disponer de una autorización online del emisor. En esos casos, la terminal puede utilizar los mecanismos definidos por EMV para determinar si una transacción puede continuar offline, si la terminal no cuenta con la capacidad de conectividad o si de cierta forma es forzada a estar offline. Esto no significa que la terminal esté creando una autorización equivalente a la del emisor; significa que está aplicando las reglas y los mecanismos de riesgo disponibles localmente para decidir si la operación puede completarse bajo esas condiciones.

> La seguridad de pagos no consiste solamente en impedir que un atacante modifique un dato; consiste en controlar qué decisiones pueden tomarse a partir de datos que no están bajo el control de quien toma la decisión.

Para analizar un sistema de pagos correctamente, conviene formular siempre las mismas preguntas: ¿quién genera este dato?, ¿quién puede modificarlo?, ¿está autenticado?, ¿quién puede verificar esa autenticidad?, ¿qué componente confía en él?, ¿qué ocurre si el dato es incorrecto?, ¿y qué consecuencias tiene esa decisión para el resto del sistema? Estas preguntas son mucho más útiles para una investigación de seguridad que memorizar aisladamente una lista de tags EMV.

## Una tarjeta también es un sistema que genera datos

La banda magnética no proporciona las mismas propiedades criptográficas que el chip EMV. En esencia almacena información que el lector recupera mediante la interacción electromagnética entre la banda y el cabezal magnético.

**MagSpoof (Samy Kamkar, 2015)**: un dispositivo capaz de generar un campo magnético variable que un lector de banda interpreta como los datos de una tarjeta. Lo interesante no es el dispositivo, es el principio de seguridad de hardware:

> Si un sistema interpreta un fenómeno físico como información, un atacante puede estudiar qué propiedades de ese fenómeno necesita reproducir para que el sistema acepte los datos generados.

En la banda, determinados datos le dicen a la terminal características de la aplicación, entre ellos el **código de servicio** (por ejemplo si hay función de chip). Estos datos de banda no dan por sí mismos la autenticidad criptográfica de una transacción EMV por chip, pero se pueden relacionar datos entre banda y chip.

> Un mecanismo de menor seguridad puede transportar información que influye en la decisión de utilizar un mecanismo de mayor seguridad. Si una decisión importante depende de información que no está autenticada criptográficamente, esa información es una frontera de confianza que hay que analizar.

- El problema no es que una banda se pueda emular. Es identificar qué decisiones toma el sistema a partir de esos datos y qué garantías hay sobre su integridad y autenticidad.
- Este patrón se repite en todo el curso: el **módulo 13** muestra el ataque de degradación (usar la banda para que no se use el chip) y el **módulo 15** la misma forma con un contador como campo confiable.

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
| Banda magnética | Datos estáticos que pueden ser leídos y reproducidos (módulo 3) |
| EMV por contacto | Chip con procesamiento dinámico y generación de datos criptográficos (módulos 4 y 5) |
| EMV sin contacto | EMV vía NFC con flujos optimizados para transacciones rápidas (módulo 8) |
| Tokenización | Credencial alternativa que representa un instrumento de pago en un contexto determinado (módulos 7 y 10) |

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

> La tarjeta declara una preferencia y se confía en que la terminal la respete. Nada obliga a la terminal a elegir la primera aplicación, y una terminal que elige la segunda está teniendo otra conversación, con otras reglas y otro conjunto de verificaciones. Ese es el mecanismo detrás de un ataque publicado que el curso desarma más adelante.

La dificultad no está en reconocer cada campo, está en entender la relación entre ellos. Así una captura deja de ser una secuencia hexadecimal y se convierte en una transacción que puede explicarse, reproducirse y, cuando existe una debilidad, ponerse a prueba.

## En qué punto está la investigación en 2026

Tres papers para orientarse antes de avanzar:

- **SoK: Security of EMV Contactless Payment Systems** (Mehr Nezhad, Hao, Epiphaniou, Maple, Yunusov · IEEE EuroS&P 2025): ordena la literatura en **7 vectores de ataque** en 3 áreas: qué aplicación se selecciona, cómo se verifica al tarjetahabiente y cómo se autoriza la transacción. Es casi el orden del curso.
- **More is Less: Extra Features in Contactless Payments Break Security** (Pavlides, Clee, Boureanu, Chothia · USENIX Security 2025): lección arquitectónica, no técnica. Nadie diseñó las fallas: varias partes le fueron agregando funciones a EMV por su lado (restricciones de lectores offline, transporte público, reglas regionales para pagos altos) y los ataques están en los huecos entre ellas. Uno logró que una terminal aceptara un pago fraudulento de **£25,000**.
- **Zombie Cards Back Online: Reviving Expired Credit Cards for Contactless Payments** (Anwar, DeCunha, Raza · USENIX Security 2026): el vencimiento es una comprobación de política que hace la terminal, no una propiedad de la tarjeta. En la configuración Visa probada la fecha no estaba cubierta por la firma de la tarjeta. Dos teléfonos y software de relay revivieron una tarjeta vencida en una terminal real.

> La terminal decide que una aplicación está vencida y escribe ese juicio en un bit de los **Terminal Verification Results (TVR)**, y los códigos de acción publicados por Visa mandan ese bit al emisor en vez de rechazar la transacción por él. Lee la especificación y los papers actuales juntos; ninguno alcanza por sí solo.

## Cómo recorrer el curso

| Dónde | Qué desarmas |
|---|---|
| Módulos 3–5 | La banda, luego toda la conversación: comandos, cadena de certificados de la tarjeta y el criptograma que solo el emisor verifica. El 5 es donde el protocolo deja de ser un sistema de archivos y empieza a ser criptografía |
| Módulos 6–12 | Cómo decide la terminal que confía en ti: CVM, límites que mandan una transacción en línea, tokenización y PCI DSS |
| Módulos 13–20 | Ataques publicados byte por byte: clonación y degradación, pre-play, relay y acotación de distancia, tap-to-phone, terminales sin conexión |
| Módulos 21–22 | Nivel investigador: el tramo de autorización (qué decide el emisor realmente, mensaje ISO 8583) y la investigación abierta |

## Herramientas del curso

| Herramienta | Qué hace |
|---|---|
| ATRIUM | Se coloca entre una tarjeta y una terminal y lee, decodifica, registra y reescribe lo que cruza. Su capa host habla ISO 8583 (módulo 19) |
| Plexus | Dibuja un montaje como un grafo de nodos, lo revisa y lo ejecuta. Útil en el trabajo de relay (módulo 16) |
| SIMtrace2 T=1 | Firmware que permite a un SIMtrace2 responderle a una terminal EMV y no solo a un módem (módulo 22) |

Las tres corren sin tarjeta para buena parte de lo que enseñan: ATRIUM repite una captura del corpus y Plexus abre sobre un runtime simulado. Ambas distinguen en pantalla resultado simulado de real, para no publicar algo falso.

