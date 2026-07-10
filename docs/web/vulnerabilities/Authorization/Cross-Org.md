---
title: Cross-Org
sidebar_position: 1
---

## Acerca de

Poco más de lo mismo ve si puedes ver u hacer o impersonar o lo que sea de otros. **PERO** hay algo curioso acá.

> VE LOS HEADERS PERRIN

¿Los de authorization 10?

Seh tambien, pero mira bien hay veces que apps como grafana u otras en general mandan algo tipo:

```bash
X-Org-Id
X-Grafana-Org-Id
X-Organization-Id
```

Manejan o atan el identificador a nivel de header, ve si puedes consumir info de la organización B teniendo el token de la organización A. ¿Cómo saco los IDs? Crea dos cuentas con las que vas a jugar tilin.

Ejemplo:

Ponle que tienes una API que usa un `/impersonate`, pero esa api te pide que este el `X-Organization-Id` sino no jala.

Con tus cuentas A y B o si encuentras algun `org_id` en el body de las respuestas o algo prueba

```http
POST /api/v2/impersonate
Host: app.pedorra.com
Authorization: Bearer [Token del user A]
X-Organization-Id: [UUID del User B]


{"userId":12}
```

Y si jala MOCOS, puedes impersonar usuarios de otras organizaciones :)







       

