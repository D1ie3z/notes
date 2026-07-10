---
title: IPs and Ranges
sidebar_position: 1
---

## ¿Cuándo aplicar esto?

- Ya descubriste el ASN de la empresa
    
- Tienes certificados o subdominios que resuelven a IPs interesantes
    
- Estás haciendo un scan profundo por infraestructura olvidada
    
- El objetivo tiene muchos servicios on-premises

## Herramientas para extraer rangos IP

---

### [bgp.he.net](https://bgp.he.net)

Busca la empresa → te da su ASN → clic en el ASN para ver los IP blocks (ej: `104.20.0.0/24`)

- ipinfo.io

##  Scaneo de IPs y detección de hosts

---

###  Escaneo de puertos con `naabu`

```bash
naabu -list ranges.txt -top-ports 100 -o alive_ips.txt
./rustscan -a './target_domains' --ulimit 5000
```

- Censys
- Shodan


> Tambien puedes ir jugando tú creando tus despliegues de IPs y ya vas viendo cual jala y si pertenece al cliente