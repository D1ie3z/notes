---
title: Side Channel Data Leaks
sidebar_position: 1
---

## Acerca de

Pelorero a la BOLA (Broken Object Level Authorization), okay okay ya entendimos:

- Hacer cosas que no deberías
    - crear
    - editar
    - borrar

¿Qué chingao con el Data Leak?

Muchas veces el impacto de una vulnerabilidad no depende en si puedes crear, borrar o eliminar, luego esos BAC se van para low o medium. Entonces ¿Cómo lo vendo 10?

Pues no se trata de vender, pero checate en tus responses.

Ejemplo:

> Supon que estás pegando algo cómo el SAT o una app de negocios

Al crear una solicitud, la API acepta un `userId` y un `citaId` de cualquier organización sin validación. La respuesta incluye los datos de la cita completa, con comentarios y otra información sobre esa cita. La vulnerabilidad no radica únicamente en la posibilidad de crear la cita cómo cualquier pesona, sino en que pon tú que la respuesta filtra datos de una organización totalmente distinta.

Ponle que mandas una request con un ID que ya existe

```http
POST /api/cita
Host: citas.cliente.com


{"userId":"123","citaId":"55"} //EN ESTE CASO 55 ya existe
```

Response en cuestión

```http
201 Created


{"DATOS SENSIBLES O DATOS DE OTRA CITA DE OTRA EMPRESA QUE TAMBIEN USA EL APP"}
```