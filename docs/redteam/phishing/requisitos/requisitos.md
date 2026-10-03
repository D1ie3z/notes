---
title: Requisitos
sidebar_position: 1
---

## Requisitos básicos

Esto es lo que necesitas para poder hacer tu phishing... Así es ocupas $$$ por eso no soy taan fan, JAJAJAJAJ.

- Infrastructure - The server environment that hosts the phishing files, backend code, and other necessary resources.

- Domain - The URL that the user will see in the browser's address bar.

- TLS/SSL Certificate - Used to create the illusion of security by displaying the padlock symbol in the browser. This is no longer optional as was the case in previous years.

- Phishing Files - The frontend design that users interact with, crafted to persuade them to take a desired action. This can be a clone of a legitimate website or a completely custom design. This also includes the backend code that provides the functionality.

- Payload - The malicious payload the user will download and execute. This may or may not be necessary depending on the campaign's objective.

- Security Features - Evasion techniques to avoid detection by security systems and anti-phishing tools.

PTM YA HABÍA ESCRITO TODO Y SE BORROOO JAJAJJA

### Infraestructura

Donde se va alojar tu sitio, compra un fucking hosting de cloud.

- Hostinger
- OVH Cloud
- Cloudzy

### Dominio

A donde se va a resolver tu sitio no vayas a querer hacer la porquería de mandar la dirección IP ajajjajaja. Esto hará creible tu phishing.
Verifica que no hayan comprado el dominio antes y juega con el TDL para hacerlo creible (.com,.org.io,etc...)
Puedes comprarlo en:
- Domain.com
- Namecheap

### Certificado TLS

Ya hable que debes meterle más cariño y presupuesto porque es más facil de detectar el phishing hoy en día entonces...
Nmms si mandas un http://sitio.com pues te va a mandar al virote.
Para eso necesitas un certificado SSL para dar el gatazo y hacerlo más creativo.

Adquierelo en:

- https://letsencrypt.org/
- https://zerossl.com/

### Archivos del phishing

Literalmente la estructura (HTML, CSS, JS, backend, etc...) pues lo básico, el sitio debe tener estructura y hacer algo.

Puedes clonar un sitio con:
- Zphisher - https://github.com/htr-tech/zphisher
- SaveWeb2zip - https://saveweb2zip.com/en

O hacerlo tú papi a mano o token maxxing jaja... 

### Payload

Pues si el phishing que quieres hacer es para que un user descargue un archivo truculento (malicioso) hay que preparalo. 
O sea activar la descarga y aumentar la probabilidad de que el usuario lo descargue.

### Seguridad Web

Hay que proteger nuestro sitio de ser atacado... jajaja, nah o sea si, pero el punto principal es protegerlo de los escaneres que lo traten de analizar entonces hay que meterle:

- Firewall
- WAF
- Anti-Bot Solutions (Captcha)
- Lockdown Ports
- Estandares de codigo seguro (no te vayas a dejar un SQLi ahí wey)
- Bloqueo, redirecciones, mostrar contenido benigno a ciertos paises, ASNs, y otras IPs que escanea el internet.
- Configuración segura (dejate un directory traversal JK, NO SEAS WEY)
- Redirectores

