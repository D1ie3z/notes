---
title: Explicacion
sidebar_position: 1
---

## Explicación

No fue suficiente el poner solo las bases master of puppet...

¿Qué es cada cosa?

## Infraestructura

> Cómo elegirla y que tener en cuenta

### Localización geografíca
Al seleccionar la infraestructura, lo ideal es elegir un centro de datos ubicado en el mismo país o región que el objetivo, ya que la dirección IP subyacente del dominio puede ser analizada por un producto de seguridad. 
Sin embargo, si se elige estratégicamente, también se puede utilizar infraestructura de otros países. 
Es importante evitar países o regiones con baja reputación que puedan generar sospechas o activar alertas de seguridad, lo que garantiza que el sitio web parezca más legítimo y confiable.

### ASN

Un ASN, o Número de Sistema Autónomo, es un identificador único asignado a cada red en internet. 
Los Sistemas Autónomos (AS) son grandes conjuntos de direcciones IP bajo el control de uno o más operadores de red que presentan una política de enrutamiento común y claramente definida a internet. 
Básicamente, un ASN se utiliza para llevar un registro de a qué red pertenece cada dirección IP y para controlar el enrutamiento del tráfico de internet entre diferentes redes.

El filtrado de ASN es un método que se utiliza para bloquear un amplio rango de direcciones IP, dirigiéndose a sistemas autónomos completos, en lugar de bloquear direcciones IP individuales o rangos pequeños. 
Por ejemplo, una organización puede bloquear el AS40401, asociado a malote.com; por lo tanto, al bloquear este ASN se bloquearán miles de direcciones IP pertenecientes a Malote.

El filtrado de ASN es una medida de seguridad eficaz, ya que se ha identificado que algunos ASN albergan una cantidad desproporcionada de contenido malicioso, 
y filtrar el tráfico procedente de estos ASN puede reducir significativamente el riesgo de amenazas originadas en estas redes.

En nuestro caso, al seleccionar la infraestructura, debemos elegir una infraestructura con direcciones IP que no formen parte de un ASN conocido por su actividad maliciosa y,
por lo tanto, que también sea filtrado con frecuencia.

### Sitios de confianza

Los filtros de seguridad evalúan qué tan "confiable" es un dominio. 
Un dominio como azurewebsites.net tiene años de historia, millones de usuarios legítimos y una empresa gigante (Microsoft) detrás.

Es decir si tu usas un dominio nuevo es más probable que sea flageado si usas sitios confiables o de confianza con buena reputación, es más problable pasarte esos filtros.

| Servicio                     | Subdominio que da               | Por qué es atractivo                   |
| ---------------------------- | ------------------------------- | -------------------------------------- |
| **GitHub Pages**             | `usuario.github.io`             | Dominio muy conocido, HTTPS gratis     |
| **Cloudflare Pages/Workers** | `*.pages.dev`, `*.workers.dev`  | CDN confiable, difícil de bloquear     |
| **Google Sites / Firebase**  | `sites.google.com`, `*.web.app` | Reputación de Google                   |
| **Netlify / Vercel**         | `*.netlify.app`, `*.vercel.app` | Despliegue en segundos, SSL automático |
| **Microsoft Azure**          | `*.azurewebsites.net`           | El ejemplo de tu texto                 |
| **Canva / Notion / Dropbox** | Enlaces compartidos             | Plataformas de colaboración legítimas  |
| **URL shorteners**           | `bit.ly/...`                    | Encubren el destino final              |

Puedes usar: https://lots-project.com/ para apoyarte

### Infraestructura comprometida

¿Sabes hackear? Pues utiliza un server comprometido y ahí hostea tu phishing ;)

### Evita usar IPs abusadas
Ve la reputación de la IP antes de hacer tu phishing, si está flageada GG estará en una blacklist.

## Dominios

### Seleccionar

El dominio es lo primero que una víctima potencial ve en un enlace:

```
https://o365login.com/verify
       └──────┬──────┘
      Aquí está el pedo
```
El texto identifica dos fuerzas opuestas:

| Fuerza                                 | Qué pide                                                     | Ejemplo                                |
| -------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| **Decepción (engañar a la víctima)**   | Que el dominio parezca legítimo, relacionado con el servicio | `o365login.com`                        |
| **Subtleza (evadir a los defensores)** | Que no despierte sospechas ni activables alertas             | `secure-mail-portal.com` o algo neutro |

Un dominio como `o365login.com` gana en el primer frente pero pierde en el segundo. 
Un dominio como `xn--pple-43d.com` (punycode, otro tema) gana en el segundo pero puede confundir a la víctima.

¿Por qué o365login.com funciona (y por qué falla)?

Por qué engaña a las víctimas:

- Contiene palabras clave reales: "o365" (Office 365) + "login".
- El TLD .com es el más reconocido y "normal" del mundo. Un .xyz o .top genera más sospecha en usuarios cuidadosos (aunque esto va cambiando).
- Una víctima apurada que lee el enlace rápidamente ve "o365" y "login" y su cerebro completa: "página de Microsoft".

