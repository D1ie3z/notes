---
title: Autonomus System Numbers (ASN)
sidebar_position: 1
---

## ¿Qué es?

Esta cosa es para saber que registro tiene una empresa en internet, esto nos sirve para poder ampliar scope

Es como un “país digital” que agrupa los rangos de IP públicos de una empresa o proveedor.  
> Si encuentras el ASN de un target, puedes descubrir **infraestructura expuesta**, **IP olvidadas**, y **hosts que no están en DNS.**

### Tools 

- bgp.he.net

- amass

```bash
amass intel -asn 11111 # el numero cambia dependiedo el asn
```

- ip.info/ASXXXX


### ¿Qué sigue?

Busca puertos si tienes IPs, esa madre te va a dar un rango enorme de IPs.

> Puedes usar `httpx` + `nmap` u otro escaner para ver que servicios tiene la IP.


Ponle:

1. Encuentras que la empresa X usa AS11233

2. Lo miras en bgp.he.net -> te da /24 IP blocks

3. Escaneas y te da un tomcat

4. El certificado te da old.x.com. o chance la IP real del sitio que tiene WAF

5. Imaginación