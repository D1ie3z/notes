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

### Typosquatting
Typosquatting (o "cybersquatting tipográfico") = registrar dominios que son errores de tipeo probables de un dominio legítimo, para interceptar a los usuarios que cometen esos errores.
El fundamento es un hecho humano simple: la gente escribe mal. Estudios de tráfico muestran que errores comunes como gogle.com (falta una 'o') reciben tráfico real de personas que intentaban ir a Google.

Ejemplo:
```
Legítimo:    google.com
Typosquat:   gogle.com       (letra omitida)
             googel.com      (transposición)
             gooogle.com     (letra duplicada)
             goog1e.com      (letra → número)
             g00gle.com      (letras → números)
             google.co       (TLD incorrecto)
             google.com.mx   (si el objetivo es otro país) 
```
También existe el combo squatting: errores en subdominios o rutas (google.com.evil.com — el dominio real de Google seguido de un dominio del atacante; ojo con leer URLs de derecha a izquierda en el dominio).

OJO PIOJO. Está técnica tiene riesgo:

- Los filtros ya la anticipan
Las soluciones de seguridad (gateways de email, secure web gateways, navegadores) llevan años manteniendo listas de dominios typosquat de marcas populares:

    - gogle.com, facebok.com, paypa1.com → bloqueados por defecto en muchas corporaciones.
    - Algoritmos de similitud de cadenas (como la distancia de Levenshtein) calculan qué tan parecido es un dominio a uno conocido y lo bloquean si la distancia es muy corta.

En la práctica moderna, el typosquatting puro ha perdido fuerza como vector principal de phishing por todo lo anterior. Sin embargo, sigue siendo relevante en escenarios:

- Marcas pequeñas o regionales: una empresa local o un proveedor pequeño (¡conexión con el apartado de Supplier Impersonation!) no monitorea sus variantes typosquat. empaquesdelnorte.com → empaquesdelnorte.com con errores pasa desapercibido.
- Errores en el remitente, no en el enlace: el dominio se usa para suplantar remitente (facturas@gopgle.com), donde el filtro anti-spoofing (SPF/DKIM) es la única defensa y muchos dominios no lo tienen bien configurado.
- Punycode / homoglifos: variante evolucionada — usar caracteres Unicode que se ven idénticos (una 'а' cirílica en lugar de 'a' latina): аррle.com. Muchos navegadores ya mitigan esto, pero es la versión moderna del concepto.
  
> Resumen: el typosquatting aposta a los errores humanos de escritura, pero es una de las técnicas mejor defendidas, es útil solo contra objetivos sin monitoreo o como capa de suplantación de remitente.

Checate we https://typosquatting-finder.circl.lu/

### TLD Confusion

Rapido juega con el .com, .ca, .net, etc...

Pues hay empresas que usan otros TLD's entonces jala:
```
typosquat:    empreza.com/login        (nombre mal escrito, más fácil de notar)
TLD confusion: empresa.co/login         (nombre perfecto, solo TLD distinto)
```
> Nota: Algunos TLDs (.tk, .ml, .ga — gratis o muy baratos) tienen fama de abuso, pero otros (.co, .net, .org, TLDs de países como .ca, .in) son perfectamente respetables y pasan filtros básicos.

Variantes

| Tipo                           | Ejemplo                                               | Contexto                                           |
| ------------------------------ | ----------------------------------------------------- | -------------------------------------------------- |
| **Mismo nombre, TLD distinto** | `empresa.co` vs `empresa.com`                         | La variante del texto                              |
| **TLD de país relacionado**    | `empresa.com.mx` vs `empresa-mx.com`                  | Confusión con geolocalización                      |
| **TLD con typo**               | `empresa.co` vs `empresa.cm` / `empresa.om` (omisión) | Typosquat híbrido                                  |
| **TLD "moderno" creíble**      | `empresa.app`, `empresa.cloud`                        | Los TLDs nuevos parecen legítimos por ser modernos |

De igual forma pues una empresa madura monitorea esas variantes.

### Abusando de los subdominios (Benditos SaaS)

Con la adopción masiva de SaaS, muchas plataformas asignan a cada cliente un subdominio propio en el dominio del proveedor. El ejemplo es Okta:
```
empresa-a.okta.com
empresa-b.okta.com
tuempresa.okta.com
```

> Esto es estándar en: Okta, Microsoft (login.microsoftonline.com/tenant), Workday, Salesforce (empresa.salesforce.com), Freshdesk, etc.

¿Por qué es relevante para phishing?
El problema de confianza heredada: cuando un empleado ve un enlace como:

