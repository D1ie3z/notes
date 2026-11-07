---
title: Tokenización - otro número de tarjeta
sidebar_position: 9
---

**Analogía para empezar**: tu número de tarjeta es como tu llave de casa: si la pierdes, cualquiera puede entrar. La tokenización te da una llave distinta por contexto — una para el teléfono, otra para el comercio en línea — que solo funciona en ese contexto. Si la roban, no abre nada en otro lado.

## Dos cosas llamadas tokenización

| | De comercio / PCI | De red / EMV |
|---|---|---|
| Qué devuelve | Referencia opaca sin significado fuera de la bóveda que la emitió. **No es un número de tarjeta** | Un segundo número de tarjeta válido, un **DPAN**, en el mismo espacio de numeración, vinculado a dispositivo/comercio/canal |
| Para qué | Que el comercio deje de almacenar PANs (reduce alcance PCI, ver tema de PCI DSS). No cambia nada en la terminal | Que un número capturado valga mucho menos que la tarjeta. Apple Pay / Google Pay |

Confundirlas es el error más común del tema, y lleva a evaluar el control equivocado.

## Un token es un número de tarjeta

Un DPAN tiene la misma longitud, los mismos dígitos de esquema y el mismo Luhn. Ocupa los mismos campos de los mismos mensajes. El registro de Track 2 **no cambia**: el token va en la casilla del PAN y nada más.

> Fue una decisión de diseño: exigir un campo nuevo habría obligado a cambiar todas las terminales, pasarelas, adquirentes y hosts del planeta a la vez. Elegir un formato universal hizo posible el despliegue. El costo: los tokens quedaron indistinguibles de las tarjetas.

**Alternativas y por qué no ganaron:**

| En vez del PAN | ¿Se recupera el PAN? | ¿Viaja por los rieles actuales? |
|---|---|---|
| PAN mismo | Es el PAN | Sí (la base) |
| PAN cifrado | Sí, con la llave | No: ni longitud ni Luhn correctos |
| Hash del PAN | Por inversión no, pero 16 dígitos = prefijo conocido + Luhn = **9 dígitos = mil millones de candidatos = minutos en hardware alquilado** | No, y no se puede reemitir/revocar |
| Token de red | No por ningún camino; solo la bóveda tiene el par | **Sí, indistinguible — por eso ganó** |

> Un sistema que guarda hashes de PAN y los llama tokens no tiene protección real y sí un problema de vocabulario. Repórtalo sin rodeos.

## Las partes, y quién ve qué número

```
Teléfono/tarjeta (DPAN + llaves) → Comercio (DPAN) → Adquirente (DPAN) → Red (lo enruta)
                                                                           ↓
Emisor (FPAN) ← consulta ← Servicio de tokens (bóveda: el mapa DPAN↔FPAN)
```

- El DPAN recorre todo el lado comercio/adquirente sin convertirse nunca allí en el PAN real. El cambio ocurre en el servicio de tokens (Visa: **VTS**; Mastercard: **MDES**).
- Una brecha en un comercio entrega tokens, no tarjetas.
- **El emisor autoriza contra la cuenta de fondeo y puede no ver el detalle EMV** — lo tiene el servicio de tokens, que no sufre la pérdida ni tiene la relación con el cliente (Yunusov, Ivachev, Stennikov, Positive Technologies 2021).

> La parte que arriesga el dinero no es, por defecto, la que mira la evidencia del protocolo. "¿Quién ve qué campo?" es mejor pregunta de apertura que cualquier cosa sobre longitudes de llave.

Campos nuevos: **9F24 Payment Account Reference** (igual en todos los tokens de una cuenta, sin camino de vuelta al PAN — permite reconocer clientes recurrentes sin dar el número) y **9F19 Token Requestor ID** (qué billetera pidió el token). Antifraude: qué cuenta (9F24) y qué solicitante (9F19); *qué dispositivo no lo estandarizó nadie*.

> Ninguno de estos campos existe en el Book 3 (su tabla va de 9F00 a 9F50 + 9F7F). Se añadieron después. El documento central del protocolo se escribió suponiendo que el número de la tarjeta era el número que autorizaría el emisor.

## Aprovisionamiento: cómo llega un token a un dispositivo

```
Billetera → Servicio de tokens → Emisor (ID&V: verde/amarillo/rojo) → Token acuñado (DPAN + llaves)
```

De seis pasos, **exactamente uno es criptografía**. Verde = aprobar, amarillo = verificación adicional, rojo = rechazar (vocabulario de la industria, no campo de ninguna captura).

Qué debe establecer: que la tarjeta existe (sólido), que el dispositivo puede proteger una llave (atestación + certificación de la billetera), **que quien añade la tarjeta es el tarjetahabiente (ID&V — proceso humano, toda la frontera de seguridad)**, y que el emisor acepta (un emisor que siempre responde verde ha delegado su apetito de riesgo en quien escribió la pantalla de alta).

