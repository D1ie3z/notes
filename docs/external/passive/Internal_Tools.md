---
title: Internal company tools
sidebar_position: 1
---
# OJO 

> ESTO APLICA A TODO NO SOLO A CUANDO NO TIENES NADA LA METODOLOGÍA ES LA MISMA PARA INFRA INTERNA Y ASÍ.

## Esto que show

Las empresas usan herramientas internas en su infraestructura así que debes hacer reconocimiento de estas. 

| Tool               | Qué explotar                                 |
| ------------------ | -------------------------------------------- |
| **Jenkins**        | `/script`, `/cli`, `/login`, RCE via groovy  |
| **GitLab**         | Pipelines públicos, SSRF, token leaks        |
| **GitHub Actions** | YAML maliciosos, secretos en logs            |
| **SonarQube**      | Secrets en análisis, endpoints no auth       |
| **Grafana**        | Panel sin auth, dashboard leaks, RCE         |
| **DroneCI**        | Builds públicos con comandos mal sanitizados |
| **CircleCI**       | Logs con variables de entorno                |


## ¿Por qué esto importa?

Internal tools como Jenkins, phpMyAdmin, y Jira son objetivos importantes :

- Luego hay exceso de privilegios asignados en estas herramientas
    
- Dan acceso a información sensible y funcionalidades
    
- Usualmente tienen mala configuración y están desactualizadas (unos CVEs perrin)
    
- Puede ayudarte a pivotar a otros servicios
    
- Puede tener documentación importante o cosas internas
    

## Discovery Phase

Identificalas y ve si hay cosas tipo:

    - /admin
        
    - /jenkins
        
    - /jira
        
    - /phpmyadmin
        
    - dev.
        
    - admin.
        
    - tools.
        
    - internal.
        

Busca:

- CI/CD pipelines
    
- Code repositories
    
- Monitoring systems
    
- Database administration tools
    
- Issue tracking systems
    
- Documentation platforms
    

## Initial Assessment

Si ya encontraste una herramienta, empieza el reconocimiento:

1. Identifica la versión • Código fuente del sitió • Ve HTTP headers • Ve mensajes de error • Busca por documentación • Ve referencias de changelog
    
2. Vulnerabilidades conocidas. Busca la versión que encontraste:
    

- Busca CVEs y avisos de seguridad
    
- Ve primero por vulnerablidades sin autenticación
    
- Ve exploits públicos
    
- Mira researches, blogs de seguridad, etc...
    

## Common Misconfigurations

Checa esto:

- Instalaciónes por default
    
    - Archivos de setup sin modificar
        
    - Credenciales por defecto
        
    - Sample configurations
        
    - Cuentas de test
        
- Access Controls
    
    - Missing authentication
        
    - Weak permissions
        
    - Incomplete security headers
        
    - Open redirect vulnerabilities
        

Researches padre santooo:

- HackerOne reports
    
- Bug bounty write-ups
    
- GitHub security advisories
    
- Conference presentations
    

## Authentication Testing

Testea mecanismos de autenticación:

- Default Credentials
    
    - Admin:admin
        
    - Admin:password
        
    - Root:root
        
    - Default vendor credentials
        
- Problemas comunes:
    
    - Contraseñas debiles
        
    - Missing brute force protection
        
    - Bypassing authentication
        
    - Broken password reset flows
        

## Post-Authentication Analysis

Autenticado checa:

- Funcionalidades del sistema / app lo que sea:
    
    - Mapea todas las funcionalidades disponibles
        
    - Papi Broken Access Control
        
    - Ve si puedes escalar privilegios
        
    - Funciones potencialmente peligrosas
        
- Plugin y Extensiones
    
    - Ve si hay plugins por defecto
        
    - Ve plugin versions
        
    - Checa plugin configurations
        
    - Mira configuraciónes inseguras
        

## Funcionalidades de desarrollador

Las herramientas de desarrollador usualmente incluyen funcionalidades de diagnostico y cosas detalladas:

- Busca:
    
    - Debug endpoints
        
    - Testing interfaces
        
    - Health checks
        
    - Monitoring tools
        
    - Log viewers
        

Estas funcionalidades pueden provocar:

- Remote code execution
    
- Information disclosure
    
- Access to sensitive data
    
- System manipulation
    

## Obtención de credenciales y documentación

Buscar:

- Common Files:
    
    - README files
        
    - Configuration backups
        
    - Log files
        
    - Setup guides
        
    - API documentation
        
- Busca:
    
    - Hardcoded credentials
        
    - API keys
        
    - Internal hostnames
        
    - Network details
        
    - Database strings
        

## Acercamientos específicos

### Jenkins

Áreas criticas:

- Script console access
    
- Build logs
    
- Plugin vulnerabilities
    
- Project configurations
    
- Build triggers
    

### Jira

Mira:

- Attachment handling
    
- User enumeration
    
- Project permissions
    
- Information disclosure

- En el filtro como interno busca palabras tipo `password` o la IP o algo 
    

### phpMyAdmin

Cosas a testear:

- SQL injection
    
- Access to credentials
    
- File inclusion (if enabled)
    
- Export functionality
    
- User privileges
    
- Configuration storage
    

## FINALMENTE

Si estás en un pentest o algo similar:

1. Documenta • Ten notas detalladas • Guarda Evidencia • Documenta tu metodologia • Ve versiones que hayan sido afectadas
    
2. Recomentdaciones
    
    - Inicia pasivo
        
    - Ve aumentando poco a poco la intensidad
        
    - Monitorea los impactos
        
    - Documenta de forma clara
        

> La idea es encontrar problemas de seguridad sin tener fallos en el ambiente.