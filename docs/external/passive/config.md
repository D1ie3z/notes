---
title: Config Files
sidebar_position: 1
---

## Recon de Archivos de Configuración y Desarrollo

---

## ¿Qué buscar?

| Tipo de archivo                        | Contiene                                      |
| -------------------------------------- | --------------------------------------------- |
| `.env`                                 | Variables de entorno (DB creds, secrets…)     |
| `.git/config`                          | Repos internos, rutas, correos                |
| `.gitignore`                           | Archivos que no deberían estar, pero lo están |
| `.DS_Store`                            | Estructura de directorios                     |
| `.npmrc`, `.yarnrc`                    | Tokens de NPM                                 |
| `config.json`, `settings.py`           | Parámetros, API keys, flags debug             |
| `composer.json` / `package.json`       | Dependencias, scripts internos                |
| `.babelrc`, `.eslintrc`, `.prettierrc` | Configuración de tooling                      |
## Cómo buscarlos

### **Fuzzing de archivos**

```
ffuf -w SecLists/Discovery/Web-Content/config-files.txt -u https://target.com/FUZZ -mc 200,403
```

Wordlists:

- `SecLists/Discovery/Web-Content/config-files.txt`
    
- `raft-large-files.txt`
    
- Custom: `[".env", ".git/config", ".npmrc", "config.php", "config.json"]`

### **Google Dorks**

```
site:target.com ext:env
site:target.com intitle:index.of .env
site:target.com filetype:json inurl:config
```

### **Wayback + GAU + ParamSpider**
```
gau target.com | grep -E '\.env|\.git|config'
waybackurls target.com | grep -i config
```

### **Tools especializadas**
- [git-dumper](https://github.com/arthaud/git-dumper)  

Si encuentras `.git/config`, ¡puedes dumpear todo el repo!

```bash
python3 git-dumper.py https://target.com/.git/ ./repo-dump
```

- [envgrabber](https://github.com/h4wkst3r/envgrabber) 

Busca `.env` files en múltiples targets

### **Nuclei para archivos sensibles**

Usa plantillas específicas:
```bash
nuclei -l urls.txt -t exposed-panels,files/ -tags config,env
```

## Qué hacer si encuentras algo

| Hallazgo          | Acción                                                  |
| ----------------- | ------------------------------------------------------- |
| `.env` con claves | Revisar para DB, mailer, JWT                            |
| `.git/config`     | Buscar .git/HEAD → puede ser dumpeable                  |
| `config.json`     | Ver rutas internas, flags debug                         |
| `.npmrc`          | Buscar `//registry.npmjs.org/:_authToken=` token activo |

## The .git Folder: A Source Code Gold Mine

When you find a .git folder on a web server, you've struck gold. Here's why:

- .git/HEAD: Points to the current branch (e.g., "ref: refs/heads/master")
    
- .git/config: Contains repository config including remote URLs and credentials
    
- .git/index: Database of all files in the repository
    
- .git/objects/: Contains all versions of every file (compressed)
    
- .git/refs/: Contains commit hashes for branches and tags
    

**Why It's Dangerous:** If a .git folder is exposed, attackers can reconstruct the entire source code by:

1. Downloading the .git folder
    
2. Using the index file to identify all objects
    
3. Downloading each object from .git/objects/
    
4. Rebuilding files from these objects Tools like git-dumper automate this process entirely.
    

## Other Common Exposed Files Examples and Their Purpose

1. **Container Files**
    
    - docker-compose.yml: Multi-container setup with passwords and volumes
        
    - Dockerfile: Shows how the app is built and what's installed
        
    - kubernetes.yaml: Contains service accounts and secrets
        
2. **Config Files**
    
    - .env: Environment variables with database passwords
        
    - wp-config.php: WordPress database credentials
        
    - config.php: Application secrets and API keys
        
3. **Build Files**
    
    - package.json: Shows dependencies and scripts
        
    - .npmrc: Can contain private registry tokens
        
    - Jenkinsfile: Shows deployment processes
        
4. **IDE Files**
    
    - .vscode/: Contains debugging configurations
        
    - .idea/: Can expose local file paths
        
    - .swp: Vim temporary files with unsaved changes
        

Each of these files can expose sensitive details about your application's infrastructure, credentials, or internal workings.