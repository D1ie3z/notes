---
title: Apex Domains
sidebar_position: 1
---

## ¿Esto qué?

> Un **apex domain** es el dominio raíz, como `example.com`, sin subdominios.  
> Es crucial encontrarlos para construir un **wider scope** y descubrir nuevas superficies de ataque que otros cazadores pasan por alto.

## Tools

- [crt.sh](https://crt.sh/)
    
- Censys.io
    
- [Shodan](https://www.shodan.io/)
    

Busca:
```bash
site:crt.sh "bbva"
```

O usa el parámetro `name_value` en JSON para sacar todos los dominios firmados.

**Amass Intel**

Usa WHOIS y relaciones de organizaciones para encontrar otros apex domains registrados con la misma entidad.

### Reverse WHOIS

- ViewDNS
    
- [Whoxy](https://www.whoxy.com/)
    
- [SecurityTrails](https://securitytrails.com/)
    

Busca dominios registrados con el mismo correo, nombre, empresa o ID WHOIS

**Búsqueda por ASN**

```bash
amass intel -asn 12345
```

- [bgp.he.net](https://bgp.he.net/)
    
- IPinfo ASN lookup
    

Descubres rangos de IP → que te llevan a hosts y certificados → que te dan dominios.

### **Extras útiles**

- [BuiltWith](https://builtwith.com/)  
    → Encuentra tecnologías compartidas entre dominios (misma analítica, CMS, etc.)
    
- [LeakIX](https://leakix.net/)  
    → Escanea internet completo por exposiciones, muchas veces con apex raros
    
- HackerTarget - Reverse IP  
    → Ve qué otros dominios comparten una IP+