```
https://tuempresa.okta.com/...
```

Nosotros no podemos crear subdominios dentro de okta.com (no es nuestro). Pero sí podemos hacer dos cosas:

- Registrar nuestro propio dominio y crear un subdominio con el nombre de la victima:

```
Dominio del atacante:  evil.com
Subdominio creado:     tuempresa.evil.com
```

- Usar un servicio en la nube que dé subdominios gratuitos

```
tuempresa.pages.dev
tuempresa.azurewebsites.net
tuempresa.workers.dev
```

En ambos casos, el enlace contiene el nombre de la empresa objetivo en un subdominio. Y como el filtro de seguridad no puede bloquear todo lo que lleve ese nombre (porque bloquearía también los accesos legítimos de Okta), el enlace pasa la barrera.

Resumen en 3 líneas
- Los SaaS como Okta hacen normal que el nombre de una empresa aparezca en un subdominio.
- Eso anula la defensa: los filtros no pueden bloquear por el nombre de la empresa sin dañar servicios legítimos.
- Nosotros aprovechamos ese hueco poniendo el nombre de la víctima en subdominios de nuestros propios dominios o servicios cloud para que el phishing parezca una puerta de entrada corporativa legítima.

## Certificados SSL

Reputación, esa palabra basicamente es la que abarca el phishing. El tipo de certificado SSL también tiene reputación.

> No todas las CAs pesan igual

### Las CA gratuitas

Let's Encrypt es la más famosa: emite certificados gratis, automáticamente y sin verificar quién eres. Solo demuestras que controlas el dominio (con un proceso automatizado de 2 minutos).
Esto fue revolucionario para internet (HTTPS para todos), pero tiene un lado oscuro:

- Un atacante puede tener un certificado válido en 5 minutos, sin pagar, sin identificarse, sin ningún humano revisando nada.
- Por eso, el tráfico HTTPS de certificados gratuitos es estadísticamente mucho más abusado que el de CAs pagas.

## Las CA pagas (comerciales)
Certificados de DigiCert, Sectigo, GlobalSign, etc. cuestan dinero (desde ~$50 hasta cientos de dólares al año) y a menudo incluyen verificación de la organización (te piden documentos, verifican que la empresa existe). Emitir uno requiere esfuerzo e identidad → el atacante deja rastro y gasta dinero.

Los productos de seguridad (EDR, SIEM, proxies, gateways) pueden configurar una alerta del tipo:

> "Un equipo interno se conectó a un sitio que usa certificado de Let's Encrypt y el dominio tiene menos de 30 días"

**Ojo con la lógica**: esto no significa que todo sitio con Let's Encrypt sea malicioso (millones de sitios legítimos lo usan). Significa que es un factor más que sube la puntuación de riesgo. Combinado con otros indicadores (dominio recién registrado, ASN barato, palabras clave sospechosas...), ayuda a priorizar qué revisar.

¿Entonces qué hago?

|                        | Certificado gratis          | Certificado pago                      |
| ---------------------- | --------------------------- | ------------------------------------- |
| Costo                  | \$0                         | ~\$50-500/año                         |
| ¿Identidad verificada? | No                          | Sí (al menos el dominio/organización) |
| Señal para los filtros | "Más probabilidad de abuso" | "Parece más serio"                    |
| Esfuerzo de emisión    | 5 minutos, anónimo          | Requiere pago y datos                 |

