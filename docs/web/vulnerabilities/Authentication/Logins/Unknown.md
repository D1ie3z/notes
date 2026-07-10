---
title: Content discovery behind a dead host
sidebar_position: 1
---

## Unknown host redirect

Hay muchas veces que cuando entras a un sitio te redirige de lleno a otro sitio el cual te pone el tipico "An Unknown error ocurred".

Es decir:

> Entras a sitio.com y cuando carga al final te lleva de forma directa a internal-dev.com, internal-dev.com es el que da error porque no lo podemos resolver.

Para eso hay que hacer el analisis previo de las redirecciones existentes para llegar a ese punto.


```bash
curl -i http://sitio.com
HTTP 1.1/ 302 Found
Location: auth.sitio.com
```

Haciendo esto podemos ver que sale un tal `auth.sitio.com` el cual no veiamos por la redirección directa que se hace a `internal-dev.com`

AQUI HAY QUE HACER FUZZING A AMBOS SITIOS PARA VER QUE TIENEN, QUITANDO EL CODIGO DE REDIRECCIÓN

```
http://sitio.com/FUZZ
http://auth.sitio.com/FUZZ
```

Haciendo esto probablemente dentro de auth o el mismo sitio salgan paginas tipo `/admin`, que no podiamos ver por la redirección principal.
