---
title: Registration via Content Discovery 
sidebar_position: 1
---

## Me los andas repitiendo mi 10

Eh we trato de darle orden y ponerlos por casos, puse separado el de Unknown porque quería hacer enfasis en ese analisis, este de content discovery es más general.

Ponle que no tienes cuenta y no puedes acceder, que ya viste leaks y fuerza bruta uyuyuy y nomas no, pues lo primero que tienes que hacer es... ¿Me puedo registrar o crear una cuenta?.

### Javascript

Lo primero de todo antes de andar como perra loca tirando escaneos, revisa el JODIDO Js, a mí como me pendejeaba sabroso la c4bra XD y jodidamente tiene razón, da hueva, pero ahí están los endpoints. Tengo notas tambien para revisarlos lo mejor posible.

Dentro de los js luego vienen tipo

```js
var = https://sitio.com/registro_nuevo_2
```

### Fuzzing

Ejemplo si tienes un `user-login` pues fuzzea `user-FUZZ` chance sale un `user-create-account`, `user-signup` etc..

No solo en parametros tipo User, ve si hay formas de crear cuentas para poder revisar la aplicación autenticado.

```bash
ffuf sitio.com/FUZZ //Tengo una sección de fuzzin brother
```

### Via api

Chance y la aplicación no tiene un `sitio.com/registro` directamente, pero se comunica con un `api.sitio.com/v1/user/create` intenta ver si puedes mandarle un post y crear una cuenta.

NO TE TOMES LITERAL LOS SUBDOMINIOS Y DOMINIOS que pongo acá son ejemplo puede que el api este dentro del mismo `sitio.com` pero igual en un path tipo `/v1/user/register`, de igual forma el path es un ejemplo ve probando con otros posibles.


```http
POST /v1/user/register
Host: dominio.com

Content-Type: application/json
{
    "user":"newuser"
    "pass":"newPassword13"
}

```