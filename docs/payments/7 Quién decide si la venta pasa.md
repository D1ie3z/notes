---
title: Quién decide si la venta pasa
sidebar_position: 7
---

Pregunta quién decide si una transacción se aprueba y la mayoría dirá el banco. Cierto para la respuesta final, falso para casi todo lo que lleva hasta ella: antes de que un byte llegue al emisor, la terminal ya se formó una opinión y la tarjeta tuvo la oportunidad de contradecirla. La transacción pudo rechazarse de plano sin consultar a nadie.

> La autenticación pregunta "¿es genuina esta tarjeta?". La gestión de riesgo pregunta "¿quiero esta transacción de todos modos?". Una tarjeta puede pasar todas las verificaciones criptográficas y aun así ser rechazada por un límite de piso; puede no pasar ninguna y ser aprobada si la terminal se configuró para permitirlo.

## Tres respuestas, un solo comando

La terminal emite GENERATE AC y la elección del criptograma **es** la decisión:

| La terminal quiere | Pide (P1) | Significado |
|---|---|---|
| Aprobar sin conexión | TC | Transaction Certificate: liquida sin preguntar |
| Ir en línea | ARQC | Authorisation Request Cryptogram: que decida el emisor |
| Rechazar sin conexión | AAC | Application Authentication Cryptogram: no se consulta a nadie |

El tipo real lo anuncia la tarjeta en el **CID, tag 9F27**: bits 8-7 = 00 AAC, 01 TC, 10 ARQC, 11 reservado (el resto: aviso/motivo).

> "Una decisión sin conexión tomada aquí no es final. Si la terminal solicita un TC, la ICC puede devolver un ARQC o un AAC." La tarjeta solo puede responder más conservadoramente de lo pedido, nunca menos: quien pidió AAC no recibe TC. Entre terminal y tarjeta, la decisión solo puede endurecerse.

## El TVR (tag 95): solo un registro

5 bytes de banderas: **notas sobre la marcha**, nada de aprobar/rechazar. Byte 1 autenticación offline, byte 2 aplicación, byte 3 verificación del tarjetahabiente, byte 4 gestión de riesgo, byte 5 emisor/script.

| Byte·bit | Significado |
|---|---|
| 1·b8 | No se realizó autenticación offline (activado por diseño en terminales EE.UU. solo online) |
| 1·b7/b4/b3 | Falló SDA / DDA / CDA (cada método su propio bit) |
| 2·b7 | Aplicación vencida |
| 2·b5 | Servicio solicitado no permitido (la única condición que Visa rechaza offline incondicionalmente) |
| 3·b8 | CVM no exitosa (lo que escribe la terminal ≠ lo que se le dijo a la tarjeta) |
| 3·b3 | PIN online ingresado (hecho, no falla; enruta en línea) |
| 4·b8 | Excede el límite de piso |
| 4·b5 | Selección aleatoria para ir en línea (defensa que solo funciona si la aleatoriedad es real) |
| 5·b7 | Falló la autenticación del emisor (el emisor respondió y la tarjeta no le creyó; raro, digno de investigar) |

**El TVR va firmado**: la terminal lo entrega a la tarjeta en el CDOL1 (posición 14) y entra en el criptograma. Un emisor que verifique puede ver qué afirmó observar la terminal. Es lo más cerca que llega EMV de exigir que la terminal responda por su propia versión.

> El TVR está autenticado: un relay no puede reescribirlo sin romper el criptograma. Pero sigue siendo el relato que la terminal hace de sí misma: una terminal deshonesta escribe un TVR falso y la tarjeta lo firma fielmente, porque no tiene forma independiente de saber qué hizo la terminal. Confía en la firma para una sola cosa: que el relato llegó sin alterar. Que fuera correcto es otra cuestión.

## Los códigos de acción: el registro se vuelve decisión

TAC (del adquirente, viven en la terminal) e IAC (del emisor, viven en la tarjeta). Misma forma de 5 bytes que el TVR; se enmascaran con él (AND) y si sobrevive algún bit, la acción se dispara. Tres pares, en orden:

| Par | Si coincide algún bit | GenAC | Respuesta |
|---|---|---|---|
| TAC/IAC Denegación | Rechazo inmediato, sin conexión | 1 | AAC |
| TAC/IAC En línea | Enviar al emisor | 1 | ARQC o AAC |
| TAC/IAC Por defecto | Rechazo solo si la terminal no pudo conectarse | 2 | AAC |

> Los códigos por defecto solo se consultan cuando la terminal intentó conectarse y no pudo. Con la red caída la terminal se comporta distinto a una que nunca pensó conectarse: misma tarjeta, mismo importe, camino de código distinto.

**Los números reales de Visa (terminal POS EE.UU. solo online):**

- **TAC Denegación `00 10 00 00 00`**: solo byte 2 b5 (servicio no permitido). Toda la política de rechazo offline de Visa es un bit: ni DDA fallido ni CVM fallido rechazan — "por todo lo demás vale la pena preguntarle al emisor".
- **TAC En línea `58 40 04 F8 00`**: byte 1 = 58 (SDA falló, archivo de excepciones, DDA falló — se escalan, no se rechazan); byte 2 = 40 (vencida); byte 3 = 04 (PIN online); byte 4 = F8 (los 5 bits de gestión de riesgo: piso, límites de consecutivas, aleatoria, forzado por comercio). "Un dispositivo solo online debe configurar TAC En línea con byte 4 bit 8 = 1."
- **TAC Por defecto `58 40 00 A8 00`**: se quita PIN online (no tiene sentido rechazar por eso cuando no hay conexión) y byte 4 = A8 (faltan b7 y b5: el límite suave y la aleatoria no rechazan a un cliente cuando no hay red).

