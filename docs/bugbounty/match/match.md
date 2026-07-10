---
title: Match & Replace
sidebar_position: 1
---

## ¿Que carajo con esto?

Basicamente una técnica supermega infravaloradisima en los proxies de http (burp, caido).

Cuando cambias la respuesta algunas aplicaciones confian en la respuesta de la api por temas de javascript, te muestra un UI (User Interface) oculto que no deberías ver. O en el peor de los casos lo valida con el back y se ejecuta una operacion XD

Es decir pon que viaja algo en la respuesta:

```json
{"isAdmin":false}
// Se lo cambias a
{"isAdmin":true} // Te muestra las funcionalidades del admin

// HAY CASOS QUE HASTA PUEDE VERSE EN TRANSFERENCIAS
{"status":"rejected"}
// Cambias a 
{"status":"approved"}
```

Basicamente es para simular un estado, normalmente esto solo lo simula por el lado del cliente. Por lo cual solo veras cosas del lado del cliente, pero si somos super suertudos, podemos interactuar con esas cosas con nuestro rol simulado.

Y ya eso es todo cambiar la respuesta pero no solo el body, cambia:

- Una respuesta negativa a una positiva completa
- Un código de estado
- Ve viendo cómo se ve del otro lado del rio cuando una respuesta es positiva