> El patrón que más ha costado: PAN robado → aprovisionado en una billetera controlada por el atacante → ID&V débil → emisor aprueba porque la evidencia era interceptable. Desde ese momento el token es legítimo: acuñado y firmado correctamente. Todo lo criptográfico funcionó como se diseñó.

Una tarjeta puede tener muchos tokens a la vez (teléfono, reloj, navegador, suscripción), cada uno con sus llaves, cada uno anulable sin tocar los demás. Preguntas para un emisor: ¿qué evidencia exigió y podía interceptarse? ¿Cuántos dispositivos pueden tener token de una tarjeta y se entera el tarjetahabiente?

## La seguridad está en la restricción de dominio

Un token viaja en las etiquetas 5A y 57 como cualquier número; capturarlo cuesta lo mismo. La diferencia es **para qué sirve después**, y es de política, no de criptografía. El servicio de tokens comprueba el contexto en cada autorización, o rechaza.

| Vinculado a | Qué significa | Copia robada vale |
|---|---|---|
| Dispositivo | Solo válido desde el elemento seguro donde se aprovisionó | Nada sin el dispositivo → los ataques apuntan al aprovisionamiento |
| Comercio | Solo desde un ID de comercio (tarjeta en archivo) | Nada en otro sitio: la brecha de un comercio pasa de catástrofe a molestia |
| Canal | Solo contactless o solo e-commerce | Nada fuera del canal — si el servicio lo comprueba (esa es la suposición a probar) |
| Número de usos | De un solo uso / vida corta | Nada tras gastarse; la ventana se mide en transacciones |

> El defecto real del PAN fue su falta de dominio, no su falta de secreto. Un número que acepta cualquier terminal en cualquier país por cualquier canal tiene un solo bit de seguridad: lo tienes o no. La tokenización le dio alcance a algo que nunca lo había tenido. Mismo razonamiento que una API key con scope o una cookie por origen.

Otras tres propiedades (fallan por separado): **criptograma propio** (llaves por dispositivo; capturar el número no da una transacción), **ciclo de vida independiente** (un token comprometido se suspende sin reemitir la tarjeta), **verificación previa al pago** (el dispositivo comprueba rostro/huella y lo dice — afirmación del dispositivo, no algo que la terminal verifique).

## Reconocer un token en una captura

No hay etiqueta que diga "esto es un token". Indicios (ninguno es prueba por sí solo):

| Indicio | Sugiere | Por qué no es prueba |
|---|---|---|
| PAN en rango de token | Lo acuñó un servicio | Los rangos los publican los esquemas y cambian |
| 5F34 distinto | Otra instancia (Book 3: "para diferenciar tarjetas con el mismo PAN") | Las tarjetas adicionales de una cuenta también difieren |
| 9F19 presente | La billetera que lo pidió | Opcional, específica del esquema |
| 9F24 presente | Hay una bóveda detrás | Opcional; cada vez más común también en tarjetas físicas |
| 9F6E presente | Visa: factor de forma / MC: datos de terceros | **Lee la longitud: 4 bytes vs 7 bytes** |
| Verificación ya realizada | El dispositivo comprobó algo antes | El indicio más fuerte… y una afirmación |

**9F6E a fondo**: en capturas Mastercard mide 7 bytes y sus 2 primeros repiten el código de país del emisor (5F28)... que también coincide con 9F42 (código de moneda, ISO 3166 vs ISO 4217 asignan el mismo número a país y moneda). Con esas muestras no hay forma de distinguirlos — la lectura honesta: "dos primeros bytes = algo que fija el emisor". En Visa mide 4 bytes: Form Factor Indicator (`20700000`), sin decodificar (spec propietaria). Aplicar el formato Visa a una captura Mastercard produce una descripción fluida de un dispositivo que no está ahí: **lee la longitud primero**.

> Un campo que dos fabricantes implementan distinto bajo un mismo identificador es el resultado normal cuando se comparte un espacio de identificadores y la coordinación es floja. La defensa: lee la longitud, comprueba el fabricante, y niégate a interpretar un valor hasta saber en qué dialecto está escrito.

## Qué no arregla la tokenización

El PAN sigue en: el plástico, la banda magnética (fallback vivo), la etiqueta 5A del chip (el EMV por contacto nunca se tokenizó), la 57 (copia de la banda), y la bóveda + emisor.

> Efecto de segundo orden: cada una de esas copias puede alimentar una **solicitud de aprovisionamiento**. Un PAN de una brecha de hace tres años ya no sirve para gastar en una terminal — sirve para iniciar la cadena que termina en un token legítimo dentro de una billetera que el atacante controla. La tokenización le dio un uso nuevo a los PANs robados hace tiempo.

Junta las dos mitades: el aprovisionamiento descansa en evidencia de un proceso humano, y el PAN que inicia la solicitud sigue en cinco lugares. El lado de la terminal está bien defendido; el lado del alta solo está tan bien defendido como la evidencia que exige el emisor.