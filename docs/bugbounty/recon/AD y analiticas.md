---
title: AD y analiticas
sidebar_position: 1
---

###  ¿Qué buscar?

- Google Analytics ID (`UA-XXXXX-Y` / `G-XXXX`)
    
- Google Tag Manager ID (`GTM-XXXX`)
    
- Facebook Pixel (`fbq('init', 'XXXX')`)
    
- Hotjar, Segment, Mixpanel, etc.
    
- Scripts embebidos de otros dominios propios
##  Herramientas específicas

###  **BuiltWith**

🔗 [https://builtwith.com/](https://builtwith.com/)

- Ve los servicios de analytics que usa un dominio
    
- Te muestra otros sitios que usan **el mismo ID de GA**, GTM, etc.
    
- Ideal para encontrar dominios secundarios, staging, demos
    

---

###  **Wappalyzer (extensión o CLI)**

🔗 [https://www.wappalyzer.com/](https://www.wappalyzer.com/)

- Detecta tecnologías, JS embebido y trackers
    
- Identifica frameworks, marketing tools y analytics de terceros
    

---

###  **Datasploit (OSINT framework)**

🔗 [https://github.com/DataSploit/datasploit](https://github.com/DataSploit/datasploit)

- Tiene módulos para buscar Google Analytics IDs y relaciones
    

---

###  **GA Scanner – Google Analytics ID Tracker**

🔗 [https://github.com/michenriksen/ga-mass-crawler](https://github.com/michenriksen/ga-mass-crawler)

- Ingresas un ID `UA-XXXXX-Y`
    
- Te saca todos los dominios que lo usan (bajo mismo Google account)
    

---

###  **GTMHunter**

🔗 [https://github.com/dievus/gtmhunter](https://github.com/dievus/gtmhunter)

- Busca por ID de Google Tag Manager (GTM-XXXX)
    
- Revela dominios relacionados con el mismo script de tracking
    

---

###  **Analizador de JS (Manual + LinkFinder)**

- Busca manualmente en archivos `.js`:
```bash
cat *.js | grep -E 'A-[0-9]+|GTM-[A-Z0-9]+|fbq\\(\'iniUt\''
```

Usa `LinkFinder`, `JSParser`, `GAP` para extraer rutas que apunten a otros dominios

###  **Censys / Shodan / crt.sh**

- Si encuentras un dominio relacionado a través de analytics, verifica su existencia con:
    
    - 🔗 [https://crt.sh](https://crt.sh)
        
    - 🔗 https://search.censys.io
        
    - 🔗 [https://www.shodan.io](https://www.shodan.io)
        

---

### Ejemplo real

1. Encuentras `UA-9999999-1` en `shop.example.com`
    
2. Lo buscas en BuiltWith y ves que también aparece en:
    
    - `dev-shop.net`
        
    - `test-orders.com`
        
    - `examplecdn.io`
        
3. BOOM: nuevo wider scope con activos olvidados y tal vez **sin WAF** 