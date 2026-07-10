---
title: Adquisiciones
sidebar_position: 1
---

## ¿Esto qué?

Pues en bug bounty hay que veces que entran los proyectos / empresas que le pertenecen al cliente principal, ponle que X compra snapchat o algo similar y pues hay veces que esa adquisición entra en scope.

## Tools

-  [Crunchbase](https://www.crunchbase.com/)  
    → Filtra por `_“Acquired By”_`, `_Company overview_`, etc.
    
- [Wikipedia](https://en.wikipedia.org/wiki/List_of_mergers_and_acquisitions_by_...)  
    → Busca “List of acquisitions by `{company}`”
    
- OCCRP Aleph  
    → Base de datos de investigación global (filtra por relaciones empresariales)
    
- [CB Insights (freemium)](https://www.cbinsights.com/)  
    → Para ver mapa de relaciones y adquisiciones
- [Apollo.io](https://www.apollo.io/)  
    → Excelente para explorar empresas relacionadas, emails y conexiones
    
- [RocketReach](https://rocketreach.co/)  
    → Puedes ver empresas relacionadas con empleados y dominios
    
- [Hunter.io](https://hunter.io/)  
    → Busca correos corporativos de empresas adquiridas
- [SecurityTrails](https://securitytrails.com/)  
    → Busca por registrante o ASN común
    
- ViewDNS Reverse WHOIS  
    → Ingresa nombre de empresa / correo del registrante
    
- [Whoxy (API)](https://www.whoxy.com/)  
    → Para automatizar búsqueda de dominios por entidad
    
- [Amass Intel](https://github.com/owasp-amass)

```bash
amass intel -whois -org "EMPRESA"
```

## LinkedIn + empleados

- [LinkedIn](https://www.linkedin.com/)  
    → Busca empleados de empresas adquiridas, y ver si siguen usando correos del dominio viejo
    
- [Hunter.io](https://hunter.io/)  
    → Para ver si siguen activos los correos con esos dominios


### Bonus para cazar vulnerabilidades en dominios de adquisiciones

- [crt.sh](https://crt.sh/)  
    → Busca certificados emitidos para dominios adquiridos
    
- [Shodan](https://www.shodan.io/)  
    → Filtra por hostname, org, SSL, etc.  
    Ej: `ssl:"example-acquired.com"`
    
- Censys  
    → Revisa certificados y hosts históricos con dominio