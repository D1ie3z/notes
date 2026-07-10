---
title: Google Dorks 
sidebar_position: 1
---

## Google Dorking Recon

> Google indexa más de lo que las empresas creen.  
> Tú puedes aprovechar esto para encontrar archivos de desarrollo, backups, rutas internas, documentos expuestos, endpoints, etc.

##  Dorks esenciales por categoría

---

### Archivos sensibles
```
site:target.com ext:env
site:target.com ext:log
site:target.com ext:sql
site:target.com filetype:json inurl:config
site:target.com inurl:wp-config.php
```

### Repositorios y Git expuestos

```
site:target.com inurl:.git
site:target.com inurl:.svn
site:target.com intitle:index.of .git
```

### Backups / Bases de datos

```
site:target.com ext:bak
site:target.com ext:old
site:target.com ext:backup
site:target.com filetype:sql
```

### Paneles de admin
```
site:target.com inurl:admin
site:target.com inurl:login
site:target.com inurl:dashboard
site:target.com intitle:\"admin panel\"
```

### Índices y exploración de archivos

```
site:target.com intitle:index.of
site:target.com intitle:index.of /config
site:target.com intitle:index.of /uploads
```

## Frameworks y rutas comunes

```
site:target.com inurl:.env
site:target.com inurl:config
site:target.com inurl:debug
site:target.com inurl:staging
```

### Dorks avanzados y combinados

```
site:target.com (ext:env | ext:log | ext:json) -github
site:target.com inurl:api ext:js
site:target.com (intitle:\"index of\") (bak | backup | archive)
site:target.com -www #El -www es excluir
```

## Dorks fuera del dominio (OSINT)

- Buscar correos, leaks o documentos corporativos:
```
"@target.com" filetype:pdf
"@target.com" site:pastebin.com
```

Buscar documentos públicos:
```
site:docs.google.com "@target.com"
```

## Herramientas para automatizar Dorking

- [GitHub Dorks CLI](https://github.com/techgaun/github-dorks)
    
- [GitDorker](https://github.com/obheda12/GitDorker)
    
- [GH-dork](https://github.com/hisxo/gitGraber) (también para GitHub leaks)

- Exploit DB

- Pentester Tools - Literal así buscalo