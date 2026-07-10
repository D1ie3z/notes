---
title: Favicon
sidebar_position: 1
---

## ¿Esto qué?

El favicon (`/favicon.ico`) es un archivo que los navegadores usan como ícono de la pestaña.  
Pero ese archivo, cuando se convierte a hash, puede usarse como **identificador único** de un stack, producto o panel.

## Herramientas y técnicas para Favicon Recon

---

### 1. **Extraer hash del favicon**

```bash
curl -sL https://target.com/favicon.ico | base64 -w0 | sha256sum
```

O con `hash-favicon.py` de TomNomNom:

```bash
python3 hash_favicon.py https://target.com/favicon.ico
```

### 2. **Buscar por hash en Shodan**

- [https://www.shodan.io](https://www.shodan.io)

```
http.favicon.hash:-123456789
```

### 3. **Buscar en Censys**

 https://search.censys.io/

```
services.http.response.favicons.sha256_hash: "abc123..."
```

### 4. **Tool: fav-up**

-  [fav-up](https://github.com/h0ru/fav-up)  
    Busca automáticamente favicon y devuelve hash + resultados de Shodan/Censys.

## `FavFreak` — Recon de favicon hash a escala

- [https://github.com/devanshbatham/FavFreak](https://github.com/devanshbatham/FavFreak)

