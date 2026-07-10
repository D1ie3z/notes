---
title: HTTP Verb Tampering
sidebar_position: 1
---

## Acerca de

Es la forma en como mandas la petición GET, POST, PUT, PATCH, etc...

## ¿Por qué en Authorization?

Trata de ver si puedes ejecutar acciones en un endpoint "restringido". Muchas veces configuran bien los controles de acceso en GET y POST, pero las peticiones aceptan otro tipo de HTTP Verb y a veces se les olvida segmentar bien esa acción

Ejemplo:

```http
POST /api/invoces/1
Host: facturas.com
Authorization: Basic c295IHB1w7FldG9uCg==
Content-Type: application/json

{"nombre":"Cariñosa","precio":2000}
```
RESPUESTA

```http
401 Unauthorized

{"status":"No tienes autorización para modificar este recibo"}
```

Pero ¿si pruebas con PATCH o PUT?

```http
POST /api/invoces/1
Host: facturas.com
Authorization: Basic c295IHB1w7FldG9uCg==
Content-Type: application/json

{"nombre":"Cariñosa","precio":2}
```
Es un ejemplo de respuesta, se supone que no debemos moidificar esa información, si puedes bum ahí tienes tu BAC

```http
200 OK

{"status":True}
```

> No te bases en el ejemplo de la respuesta hay veces que te marca un error pero si se modifica el valor en la aplicación REVISA. O en la misma respuesta se ve que modifcaste algo.




       

