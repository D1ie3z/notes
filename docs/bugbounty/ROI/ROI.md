---
title: ROI
sidebar_position: 1
---

## ¿Que carajo con esto?

ROI (Return of invesment), retorno de la inversión, que valga la pena lo que encontramos y hacemos basicamente. Aquí veremos basicamente que estrategia necesitas dentro de la industria del bug bounty para maximizarlo (o eso creo he escuchado de los que viven de este show)

## Extrapolación

Esto pasa cuando encuentras una vulnerabilidad y encuentras muchas vulnerabilidades similares y empiezas a ordeñar esa vulnerabilidad.

Un bug es un error que encuentras porque el desarrollador se equivoco, y la mayoria de las veces es porque no entendieron el flujo completo, el modelo de amenazas completo, el impacto completo de sus acciones y si no lo entendieron ahí, hay **mucha probabilidad** de que se presente en otros flujos.

### Hazte estas preguntas:

#### ¿Donde ocurrio este hallazgo?
- ¿Hay algo acerca extraño de esta app?
- ¿Es la seccion?¿La escribio un pasante?
- ¿La url o el path no se implemento correctamente?
- ¿Es un problema de estructura? Por ejemplo: Si desactivas una funcion. Desactivas una pagina HTML que hace referencia a una función (permission switch), péro aún puedes acceder al endpoint final de la api de esa función y obtener los datos de esta. (O sea desactivas el front pero los endpoints del API siguen vivos aunque lo desactives. (Esto es un problema del sistema))
- Busca cualquier configuracion que desactive el acceso a las paginas HTML y luego accede a esos puntos de la API para obtener los datos "restringidos" "deshabilitados"
- Busca recursos adyacentes / similares a lo que encontraste con ese bug.
- Otro ejemplo: Imagina que encuentras una vulnerabilidad en firmar documentos. ¿Puedes encontrar una vulnerabilidad en la cadena que se utiliza para revisar eso? ¿Puedes encontrar una vulnerabilidad para eliminar autorizaciones de documentos firmados?

#### ¿Por qué ocurrio este error?
- ¿Problemas de regex? Pues mira más por ahí
- ¿Problemas de sanitización? Pues busca más por acá
- ¿Problemas de permisos? Pues ve más por ahí

#### ¿Cuando o quien hizo este hallazgo?

- Es open source? Entonces averigua al dev que lo escribió y revisa su código porque talvez malinterpreto algo
- Pasó por que la función se lanzó hace un día? Si es así pues debo entonces estar atento y monitorear esto
- Encuentra commits similares por la fecha o por el mismo desarrollador


### Ejercicio de extrapolation :)

- Toma una vulne que encontraste y aplica "Cuando / Donde / Como / Quien"
- Y hazte esas preguntas previas para ver si lo puedes ordeñar en otros lados :)

## Usa sus armas contra ellos
Ya lo he dicho RTMF (read the fucking manual), lee bien la documentación y ponte perro a que me refiero con esto.

Amazon constantemente piensa que las omisiones de control parental son medias o bajas, pero se niegan a actualizar su política para decir eso, así que si lees aquí (amazonvrp-devices). Y si lees que es una vulnerabilidad alta en estos dispositivos. Dice vulnerabilidades que permiten eludir funciones de seguridad básicas, como sandbox, modificación de privacidad, la instalación de aplicaciónes o **la omision de control parental**, están incluidas. 

- https://hackerone.com/amazonvrp-devices?type=team

Entonces justo ahí dice si lo bypasseas, no importa de que forma o si de manera completa solo dice bypass de control parental y punto. O sea con bypassear un solo aspecto de control parental funciona.

Por lo cual, si consigues hacer eso de cualquier forma pues tienes tu alta y mira :). Minimo 2k ahí van. (Si es una vulne ahora imagina que sea de forma masiva)

> De todos modos, asegurate de leer detenidamente el alcance y pensar en ello como hacker. Si algo parece extraño o no te hace sentido, infórmate bien, porque amazon ha querido muchas veces no pagar altas por esto, pero como está dentro de la política, hackerone los obliga a hacerlo! :D Toma evidencia de lo que dice por si lo quieren cambiar jaja :)

## Tiempo invertido

No quiero dar una respuesta final a todo esto pero creo que va a depender mucho de tu mood y lo que quieras. Me mama este show y desgraciadamente no puedo hacerlo al menos a esta fecha sin dejar a lado mis responsabilidades (que implican dinero, puto sistema caca), entonces pues el ROI tambien depende de tu meta.

Por ahí leí "fijate que tanto vale la pena en bypassear esa cosa por la paga que dan", y dejame decirte que tiene razón ese comentario si es que este show lo ves como tus ingresos para vivir precisamente (el bug bounty). Porque claro que si le inviertes 3 días o más a un bypass o X vector para ganar 300USD y tu renta esta en 700 USD, pues... que tanto ROI hay ¿Me explico? No estoy diciendo vete por las vulnes "faciles" o no te esfuerzes solo ten encuenta esto para evitar la frustación / decepción jajajaja.

### A que voy

- Si tu meta es pagar cuentas pues ve por programas que paguen rapido y más o menos bien.
- Si tu meta es estudiar un dispositivo o tecnología, pues le dedicaría más tiempo a lo que me puede aportar de conocimiento, eso tambien es ROI
- Si puedes dedicarle tiempo completo a un target que paga 30k la critica pero pasaste 7 meses en el ve cuanto puedes hacer en esos 7 meses o sea si con vulnes similares otros programas te dan a lo mejor 3k USD por 10 vulnes así (no se un access control por decir algo), pues ve que te da más reputación.
- Si quieres mejorar tus ataques para tu trabajo o probar técnicas, pues tambien justo ve que target es rentable para ti, si quedarte en uno para aprender su arquitectura compartida o ir con varios para aprender nuevas tecnologías y vias de ataque.
- Y pues si quieres sacar el bug historico 70k+USD pues de igual forma si es rentable para ti dale.

Basicamente ve cómo inviertes tu tiempo para que sea rentable para ti. Todo depende de tus metas, y a la par no dejes que las empresas se aprovechen de ti, yo te aconsejo pa que no te frustres y lo dejes.





