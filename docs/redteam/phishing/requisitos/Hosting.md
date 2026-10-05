---
title: Hosting
sidebar_position: 1
---
## ¿Qué?

Los hosting son los que se utilizarán para alojar nuestro contenido de phishing. Los proveedores de alojamiento web serán responsables de proporcionarle un servidor y una dirección IP.

> La variable clave: tiempo de vida

Elegir proveedor de hosting y de dominio determina tres cosas: efectividad de la campaña, confiabilidad y **cuánto tiempo sobrevive la infraestructura antes de ser quemada** (burned).

Todo proveedor se evalúa por dos ejes:

1. **Reputación técnica** — ¿su ASN/IP está en listas negras?
2. **Proceso de takedown** — ¿qué tan rápido suspenden cuando los reportan?

### Shared Hosting

Varios sitios comparten un mismo servidor e IP (HostGator es el ejemplo típico).

**Ventajas:**

- Barato, fácil de montar, paneles amigables.
- **IP compartida = camuflaje.** Si la IP aloja cientos de sitios legítimos, un defensor que investigue un dominio sospechoso y haga un Reverse IP Lookup (como el de DomainTools) verá vecinos normales y dudará: _"¿será falso positivo?"_

**Desventajas:**

- Los proveedores monitorean activamente: un phishing quema la IP de todos sus clientes, así que suspenden rápido ante reportes.
- **Dependencia de los vecinos:** si otro inquilino de tu IP es malicioso, la reputación de la IP cae y te arrastra. El defensor que revise tu IP verá vecinos malos y te asociará con ellos.

### Cloud Hosting (AWS, Azure)

Máquinas virtuales en proveedores grandes, pago por uso.

**Ventajas:**

- Control total del servidor (configuraciones, herramientas).

- **Despliegue rápido:** crear y destruir servidores en minutos. Si queman uno, levantas otro. Ideal para campañas cortas.
 
- ASN de máxima reputación, nadie filtra tráfico de AWS o Azure por defecto.    

**Desventajas:**

- Verificación de cuenta estricta (tarjeta, teléfono, a veces identidad) → trazabilidad.

- **Shutdown de cuenta completa:** si detectan abuso no suspenden el servidor, te cierran la cuenta entera con todo lo que haya dentro. Mitigación: **una cuenta dedicada por campaña**.

- Complejidad: cientos de servicios, curva de aprendizaje alta. 

### Serverless (Cloudflare Workers, Lambda, Azure Functions)

Sin servidor que administrar. El proveedor entrega todo empaquetado:

- **Dominio:** `<worker>.workers.dev`

- **SSL incluido**

- **IP del proveedor** (reputada)

Es el "Trusted Websites" llevado al extremo: todo el stack de confianza heredado en minutos.

**La paradoja:** funciona tan bien que todo el mundo la usa → los defensores la vigilan. Una búsqueda de `workers.dev` en urlscan.io muestra resultados masivos clasificados como MALICIOUS/HTMLPhisher. Los nombres aleatorios desechables (`broken-rain-1a74.1rwwyy66.workers.dev`) son patrón típico de campañas masivas — y ese patrón a su vez es detectable.

### Bulletproof Hosting

Proveedores que **ignoran reportes de abuso** por política. El tweet de abuse.ch lo muestra: proton66 y ELITETEAM lideran el ranking de redes que hospedan malware, describidos como "bulletproof hosters who refuse to react on abuse reports", conectados upstream por operadores rusos y marcados como Blocked en Spamhaus.

**Ventajas:**

- No te tumban por reportes → continuidad total.

- Algunos **te notifican los reportes recibidos** → sabes quién te está cazando. Contra-inteligencia gratis.

**Desventajas:**

- **Reputación catastrófica:** tus IPs ya están en listas negras antes de levantar el servidor.

- El ejemplo de SECUNFRA lo resume: identificaron infraestructura maliciosa **solo por el proveedor** — "Hosted at AS44477 Stark Industries Solutions Ltd" → "del proveedor inferimos intención maliciosa, no red team". Hospedar ahí es una firma en sí mismo; el defensor ni mira el contenido.

- **Decomiso:** las autoridades pueden tumbar la operación completa y pierdes todo.

- Más caro.

### DROP la lista que condena ASNs

Spamhaus mantiene la lista **Don't Route Or Peer (DROP)**: IPs y ASNs que deben bloquearse a nivel de red por estar involucrados en ciberdelito. Un proveedor bulletproof puede entrar **entero** a la lista → sus rangos se bloquean automáticamente en firewalls de organizaciones de todo el mundo.

Antes de usar cualquier infraestructura, verificar el ASN contra DROP/ASN-DROP es un paso básico:

-  https://www.spamhaus.org/blocklists/do-not-route-or-peer/
- DROP: `spamhaus.org/drop/drop_v4.json`
 
- ASN-DROP: `spamhaus.org/drop/asndrop.json`

### Proveedores recomendados: la carrera del takedown

La métrica oculta: **la velocidad con la que el proveedor responde a reportes.**

- **Proceso de takedown definido y rápido** (AWS, Azure, Namecheap hoy): pareces legítimo, pero un reporte mata tu servidor o cuenta en horas.
 
- **Takedown lento o con fricción:** tu sitio sobrevive días o semanas después de reportado → más campaña activa.


Los tweets documentan la carrera:

- Namecheap en 2021 respondía reportes en **minutos** ("we're on it", "handled") → de ahí pasó de bueno a de los peores.

- La comparación del mismo año: Namecheap respondió en **~1 minuto**; **Web.com tardó más de 4 horas** con respuesta genérica. Web.com = proveedor ventajoso.


**Cómo se obtiene esta inteligencia:** siguiendo cuentas de investigadores en X (@abuse_ch, @malwrhunterteam, @SI_FalconTeam...) que publican constantemente quién responde rápido y quién no. El reconocimiento de proveedores es un esfuerzo de comunidad.

### Domain Providers: el segundo frente

El takedown tiene **dos palancas independientes**:

1. **Hosting** → tumba el servidor y el contenido.
 
2. **Registrar** → suspende el dominio → el sitio muere aunque el servidor siga vivo, porque el nombre ya no resuelve.


Mismo criterio para elegir registrar: proceso lento y con fricción = dominio vivo más tiempo.

### Multi-Provider Usage

El riesgo de un solo proveedor: si queman un dominio, el defensor hace pivoting (reverse IP, passive DNS, TLS certificate transparency, sweep del ASN) y **encuentra toda tu infraestructura** en la misma cuenta/ASN. Un servidor quemado expone la campaña completa.

La solución:

- Diversificar hosting y dominios entre varios proveedores.

- Dificulta la correlación: el defensor no ve el patrón "todo en AS38841".

- Si un proveedor cierra tu cuenta, el resto continúa operando. Redundancia = uptime.