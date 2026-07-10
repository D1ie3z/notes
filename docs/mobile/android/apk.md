---
title: APK
sidebar_position: 1
---

## ¿Qué es?

La gran mayoría de aplicativos Android tienen un formato APK, el cual es un empaquetado utilizado para contener todos los datos (código, imágenes, etc…) de un aplicativo

La mayoria de aplicaciones de Android nativas, son escritas en Java o Kotlin, este al compilar se convierte en ficheros *.class.

Estos ficheros *.class son Bytecode de Java.

Posteriormente estos ficheros *.class utilizan un compilador llamado d8, el cual se encarga de convertirlo a classes.dex (classes.dex contiene Dalvik Bytecode, el cual es un tipo de de bytecode diseñado especialmente para android).

El Dalvik Bytecode, en las versiones anteriores de Android utilizaba la Dalvik VM para su ejecución. Actualmente se utiliza ART (Android RunTime), el cual se encarga de convertir el Dalvik Bytecode en codigo nativo del procesador en especifico que usa el dispositivo.

ART utiliza ahead-of-time compilation, lo cual genera que la instalación de aplicaciones sea un poco mas lenta, pero obviamente mejora muchisimo el rendimiento del aplicativo.

!image.png

## ¿Que es realmente un APK?

Un apk no es mas que un empaquetado de classes.dex, AndroidManifest.xml, la carpeta resources y una firma. Dentro de un zip, al cual posteriormente se le cambiara la extension a .apk

!image.png

Si extraemos los datos de la apk, encontraremos muchas carpetas y datos, los cuales son:

| AndroidManifest.xml |  |  |
| --- | --- | --- |
| kotlin |  |  |
| lib |  |  |
| META-INF |  |  |
| assets | Las bibliotecas nativas de la aplicación, por defecto, se encuentran aquí.

En el directorio lib/ hay directorios específicos para cada CPU. Por ejemplo: armeabi, mips, |  |
