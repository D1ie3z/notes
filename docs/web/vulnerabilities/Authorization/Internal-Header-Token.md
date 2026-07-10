---
title: Internal Header Token as Alternative Authentication
sidebar_position: 1
---

## Acerca de

Pues luego se nos pasa por las malas notas que llevamos o las horas invertidas jaja.

Pero recuerda siempre siempre reusar valores y entender donde se pueden usar.

Ejemplo:

Ponle que accediste a un config o te encontraste un repo en github que tiene un commit que tiene esto:

```json
{
    "version":"10.2.1",
    "service":"kubernetes",
    "svc_tk":"svc_3fE404-DF46_ERT4"
}
```

Prueba ver si puedes usar o mandar headers personalizados o ver como carajo funciona el app, usualmente luego hay documentación que te explica como funciona, tipo:

```
GET /api/check/health
X-Internal-Service-Token: (VALUE)
```

En ese `X-Internal-Service-Token:` puedes probar el valor de `"svc_tk":"svc_3fE404-DF46_ERT4"` o sea:

```
GET /api/check/health
X-Internal-Service-Token: svc_3fE404-DF46_ERT4
```

Y puede que jale y puedas consumir información interna con ese token :))