> El diff entre F8 y A8 es una decisión de política: con la red caída, el techo duro sigue rechazando pero los controles suaves dejan de aplicar. Puedes leer el apetito de riesgo de un esquema en el diff entre dos hex — y ahí se esconden los errores de configuración.

## Límite de piso cero (9F1B)

Importe bajo el cual la terminal puede aprobar sin preguntar. Con cero, la comparación se cumple en toda transacción → bit 8 byte 4 del TVR. El requisito "solo online" tiene **dos mitades**: límite de piso 0 + TAC En línea byte 4 bit 8. Cualquiera sin la otra es un error de configuración **silencioso**: la terminal sigue funcionando, solo que deja de conectarse cuando suponías que lo haría.

## Terminal Type (9F35) — el hardware no es la política

`21` = solo online, comercio atendido (firma disponible como CVM); `24` = no atendido (sin personal: las opciones CVM se reducen); `14` = ATM (PIN cifrado online obligatorio, teclado no opcional).

> "El Terminal Type por sí solo no es suficiente": describe el hardware; el límite de piso y los TAC describen la política. Confundirlos es una forma común de malinterpretar una configuración.

## Quick Chip

Cuando todo va en línea, EMV offline es peso muerto. Quick Chip elimina **autenticación del emisor y scripts del emisor** — los dos mecanismos que exigen que la tarjeta siga presente cuando llega la respuesta — y la tarjeta puede retirarse antes.

> Los scripts del emisor son el canal para actualizar tarjetas en circulación: resetear contador de PIN, bloquear aplicación, cambiar límites. Un mercado que los elimina renuncia a la gestión remota de tarjetas: la única palanca que le queda es rechazar transacciones.

## Cuando se cae la red

Terminal solo online sin conexión: no puede aprobar nada por construcción. GenAC 1 pide ARQC; no llega respuesta; aplican los códigos por defecto en GenAC 2 → AAC. La transacción se rechaza offline: **el diseño funciona**. La industria responde con **autorización diferida (store and forward)**: completar la venta y mandar la autorización cuando vuelva la red. Visa: si la compensación lleva datos de chip, el criptograma debe ser el **ARQC de GenAC 1**, no el AAC de GenAC 2.

> La autorización diferida traslada el riesgo al comercio en silencio: el cliente tiene la mercancía antes de que nadie haya dicho que sí. Una solicitud diferida rechazada no debe compensarse. La política del comercio sobre qué entrega sin autorizar ES el control: pide verla.

## Un bit que resultó estructural: la aplicación vencida

TVR byte 2 b7. Los códigos de acción de Visa lo **escalan** (TAC En línea, no Denegación): vencida = motivo para preguntar, no para rechazar. Política sensata... que descansa en una suposición no escrita: que la terminal puede saberlo.

**Zombie Cards Back Online** (Anwar, DeCunha, Raza, USENIX 2026): dos teléfonos con software de relay revivieron una tarjeta Visa vencida en una terminal real.

> El vencimiento se aplica como una comprobación de **política que hace la terminal** sobre una fecha que leyó; no es una propiedad que la tarjeta demuestre. En la configuración Visa probada, la firma de la tarjeta **no cubría esa fecha**. Un relay la reescribe mientras todas las respuestas criptográficas auténticas pasan intactas. El TVR registra con honestidad la conclusión falsa, y la firma cubre la conclusión — nada le preguntó a la tarjeta si la fecha era correcta.

Montaje: 2 teléfonos corrientes + terminales SumUp comerciales. Nada exótico. 5 bancos de EE.UU. (A-E), Visa/MC/AMEX/Discover + Apple Pay/Google Pay. Sus propias tarjetas vencidas, comercios avisados, cargos pagados. Visa y bancos notificados en mayo 2025; **sin mitigación confirmada al publicar**.

> Cautela de los autores: los resultados describen las tarjetas que probaron, no todas las que emite una red. No dice "Visa está rota": dice que en esa configuración la fecha que comprueba la terminal no está vinculada a lo que el banco usa para autorizar. Afirmación acotada y útil: te dice qué ir a comprobar.

## Qué mirar en la práctica

1. **Terminal Type (9F35)**: ¿atendida o no? ¿Concuerda con los CVM ofrecidos?
2. **Límite de piso (9F1B)**: cero si alguien dijo "solo online".
3. **Los tres códigos de acción**: decodifícalos bit a bit. ¿El byte 4 b8 del TAC En línea concuerda con el piso?
4. **TVR en la captura (95)**: ¿qué bits se activaron y el resultado concuerda con lo que debían provocar?

> Nunca leas un código de acción como número: léelo como 5 bytes de banderas. Un bit en posición RFU significa que la config está mal o tu orden de bits lo está, y conviene saber cuál antes de anotar nada. El TVR dice qué observó la terminal; los códigos de acción dicen qué debió hacer. Cuando el resultado no se deduce de esos dos, algo en medio no se comporta según lo especificado — y ese hueco vale más que cualquier bit.