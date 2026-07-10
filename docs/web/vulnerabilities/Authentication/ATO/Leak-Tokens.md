---
title: Leaked Tokens
sidebar_position: 1
---

## ¿Por qué?

Muchas veces hay tokens que no caducan por lo mal configurados que están o son estaticos, puedes buscar:

- Rutas en APIs `/api/user/token?id=1` el uno puedes ver si hay un all o un * o si hay más rutas.

- Indexados en el navegador o wayback machine

- En alguna ruta de logs o servicios SMTP que mandan tokens, pero no llegan porque el SMTP está mal configurado entonces en esos logs se guardan tokens.

Tambien puedes:

- Ver si el token puede restablecer otras cuentas

- Ver si tu token puede restablecer otras cuentas


### Chain vulnerability example

Ponle que puedes mandar un reset password y tienes acceso al app que tiene un IDOR y en el response se guardan los reset tokens

Es decir

1. Solicitas el reset password
2. Ponle que tienes un IDOR y puedes ver en el reponse la info de los users algo así:

```json
{
    "name":"cachirula",
    "company":"sexmex",
    "email":"megustaelpito@gordo.com",
    "reset":"r90UF9Fdsf04586"
}
```

> Originalmente ponle que esta un `"reset":null`, pero al solicitar el reset token se crea ese token.

3. Ve si puedes usarlo en algo tipo `/api/user/resetPassword/r90UF9Fdsf04586` (pones el valor del token que se crea), o si se manda en un POST o así.

> Ve como se comporta la aplicación