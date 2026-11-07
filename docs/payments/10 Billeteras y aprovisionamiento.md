---
title: Billeteras y aprovisionamiento
sidebar_position: 10
---

## Quién hace qué

| Parte | Posee / decide |
|---|---|
| Token Service Provider (TSP) | La bóveda DPAN↔FPAN y la autoridad emisora. En la práctica el esquema: Visa **VTS**, Mastercard **MDES** |
| Token Requestor | Quien pide el token (billetera, comercio, fabricante). Se identifica con su Token Requestor ID |
| Emisor | Aprueba/rechaza el aprovisionamiento y decide cuán exigente es la identificación — **la decisión que más importa y la que menos criptografía tiene** |
| Dispositivo | Guarda token + llaves en elemento seguro / entorno confiable, y hace la CVM local |

El criptograma es lo que convierte el token en transacción: Visa llama **TAVV** a su variante e-commerce; el de Mastercard nace dentro del flujo MDES. En contactless viaja en los campos EMV ordinarios: un pago tokenizado se parece estructuralmente a cualquier otro.

> Interceptar una transacción tokenizada te da un DPAN y un criptograma **ya gastado** (vinculado a esa transacción, contador avanzado). Misma defensa del tema de la criptografía del chip: el mecanismo no es nuevo; recibió su propia jerarquía de llaves y su propio ciclo de vida.

## Aprovisionamiento: el color de la decisión

Verde = aprueba ya; amarillo = verificación adicional (OTP, llamada, confirmación en app); rojo = rechaza. Las flechas son criptográficamente sólidas; la caja resaltada es una decisión sobre evidencia.

> Es en el **amarillo** donde se ha perdido el dinero. Durante años el canal por defecto fue un SMS OTP: cae ante SIM swapping, SS7 o un número redirigido. Un atacante con PAN robado + control del canal aprovisiona un token que desde entonces es criptográficamente perfecto y enteramente suyo. No se rompió ninguna criptografía: el paso de identificación era toda la frontera, y eran seis dígitos por SMS.

Preguntas aburridas para una integración de billetera: ¿qué evidencia exige el emisor para el amarillo? ¿Se puede interceptar/redirigir ese canal? ¿Cuántos dispositivos pueden tener token de una tarjeta y se avisa al tarjetahabiente?

## CDCVM: una afirmación que la terminal no puede comprobar

El teléfono verifica (biometría/código) **antes** de presentar la tarjeta y luego lo afirma. Eso es lo que permite superar el límite contactless sin teclado de PIN.

> Aceptable porque el bit está dentro de los datos firmados: nada entre el teléfono y la terminal puede añadirlo. Lo que el diseño no resiste es un dispositivo comprometido — otro modelo de amenazas, y conviene decirlo en cualquier evaluación.

## Dónde se guardan las llaves

| Enfoque | Cómo funciona | Costo para el atacante |
|---|---|---|
| Elemento seguro (Apple Pay, Samsung Pay) | Un chip aparte hace la criptografía | Vencer hardware dedicado sin destruir el dispositivo |
| HCE (GPay) | Llaves temporales desde la nube, renovadas cada ~10-20 transacciones | Una llave robada es real pero **efímera**: unas transacciones, no un clon |

> HCE asume que la llave acabará filtrándose y lo vuelve tolerable acotando cuánto sirve. Ambos enfoques son defendibles: depende de si crees que el teléfono es confiable — pregunta de modelo de amenazas, no de criptografía.

## El modo transporte

Antes de 2019 una billetera no pagaba sin desbloqueo. Los torniquetes (Londres: +48M viajes contactless en un mes de 2019) no pueden esperar un código → modo transporte: una tarjeta marcada como de transporte paga desde un teléfono **bloqueado**. Condiciones: importe cero o MCC de transporte.

Samsung Pay + token Mastercard: importe > 0 → AAC honesto. Comparado byte a byte con un pago válido, **difieren en un solo byte**: 9F27 (CID). `00` = AAC, `80` = ARQC.

