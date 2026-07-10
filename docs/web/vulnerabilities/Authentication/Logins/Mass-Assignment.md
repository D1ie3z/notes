---
title: Mass Assignment
sidebar_position: 1
---

## ¿Qué es?

Basicamente añadir un dato extra que no se manda por defecto en el app. O sea ponle que se manda `user` y `password`, pero hay un dato en el back que acepta `role` entonces le agregas ese `role` y le pones un valor `admin` por ejemplo y te haces admin. (Esto es más un ejemplo de escalación de privilegios ve el de abajo).

Tratar de ver como se guarda un usuario

EJEMPLO
```
The user is pending to aproved

[+] Cuando consultamos el estado de nuestro user ejemplo en /user/id/me

[+] Ver la respuesta 
{
	user: pedro
	id: klj23-oihk12-klasj1
	status: pending // ESTO NO VIAJA EN LA REQUEST PERO MIRA
}

[+] Tratar de registrar un usuario con la bandera status

[+] PETICION ORIGINAL

POST /register

username=pepe&password=pica

[+] PETICION CON MASS ASSIGNMENT

POST /register

username=pepe&password=pica&status=aproved

```

NO SOLO ES STATUS PUEDE SER CUALQUIER OTRO VALOR ANALIZA TU APP, SI TE DA POR EJEMPLO UN `email` chance puedes probar con valores tipo: verified, checked, etc...




