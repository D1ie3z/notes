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