> **Cryptogram Confusion**: cambiar 00→80 y el pago se completa, porque el algoritmo que genera un AAC es el mismo que genera un ARQC, solo que con otra etiqueta. Dos partes entendían distinto lo que significaban los mismos bytes. El IAD (9F10, Card Verification Results) registró que era un rechazo de un teléfono bloqueado, llegó intacto (está firmado, no se puede editar en tránsito)… y el servicio de tokens no hizo nada.

> Patrón que se repite: la tarjeta/billetera escribe una declaración firmada y la parte que decide no la lee. Pregunta para cualquier emisor o TSP: "¿cuáles de estos campos evalúas realmente?" antes que cualquier cosa sobre llaves.

## La comprobación que debió detenerlo: CDA

**Combined Data Authentication** firma los datos de la transacción junto con el criptograma: un byte editado rompe la firma en la terminal. Mastercard **exige CDA para contactless** en todas las regiones. El ataque necesitaba que la terminal dejara de pedir CDA → lo aportó **Card Brand Mixup** (hacer creer que el producto es Visa, y Visa no exige CDA porque alarga el toque). Dos hallazgos independientes, ninguno suficiente solo; juntos: pago desde teléfono bloqueado en cualquier tienda.

> Cada decisión era sólida en sus propios términos (CDA obligatoria de MC; concesión de rendimiento de Visa), y la combinación no.

Apple Pay + tarjeta de transporte Visa: Apple Pay no comprueba el importe en absoluto; comprueba MCC (MC) y la bandera de autenticación offline (ambas). Como Visa no exige CDA, bastaba quitar esa bandera.

## Dos importes, una firma

El token Visa de Samsung Pay rechazaba >0 con 6985 sin producir criptograma. La manipulación se fue a otra parte: **9F02 (dentro de los datos EMV firmados) = 0** → la billetera cree que es transporte y firma; el importe de facturación del mensaje de autorización = la cifra real.

> El criptograma es auténtico y pasa la verificación: firma un número distinto del que se cobra. Los dos campos de importe existen por razones legítimas (propinas, impuestos), y solo uno está dentro de la firma. Nada compara el importe que vio la billetera con el que paga el tarjetahabiente.

## Qué se corrigió

- Card Brand Mixup: abordado.
- Mastercard cambió cómo Samsung Pay presenta el contador: las negativas repetidas desde teléfono bloqueado ya no lo avanzan.
- Mastercard empezó a rechazar criptogramas AAC de Samsung Pay y Apple Pay.
- Apple, informada en junio de 2021: en agosto confirmó que **no haría cambios**.
- El campo que registró la verdad (CVR) sigue sin evaluarse, según los investigadores. Sugerencia: contrastar CVR con MCC y rechazar combinaciones imposibles.

> Los proveedores de billeteras no eran quienes podían corregir esto: por diseño no guardan datos de pago (eso los libera de la certificación de la industria de tarjetas, y también les permite decir que aprobar lo sospechoso fue decisión de otro). La arquitectura que vuelve seguro construir una billetera es la misma que reparte la responsabilidad: **ninguna parte ve la transacción completa**.

## Click to Pay y los tokens sin dispositivo

Secure Remote Commerce: tokeniza el pago en línea, sin elemento seguro ni toque. El token se vincula a **comercio + perfil de consumidor**, no a hardware, y el criptograma lo genera el esquema del lado del servidor. Cambia el eje de la restricción de dominio: dispositivo (inútil sin el hardware) vs comercio (inútil fuera de ese comercio). Saber qué eje aplica te dice si una interceptación vale algo.

## La forma del conjunto

Ninguna de estas es una debilidad criptográfica: el canal de la verificación adicional, las comprobaciones de transporte de la billetera, un tipo de criptograma fuera del MAC (rechazo reetiquetado como solicitud), un importe fuera de la firma, y un CVR que nadie leyó. Cada uno pertenece a una parte distinta — por eso las correcciones llegaron a cuentagotas y la última todavía no ha llegado.