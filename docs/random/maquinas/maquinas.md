---
title: Maquinas / Labs
sidebar_position: 1
---

## No son writeups

Voy a poner de que cosillas interesantes que vaya aprendiendo de las maquinas o laboratorios, luego hay casos de uso que se pueden usar de ellas.

Que al final y al cabo es la metodología.

---

## ERP

CHECATE EN LAS VERSIONES DE LA COSA VULNERABLE DESDE LOS REQUERIMIENTOS O COSAS DE DOCUMENTACIÓN 
	E INTENTA CON LAS CREDAS DE LOS EXPLOITS PUEDE QUE VENGAN ASÍ POR DEFECTO

### Privilege escalation

SI VEMOS PUERTOS ABIERTOS BUSCA CARPETAS CON SERVICIOS RELACIONADOS
EJEMPLO : 25 busca cosas relacionadas a correo


---

## Fail

CHECK IF YOU CAN UPLOAD FILES WITH RSYNC

- https://www.tecmint.com/rsync-local-remote-file-synchronization-commands/#3_Copy_a_Directory_from_Local_to_Remote_Server

### Privilege escalation

Ver grupos `id` -> Sale fail2ban

```bash
find /etc -writable -ls 2>/dev/null
```

Let’s look inside /etc/fail2ban/jail.conf to know more about how fail2ban is configured.

CHANGE DE AUTO BAN COMMAND FROM iptables-multiport.conf FOR a reverse shell

Then try to connect to SSH with wrong credentials

- https://systemweakness.com/privilege-escalation-with-fail2ban-nopasswd-d3a6ee69db49

--- 

## Flu

- Confluence 7.13.6
- Apache Tomcat/9.0.58

- https://www.rapid7.com/blog/post/2022/06/02/active-exploitation-of-confluence-cve-2022-26134/
- https://raw.githubusercontent.com/Habib0x0/CVE-2022-26134/main/CVE-2022-26134.rb


Tenemos que url encodear porque se parte el exploit

### Privilege Escalation

/etc/mysql/mysql.conf.d/mysqld.cnf

No olvides pspy y checcar si tienes permisos de escritura sobre el archivo que se ejecuta

---
## Image

- https://github.com/ImageMagick/ImageMagick/issues/6339

CVE-2023-34152
Is vulnerable for the file name 
Be patient try to replicate the poc literally and probably you get the result

DONT FORGET TO URL ENCODE - THIS TIME WE COULDN'T DO IT BECAUSE WE NAME THE FILE DIRECTLY BUT DONT FORGET IT

TRY EVERY SINGLE TECHNIQUE IN THIS CASE WE HAVE TO CODE IN BASE 64 THE PAYLOAD .-.

### Privilege Escalation

Suid 
--- 

## Access

If you can intercept or modify the extention or any bypass works upload a .htaccess with the next content

Overriding the server configuration

```bash
AddType application/x-httpd-php .ext
```

Once we got access as we can see the users have the name svc so we're in an active directory

Enumerate with powerview
- Users
- Groups
- Domains
If we see a Service Principal Name (SPN) try kerberoasting attack

### Privilege Escalation

With a DLL hijacking we got the privesc because the SeManageVolume Exploit worked.

---

## Hutch

Cadaver para un webdav