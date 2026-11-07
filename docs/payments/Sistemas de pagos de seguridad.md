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