Por qué es detectado fácilmente:
- Detección por palabra clave (sin siquiera visitar el sitio)
Los filtros de email, proxies y plataformas de seguridad revisan el texto del enlace que llega en el correo. Si el dominio contiene:

    - o365, office365, microsoft
    - password, reset, login, verify, secure, account

El filtro lo marca antes de que nadie haga clic. Esto es crítico: la detección ocurre en el enlace, no en el sitio. Un dominio recién registrado con "microsoft" en el nombre es sospechoso por definición, porque Microsoft no necesita registrar dominios nuevos llamados microsoft-soporte.com.
- Los sujetos con experiencia lo van a cachar...
Investigadores y analistas SOC que ven passwordreset.xyz en un log:
    - Dominio recién registrado (se puede verificar con whois en segundos).
    - Contiene "passwordreset" → intención evidente.
    - TLD .xyz barato y frecuentemente abusado.
    - Conclusión en 10 segundos: phishing. Reportar, bloquear, listo.

> Entonces ¿Qué hago?

- Dominio neutral o ambiguo

| Tipo de dominio                | Efecto en la víctima                          | Efecto en los defensores            |
| ------------------------------ | --------------------------------------------- | ----------------------------------- |
| `microsoftaccountaccess.com`   | Muy convincente                               | Banderas rojas por todas partes     |
| `mail-session-portal.com`      | Razonablemente convincente                    | Ambiguo: podría ser legítimo        |
| `bluesky-events.com` (neutral) | No dice nada por sí solo, pero tampoco asusta | Nada que detectar por palabra clave |

> ¿Pero cómo engaña un dominio neutral a la víctima? Aquí está el truco que complementa lo anterior:

- El dominio neutro pasa los filtros de palabras clave.
- El contenido de la página (logo de Microsoft, diseño idéntico al login real) hace el trabajo persuasivo, no el nombre del dominio.
- Muchas víctimas ni leen el dominio completo; ven el candado y el diseño familiar.

O sea: con infraestructura bien armada (ASN limpio, SSL válido, dominio neutro), el phishing se apoya en la superficie visual para convencer, y deja el dominio como un "sobreviviente" de los filtros.

Además los dominios con palabras sospechosas cómo las que ves los cacha DNS hunting.

Resumen: un buen dominio de phishing no intenta convencer, intenta no delatarse. La persuasión la hace la página; el dominio solo tiene que sobrevivir los filtros.

### Proveedores y suplantar su identidad

Esto aquí y en todos lados es master class. Los proveedores del cliente que estamos atacando.

Ejemplo concreto de la lógica

- Durante el reconocimiento (OSINT) sobre la empresa objetivo, descubres que trabaja con:
  - Un proveedor local de embalajes: "Empaques del Norte" (empaquesdelnorte.com)
  - Un servicio de mensajería: "RápidoExpress" (rapidoexpress.com)
  - Un software de nómina: "NóminaSoft"
- En lugar de registrar empresaobjetivo-facturas.com (suplantar a la víctima directamente), registras:
  - empaquesdelnorte-facturacion.com
  - rapidoexpress-seguimiento.com
  - nominasoft-actualizacion.com
- Envías correos desde esos dominios falsos hacia la empresa objetivo.

Es decir:

| Tipo de suplantación                                          | Qué defensas tiene la empresa objetivo                                                                                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Directa** (alguien finge ser la propia empresa o Microsoft) | DMARC/SPF/DKIM configurados, listas negras de dominios de marcas, filtros de "microsoft", "login", "password", capacitación específica: "desconfía de correos que pidan tu contraseña" |
| **De proveedor** (alguien finge ser el proveedor de cajas)    | Casi nada. Nadie configuró DMARC por `empaquesdelnorte.com`. Nadie capacitó a los empleados sobre él. El nombre no aparece en ninguna lista negra                                      |

Y por qué está chulo no solo en ¿phishing?

- La empresa controla su propia reputación de correo, pero no puede configurar los dominios de sus proveedores (eso es responsabilidad de cada proveedor).
- Los proveedores pequeños (una imprenta local, un taller, una mensajería regional) rara vez tienen defensas de correo bien implementadas: SPF mal configurado, DMARC inexistente → cualquiera puede enviar correos "de ellos" desde un dominio similar.

Aquí está el factor psicológico, quizá el más potente:
> El vínculo ya existe. Los empleados de la empresa objetivo:

- Ya reciben correos legítimos del proveedor (facturas, órdenes de envío, avisos).
- Reconocen el nombre y no lo asocian con peligro.
- El correo llega dentro de un contexto laboral esperado: "llegó la factura del proveedor de cajas" → normal, rutinario.
- Un correo de "empaques del norte" pidiendo "confirmar datos de pago para liberar tu envío" no activa las mismas alarmas mentales que uno de "Microsoft" pidiendo contraseña.

> Resumen: en lugar de suplantar a la empresa objetivo (fuertemente defendida), se suplantan a sus proveedores (casi indefendidos), explotando la confianza laboral existente y la asimetría de defensas.
