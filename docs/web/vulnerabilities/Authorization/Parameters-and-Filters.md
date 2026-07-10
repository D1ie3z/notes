---
title: Jugar con filtros o params
sidebar_position: 1
---

## Acerca de




Luego hay opciones de busqueda en los aplicativos y hay filtros que están deshabilitados o inexistentes en el HTML. Pero se les olvida que se pueden interactuar con ellos en el backend.

Ejemplo:

Una petición "natural" o esperada tipo:

```http
GET /api/users?search=a
```

Y te salen los usuarios que tienen la letra a, pero supon que en el dashboard hay un "status" y todos dicen Activated. ¿Y si pruebas mandar ese parametro y ver otro tipo de status?

```
GET /api/users?status=[LO QUE SEA]
```

Dentro del valor de status podriamos probar estados que no vemos a nivel frontal pero existen, tipo cuentas eliminadas con datos sensibles o pendientes, etc...

```
disabled
deactivated
eliminated
erased
deleted
pending
removed
<ETC>
```
   

> DE QUE CAMBIAR ?search= por ?status=, aunque no venga en el html intentar eso y ver si se pueden ver cuentas deshabilitadas o algo interesante

Tambien puedes concatenar otros parametros que veas por ejemplo si ves un `org_id` tira un

```
GET /api/users?status=deleted&org_id=uuid
```