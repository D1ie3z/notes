---
title: DNS
sidebar_position: 1
---
##  DNS Recon (Permutaciones, Resolución, Bruteforce y más)

> El objetivo aquí es **descubrir la mayor cantidad de subdominios válidos posible**, usando múltiples técnicas para encontrar activos ocultos, no indexados o sin vínculos públicos.

### Técnicas clave

1. **Enumeración pasiva** (desde fuentes públicas)
    
2. **Permutación y wordlists**
    
3. **Bruteforce de subdominios**
    
4. **Resolución DNS masiva**
    
5. **Wordlist personalizada a partir del contenido**
    
6. **Wildcard / catch-all detección**
    
7. **DNS bruteforce interno (si hay acc o)**

## Herramientas

---

### **Enumeración pasiva (fuentes OSINT)**

- 🔗 [Subfinder](https://github.com/projectdiscovery/subfinder)
```
subfinder -d target.com -o subdomains.txt
```

🔗 [Amass passive](https://github.com/owasp-amass)
```bash
amass enum -passive -d target.com
```

- 🔗 [Assetfinder](https://github.com/tomnomnom/assetfinder)
    
- 🔗 [crt.sh](https://crt.sh)  
    → Buscar `%.target.com` para obtener subdominios desde certificados

### **Permutaciones**

- 🔗 [DNSGen](https://github.com/ProjectAnte/dnsgen)  
    Usa subdominios existentes para generar nuevas combinaciones
    dev1-super.walmart.com
    
```bash
cat subdomains.txt | dnsgen - | tee permuted.txt
echo subdomains.txt | dnsgen - | massdns -r resolvers.txt -t A -o L > test.txt
```

🔗 [gotator](https://github.com/Josue87/gotator)  
Permutaciones agresivas con wordlists
```
gotator -sub subdomains.txt -perm permutations.txt -depth 1 -silent > permuted.txt
```

Wordlists útiles:

- `SecLists/Discovery/DNS/namelist.txt`
    
- `commonspeak2/dns.txt`
    
- `all.txt` de `dnsgen`

###  **Bruteforce / Wordlists**

🔗 [puredns](https://github.com/d3mondev/puredns)  
    Rápido, cachea resoluciones y permite wordlists enormes
```bash
puredns bruteforce wordlist.txt target.com -r resolvers.txt -w found.txt
```

🔗 [massdns](https://github.com/blechschmidt/massdns)  
Brutalmente rápido con 1M+ registros

### **Resolución DNS masiva**

- 🔗 [dnsx](https://github.com/projectdiscovery/dnsx)  
    Para filtrar solo subdominios que resuelven
```bash
cat subs.txt | dnsx -silent -a -resp -o resolved.txt
```

🔗 [puredns](https://github.com/d3mondev/puredns)  
```bash
puredns resolve potential-subs.txt -r resolvers.txt -w live.txt
```

### **Detección de Wildcard DNS**

A veces un DNS devuelve cualquier cosa como válida (`*.target.com`):

- Prueba:
```
dig madeup123456.target.com +short
```

O usa:
```
puredns bruteforce wordlist.txt target.com -r resolvers.txt --wildcard-tests 6
```

También puedes detectarlo con dnsx:
```
dnsx -json -a -retries 2 -rl 100 -silent -l list.txt | jq .
```

### **Reverso de PTR / IP**

Si tienes rangos de IP (de ASN recon), busca si tienen nombres DNS válidos:

```
dnsx -ptr -l ips.txt -silent -o hostnames.txt
```

### **DNS en recon interno (AD, VPN, cloud)**

Si accedes a una VPN interna o cloud privado, puedes usar `dig`, `resolvectl`, `nslookup` para encontrar zonas internas como:

- `int.target.com`
    
- `corp.local`
    
- `*.internal`
    
- `*.dev`