Si tu dominio ya es neutro, con ASN limpio y registro pagado, el certificado pago es la última capa de "legitimidad": quita un indicador que los defensores usan para priorizar. El conjunto completo dice "esto parece un negocio real establecido", no "esto parece algo montado ayer". (Pues si es más costoso pero vale la pena invertir para que sea más legitimo

Ole lo caracole: https://www.namecheap.com/security/ssl-certificates/

Sino que sabes que show:

| Tipo                             | Qué verifica                                                                  | Precio aprox. en la imagen | Lectura de un defensor                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| **DV (Domain Validation)**       | Solo que controlas el dominio (automático, sin humanos)                       | C\$15-49                   | "El mínimo posible" — casi igual de anónimo que Let's Encrypt, pero emitido por CA paga |
| **OV (Organization Validation)** | Que la **organización existe**: piden documentos legales, dirección, teléfono | C\$49-71                   | "Alguien verificó que esta empresa existe" — señal más fuerte                           |
| **EV (Extended Validation)**     | Verificación profunda de la empresa (registros, operación, reputación)        | C\$105                     | El nivel máximo; antes mostraba el nombre de la empresa en verde en el navegador        |


> Resumen: el emisor del certificado SSL es visible y tiene reputación; los filtros de seguridad tratan los certificados gratuitos (Let's Encrypt) como un factor de riesgo adicional, por eso se recomienda certificado pago como una capa más de legitimidad aparente (OV/EV).

## Phishing Files

### Public templates

En GitHub y foros hay repositorios con plantillas de phishing listas para usar: páginas de login falsas de Microsoft, Google, O365, etc. Herramientas conocidas (como las que usan kits de phishing) traen estas plantillas integrada.

El problema: "highly signatured" (muy firmadas). Una firma (signature) es un patrón único que las soluciones de seguridad usan para identificar algo conocido. Piensa en el antivirus: no solo detecta "virus en general", detecta el hash exacto o cadenas de texto específicas de malware conocido.

Con las plantillas públicas pasa igual. Una plantilla de "login de Microsoft" que 10,000 personas descargaron de GitHub tiene:

- El mismo HTML (mismo código, mismos IDs de elementos, mismos comentarios)
- Las mismas imágenes (mismo logo, mismo favicon — con el mismo hash)
- El mismo JavaScript (mismo orden, mismas funciones)
- A veces hasta el mismo texto con errores de traducción o typos

Todo eso es "firmable". Un sandbox, un proxy con detección de phishing o un equipo de threat intel solo necesita:

- Analizar una vez la plantilla pública → extraer sus firmas (hashes de archivos, cadenas únicas como id="loginFormM365", URLs de recursos).
- Revisar cualquier sitio nuevo → ¿coincide alguna firma? → bam, detectado en milisegundos, sin análisis de comportamiento.


Ejemplo: si la plantilla incluye una imagen logo.png con hash SHA256 abc123..., y esa misma imagen aparece en el sitio que estás analizando, el defensor sabe que usaste ese kit — aunque hayas cambiado el dominio, el ASN y el certificado. Una sola firma quema toda tu infraestructura nueva.

La recomendación:

Hacerla desde cero = nuevas firmas. El HTML es tuyo, las imágenes son tus propias capturas procesadas, el CSS es distinto. Los filtros ya no pueden compararte con la plantilla pública conocida. Conecta con todo el módulo: personalización = supervivencia.

### Sitios clonados

Ya lo puse en requisitos, literalmente clona un sitio jaja.

El pedo:

Se detecta facil.

- Firmas de contenido idénticas al original.
El clon es una copia bit a bit del sitio real. Los defensores de Microsoft tienen firmas exactas de sus propias páginas. Tu clon coincide con la firma del original + tu dominio es nuevo ≠ microsoft.com = contradicción flagrantemente sospechosa: "¿por qué la página exacta de Microsoft está hospedada en login-ms365-verify.net con 12 días de edad?".
- Ruido técnico del clonado.
Las herramientas de clonado dejan huellas:

    -  URLs rotas (recursos que no se descargaron: https://original.com/asset.js apuntando al sitio real desde tu dominio falso)
    - Código sobrante (scripts que llaman a dominios legítimos, comentarios del CMS original)
    Estructura de archivos característica de la herramienta de clonado

- Los defensores de marcas grandes cazan activamente.
Gmail, AWS, Outlook son los más clonados del mundo → tienen los sistemas de detección más entrenados precisamente para réplicas de su contenido. El texto dice que "upcoming modules" mostrarán métodos de detección vía clonado — casi seguro incluirán comparación de firmas, detección de recursos externos, y análisis de similitud de DOM.

La recomendación:

```
Réplica exacta del login de Microsoft  → máximo convencimiento, máxima firma
Página genérica sin branding           → mínima firma, pero la víctima no entiende qué pedir
Página con estilo PROPIO que sugiere Microsoft → buen equilibrio
```

| Opción                          | Detección por firmas   | ¿La víctima entiende? | Veredicto       |
| ------------------------------- | ---------------------- | --------------------- | --------------- |
| Plantilla pública de GitHub     | ☠️ Instantánea         | ✅                     | Descartar       |
| Clon exacto de Microsoft        | ☠️ Alta (marca cazada) | ✅                     | Descartar       |
| Clon de una marca pequeña/rara  | ⚠️ Media-baja          | ✅                     | Viable          |
| Custom "similar pero diferente" | ✅ Baja                 | ✅                     | **Recomendado** |

> Resumen: plantillas públicas y clones exactos están firmados y cazados; la vía es desarrollar contenido propio que comunique la misma intención (entra con tus credenciales Microsoft) con código, imágenes y estructura únicos.

