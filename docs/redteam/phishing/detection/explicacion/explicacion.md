---
title: Explicacion
sidebar_position: 1
---

## Explicación

Bien ahora a profundizar un poco con el tipo de detección que hay sobre phishing.

Los escanerés usan esto, pero ojo puede que utilicen otras cosas custom para detectar


### Signature Detection (Detección por firmas)

**Concepto:** base de datos de patrones conocidos. Si el sitio coincide con alguno → flagged inmediatamente.

**Por qué importa:** esto es precisamente lo que hace "quemadas" a las plantillas públicas y los clones. La lista de lo que puede firmarse confirma todo:

Table

|Elemento firmable|Ejemplo de huella|
|:--|:--|
|Contenido (HTML/CSS/JS)|Una cadena única como `class="ms-TextField-field Login"` que solo aparece en el kit X|
|`<title>`|"Sign in to your account" (título idéntico al de Microsoft en dominio ajeno)|
|Favicon|Hash del favicon de Microsoft copiado a tu sitio|
|URLs y paths|La palabra `microsoftonline` en la ruta|
|Meta tags / headers|El `<meta>` característico de la página clonada|
|Certificado SSL|Hash del cert; emisor, fechas|
|Imágenes|Hash del background robado de `login.microsoftonline.com`|
|**Fingerprints**|Hash del body HTML, del favicon, de headers HTTP, del cert SSL|

**Lección clave:** las firmas son **baratas de calcular y rápidas de comparar**. No hay sandbox, no hay análisis sofisticado es comparación literal. Por eso "custom desde cero" era la recomendación.

### Visual Signature (Firma visual)

Aquí es donde el "clon exacto" muere:

- Los sistemas no comparan código; comparan **imágenes**: toman captura de tu página, la procesan (hash perceptual, comparación de layout/regions) y la cruzan con firmas visuales conocidas.

- Ejemplo: si tu sitio **se ve idéntico** al login de Microsoft 365 pero la URL **no es** `login.microsoftonline.com` → conclusión automática: phishing.    

**Nota:** esto no solo detecta clones de marcas, también **plantillas populares**. Si el kit "AwesomePhish v3" tiene un diseño característico, una sola firma visual tumba **todos** los sitios que lo usen, aunque cada atacante haya cambiado dominio, hosting y certificado.

### URL Signature

