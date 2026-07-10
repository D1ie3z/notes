---
title: Nuclei
sidebar_position: 1
---

> Yo no soy de herramientas automatizadas la vdd pero hay que saberlas usar


## Instalación

Primero instala go

```bash
sudo apt install golang-go
```

Luego papas

```bash
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

Y ya nomas mueves el nuclei a tu path de binarios

```bash
sudo mv ~/go/bin/nuclei /usr/local/bin/nuclei
```
## Introducción 
Ten a la mano los templates basicos

- https://github.com/projectdiscovery/nuclei-templates


Vas a necesitar cómo funciona YAML así que echate esto:

- https://spacelift.io/blog/yaml


## Templates

Vamos a entender las jodidas plantillas de nuclei, para esto voy a tomar una X del template y voy a poner un #comentario explicando pa que sirve cada una

```yaml
id: jolokia-tomcat-creds-leak #Identificador nomas eso

info:
  name: Jolokia <= 1.7.1 Information Leakage #Nombre de la plantilla
  author: pathtaga #El crack que la hizo
  severity: critical #Esto lo toma nuclei y le da prioridad dependiendo la severidad
  description: Tomcat's credential disclosure leading to Remote Code Execution via WAR upload. # Descripción
  tags: jolokia,tomcat,exposure,vuln # Esto es para organizar y como las quieres llamar
  reference: # Referencias de donde toma estas pruebas
    - https://github.com/laluka/jolokia-exploitation-toolkit/blob/main/exploits/info-leak-tomcat-creds.py
    - https://therealcoiffeur.github.io/c11011

http: #El tipo de protocolo que usa
  - method: GET #El metodo que manda
    path: #Donde manda la petición
      - "{{BaseURL}}/jolokia/read/Users:database=UserDatabase,type=UserDatabase"
      - "{{BaseURL}}/actuator/jolokia/read/Users:database=UserDatabase,type=UserDatabase"
# YA TODO EL FUNCIONAMIENTO GENERAL
    stop-at-first-match: true
    matchers-condition: and
    # Esto es lo que va a buscar o sea que matchee con lo que está aquí
    matchers:
    # QUE SEA 200
      - type: status
        status:
          - 200
    # QUE TENGA ESTA PALABRA
      - type: word
        part: body
        words:
          - '"mbean":"Users:database=UserDatabase,type=UserDatabase"'
          - '"users":'
        condition: and

      - type: word
        part: body
        words:
          - '"users":[]'
        negative: true
# digest: 4a0a00473045022100da943127b7ae9861849075ebe802fa2792285210da3f5203307ec1d43b09b262022074302171532ca33b1007612c1397f49717af9ff40eec6106d9a75b67b4c5e122:922c64590222798bb761d5b6d8e72950
```

Puedes crear tus propios matchers y tus propias plantillas, les puedes poner regex personalizados, etc. Al final y al cabo es cómo cualquier otra tool tú la ajustas conforme sea el caso :)

> No te quedes con lo de acá busca ve si hay más plantillas ahí en internet

## Comandos

La neta te recomiendo usar el -h para ver como sirve y juega con la tool acá voy a poner puro comando que sirva para ciertos casos

### Basicos

```bash
nuclei -t template.yaml -l domains.txt #Escanear multiples dominios

nuclei -t *.yaml -eh notequiero.com,127.0.0.1 -l domains.txt -v # Excluir hosts y el *.yaml es usar todaas las templates o puedes de que 1.yaml, 2.yaml

nuclei -t *.yaml -u https://IP -scan-all-ips -iv 4 # Escanear IPs porque nuclei se la pela las ips

nuclei -l dominios.txt -as #Escanea automaticamente versiones y servicios

nuclei -l dominios.txt -ai "find logins" #pa usar IA

nuclei -l dominios.txt -tags misconfigs -es info #Mira arriba porque el tags y es

```

## Configuration

Modifica tu config.yaml a tu antojo ¿Cómo? Aprende yaml perro y ve arriba ya te explique los tags tqm.


## Fuzzing

Puedes hacer fuzzing con nuclei, tienes que hacer tus templates custom. 


> Basicamente creas tus yaml personalizados


