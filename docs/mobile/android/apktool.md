---
title: apktool
sidebar_position: 1
---

## ¿Qué es?
Si bien todos los apk no son mas que ficheros zip, la forma mas eficiente de obtener la información interna de estos, es utilizando apktool, esto porque al utilizar apktool, no solo obtendremos los ficheros internos, si no tambien, se hara el desensamblado del aplicativo (Y tambien podemos reempaquetar con esta herramienta).


Extraer datos de la apk y desensamblar:

```bash
apktool d <path_to_apk>
```

Al desensamblar/extraer, se generara un fichero apktool.yml el cual contiene información para que apktool sea capaz de volver a empaquetar el apk.

Hacer repack a un apk(Desde la carpeta del apk y se guaradara en ./dist):

```bash
apktool b
```