---
title: Sensitive files with no restriction
sidebar_position: 1
---

## Acerca de

Facil, muchas veces los devs piensan que ya tienen un control de acceso dentro del app y es verdad el USER A no puede hacer ni ver lo del USER B,C,D,etc. Pero muchas de las veces y casi siempre lo he visto la neta, es que no ponen ese control de acceso de donde se guardan los archivos.

Me explico:

Ponle que no puedes acceder a info a nivel de petición de otros users tipo:

```http
403 Forbidden

"No tienes acceso a este recurso putin"
```

Pero ahí te va un pro tip.

> Intenta arrastrar la imagen de perfil de otro usuario en otra pestaña. Usualmente guardan estas cosas en buckets o rutas tipo /static/user/2345/profile-image.png

¿Diras eso que we?

> Prueba quitar el `profile-image.png`

Boom se ven archivos de ese usuario. ¿Y ahora diras esa puta basura que?

> Prueba abrir una pestaña en incognito y si se ve PUM, acceso a archivos de otros usuarios SIN AUTENTICACIÓN

Esto me ha funcionado muchas veces, de que no pues se guarda mi archivo PDF en un s3 de amazón. PTM NO PODRE HACER UNA WEBSHELL :(. Pero AGUANTA, ese s3 se puede acceder sin autenticación, madres ahí se guarda todo lo del app, MADRES hay archivos sensibles. M A D R E S se puede acceder a esto sin autenticación .-. Felicidades brother ahí tienes tu critica.

> Fun Fact así he sacado varias llaves de cloud sin auth y luego salen los Cloud Take Overs XD

Basicamente ve si puedes ver un archivo sin autenticación. ¿Cómo?

- Abre un PDF con esos "View" o "Ver" y pega la URL en una pestaña privada.

- Arrastra las imagenes de perfil en otra pestaña y lo mismo ve si puedes acceder desde una privada sin autenticación y ve moviendote en directorios.

- Ve si puedes acceder a cualquier archivo sin autenticación.