> Google Safe Browsing (https://safebrowsing.google.com/) analiza URLs contra base de datos de palabras clave.

Ejemplo de que es detectable:

```plain
https://microsoftonline.phishing.com/common/oauth2/v2.0/index.php
https://phishing.com/microsoftonline/common/oauth/v2.0/login.php
```

En ambos, la estructura **imita deliberadamente** la URL legítima de Microsoft (`login.microsoftonline.com/common/oauth2/...`). Los sistemas comparan paths y palabras clave, no solo dominios. Un path idéntico al real sobre un dominio falso = firma de impersonación.

### DNS Hunting

**Concepto:** los defensores no esperan a que el phishing exista, **cazan dominios en el momento del registro**. Pa esto usan la tool https://github.com/x0rz/phishing_catcher

Mecánica:

1. Se monitorean flujos de registros de dominio nuevos (zone files, feeds de registradores, cert transparency logs).
    
2. Scripts buscan keywords: dominios que contengan "google" + "login", "microsoft" + "verify", "salesforce" + "secure"...
    
3. Cada coincidencia recibe un **suspicious score** → se priorizan las más probables.
    

> Phishing Catcher hace exactamente esto: scoring por keywords en nombres de dominio.

**Ejemplo:** un dominio como `salesforce-login-secure.com` puede ser detectado **horas después de registrarse, antes de tener contenido, antes de enviar un solo correo**. Por eso dominios neutros: no hay keyword que cazar.

### URL Filtering

Aquí el texto desglosa todos los "tells" (señales) que un filtro revisa:

| Señal                         | Ejemplo detectable                                                                                                                                          |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Typosquatting**             | `copany.com` vs `company.com`                                                                                                                               |
| **TLD analysis**              | `company.xyz` puntúa bajo si .xyz es TLD frecuentemente abusado                                                                                             |
| **Misspellings**              | errores de ortografía en el dominio                                                                                                                         |
| **Características anormales** | Demasiados subdominios (`mi.cro.soft.login.phishing.com`,`1233253453457546company.com`), demasiados dígitos, puertos no estándar, **acceso por IP directa** |
| **Longitud de URL**           | >54-54+ caracteres = "phishy" según estudios citados, o sea un subdominio muy largo ya es sospecha perrin                                                   |

> **Nota sobre TLD analysis:** `.xyz` descontado porque "comúnmente ven malware usándolo". Los filtros tienen **reputación por TLD**.

> **Nota sobre IP directa:** `https://203.0.113.50/login` sin dominio eso es una altísima señal de alarma (los sitios legítimos casi nunca se acceden por IP en enlaces).

### TLS/SSL Fingerprinting

Esto va más allá del certificado:

> Analizar atributos específicos del protocolo de enlace TLS/SSL, como el orden de los conjuntos de cifrado y las extensiones compatibles.

**Concepto:** cada implementación TLS (OpenSSL, Go, Nginx, Caddy, .NET...) negocia el handshake **en un orden característico** de suites de cifrado y extensiones. Esa secuencia forma una huella única (como JARM, la herramienta de Salesforce para esto).

> JARM es una herramienta activa de huellas digitales (_fingerprinting_) desarrollada por Salesforce que examina las configuraciones TLS de un servidor remoto para identificar aplicaciones o detectar infraestructura maliciosa

**Ejemplo:** **Evilginx2 tiene firma TLS reconocible.** Aunque uses dominio neutro, ASN limpio, certificado EV y contenido custom, si tu proxy inverso es Evilginx2 sin modificar, el handshake TLS **te delata como Evilginx2**.

Las herramientas populares son doblemente riesgosas: firmas de contenido + firmas de protocolo. Y conecta con el punto del SSL anterior: el certificado se ve en claro, **y también el handshake**.

## 7. Domain Reputation & Categorization

**Concepto:** cada dominio tiene un "historial" que los servicios de reputación calculan:

- **Pagerank global/por país** (popularidad, autoridad)
    
- **Tráfico estimado**: visitas diarias, pageviews, duración de visita
    
- **Distribución geográfica del tráfico**
    
- **Referencias en redes sociales**
    
- **Categoría** del sitio (¿qué es? ¿para qué se usa?)
    
- **Edad del dominio** (¿días? ¿años?)
    

 Un dominio de 15 días, con cero tráfico, cero referencias sociales, sin categoría, y con un pico repentino de visitas desde un país específico tras una campaña de correo... **ese perfil grita phishing**, aunque técnicamente todo esté "bien" configurado.

> **Resumen:** la reputación no se configura, se **construye con tiempo** o se **hereda** (de ahí compromised infrastructure y aged domains).

## 8. Server Characteristics

El servidor también es analizado:

| Característica          | Qué revisa                                                                                           |
| :---------------------- | :--------------------------------------------------------------------------------------------------- |
| **IP reputation**       | ¿Esta IP envió spam o distribuyó malware antes? (por eso "IP quemada" = mala)                        |
| **Server location**     | Países con alta tasa de abuso cibernético = mayor escrutinio                                         |
| **Server provider**     | ¿Bulletproof hosting? ¿Proveedor que ignora abuse reports? (conecta con los ASN)                     |
| **Passive DNS history** | ¿Qué dominios apuntaron a esta IP antes? Si hubo dominios maliciosos anteriores, la IP está manchada |

**Passive DNS:** los defensores consultan históricos de DNS y ven **toda la genealogía** de una IP. Por eso el material insistía tanto en ASN limpio: una IP con historial limpio en un ASN decente hereda esa confianza.

## 9. OCR Detection

**Concepto:** algunos atacantes ponen el texto **dentro de imágenes** (para que los filtros de contenido no lean "Ingrese su contraseña"). La respuesta: **OCR**, los sistemas extraen texto de las imágenes y lo analizan igual.

**Y peor aún para el atacante:** el texto extraído **y los links dentro de imágenes** también se cruzan con bases de datos de amenazas. Esquema de defensa en capas: imagen → OCR → texto/link → comparación con DB.

**"Miscellaneous":** el caso opuesto, sitios que son **solo imágenes** (página entera como screenshot para evadir análisis de HTML). Eso también es detectable como anómalo y baja la confianza.

## 10. Sandbox Detection

**Concepto:** abrir la URL en una máquina virtual controlada que **simula ser un usuario real** (browser, OS, interacciones), registrar todo:

- Redirecciones
    
- Scripts ejecutados
    
- Descargas intentadas
    
- **Comportamiento**: ¿pide credenciales? ¿muestra formularios falsos? ¿imita un login?
    

**Por qué es el detector más fuerte:** las firmas se pueden evadir (contenido custom), pero **el comportamiento no miente**. Si tu sitio recolecta credenciales y las POSTea a un endpoint raro, el sandbox lo vea hagas lo que hagas con el HTML.

**Nota del texto:** reconoce que los sitios usan evasion contra sandboxes (detectar VMs, solo activarse ante "humanos reales") — de ahí que los sandboxes modernos imitan comportamiento humano.

## 11. Machine Learning / AI

**Concepto:** modelos que puntúan riesgo combinando todo lo anterior: similitud visual, análisis de contenido, URL, campos de input. Y el ejemplo curioso del texto: usar ChatGPT con una captura de pantalla del login de Microsoft para clasificarlo como legítimo o phishing.

**Realidad práctica:** los ML models son especialmente buenos detectando **anomalías combinadas**, ninguna señal sola, pero el patrón agregado ("dominio joven + ASN raro + formulario de credenciales + tráfico de email masivo") es muy difícil de normalizar.

## 12. Miscellaneous (los detalles pequeños)

- **Falta de meta tags**: sitios legítimos suelen tener `<meta description>`, Open Graph tags, etc. Un phishing apurado suele omitirlos. No es prueba, pero **baja la puntuación de confianza**.
    
- **Solo imágenes**: ya visto con OCR.
    
- Técnicas vendor-dependent: cada proveedor (Palo Alto, Proofpoint, Microsoft Defender...) tiene sus propios trucos.

---

### Resumen huevas

|Tu decisión ofensiva|Detector que te pesca|
|:--|:--|
|Plantilla pública de GitHub|Signature detection (firmas de contenido)|
|Clon exacto de Microsoft|Visual signature + URL signature|
|Clon con paths idénticos (`/common/oauth2/...`)|URL signature|
|Dominio con keywords de marca|DNS Hunting + URL filtering|
|Typosquat / TLD confusion|URL filtering (built-in detection)|
|Dominio recién registrado, sin tráfico|Domain reputation (age, pagerank)|
|IP con historial malicioso / bulletproof host|Server characteristics (IP rep, passive DNS)|
|Certificado gratis de Let's Encrypt|SSL fingerprinting + reglas tipo Elastic|
|Evilginx2 sin modificar|**TLS fingerprinting**|
|Texto en imágenes|OCR detection|
|Contenido custom que evade firmas|Sandbox detection (comportamiento)|
|TODO lo anterior bien hecho|ML/AI (análisis agregado)|
