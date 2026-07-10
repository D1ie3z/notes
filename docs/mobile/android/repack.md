---
title: repack apk
sidebar_position: 1
---

## ¿Qué es?
Si despues de hacer reversing se desea modificar algo de la app, es posible hacer un patching and repack, esto se puede hacer con apktool y el proceso es sencillo.


## **Packing APKs**

Es posible llevar a cabo un repacking de una apk usando `apktool b` el resultado quedara en el folder `./dist` 

Esta nueva apk no estara firmada, por lo cual es necesario llevar a cabo ese proceso.

## Firmado del APK

### **Creando un keystore**

Primeramente es necesario llevar a cabo la creación de un keystore, en este caso sera `research.keystore` el cual es un fichero que contendra la llave de firmado.

El siguiente comando genera un keystore llamado `research.keystore` con una llave llamada `research_key`  :

```bash
keytool -genkey -v -keystore research.keystore -alias research_key -keyalg RSA -keysize 2048 -validity 10000

```

Nota: Se puede dar enter a todo, y solo al final en la confirmación poner `yes`.

Nota2: Te pide una contraseña, no la olvides!, se ocupara para firmar la app.

### **Firmando el APK**

Para firmar el apk, se puede usar `jarsigner`:

```bash
#Apps viejitas:
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore research.keystore app.apk research_key
# En las apps nuevas SHA1 posiblemente sera rechazada. En ese caso, basta con usar los algoritmos por defecto
jarsigner -verbose -keystore research.keystore app.apk research_key

```

# Posibles errores:

- **INSTALL_PARSE_FAILED_NO_CERTIFICATES:** There is still something wrong with the signature.

Puede que estes instalando un apk sin firmar o el algoritmo elegido (por ejemplo, SHA1) fue rechazado.

- **INSTALL_FAILED_INVALID_APK:** Failed to extract native libraries

Este error se produce con algunas versiones de apktool si la aplicación contiene bibliotecas nativas. Para solucionarlo, se tiene que editar el archivo `AndroidManifest.xml`de la siguiente forma `android:extractNativeLibs="true"` esto hara que extractNativeLibs este en true. Después, se tiene que volver a empaquetar y volver a firmar el APK.

- **INSTALL_FAILED_UPDATE_INCOMPATIBLE:** Package `io.cabr4.reversingexample` signatures do not match previously installed version; ignoring!

Este error se presenta si tienes la app instalada debido a que las firmas no coinciden, basta con desinstalar (adb uninstall) y volver a instalar la nueva app repackeada.

- **Failed parse during installPackageLI:** Targeting R+ (version 30 and above) requires the resources.arsc of installed APKs to be stored uncompressed and aligned on a 4-byte boundary'

Esto pasa en apps nuevas, se soluciona usando `zipalign` y `apksigner` :

```bash
$ apktool b
$ [...]/build-tools/34.0.0/zipalign -p -f -v 4 ./dist/<apktool_build>.apk aligned.apk
$ [...]/build-tools/34.0.0/apksigner sign --ks ./research.keystore ./aligned.apk
```

De igual forma es posible utilizar uber-apk-signer para llevar a cabo la firma.

https://github.com/patrickfav/uber-apk-signer

En mi sistema no tengo rutas default (Y uso windows), así que agrego mi lista de comandos para hacerle copypaste facilmente.

Comandos del kev:

```bash
"C:\Program Files\Java\jdk-21\bin\keytool.exe" -genkey -v -keystore research.keystore -alias research_key -keyalg RSA -keysize 2048 -validity 10000

"C:\Program Files\Java\jdk-21\bin\jarsigner.exe" -verbose -keystore research.keystore io.hextree.reversingexample.apk research_key

"C:\Users\cabraLechera\AppData\Local\Android\Sdk\build-tools\35.0.0\zipalign.exe" -p -f -v 4 io.hextree.reversingexample.apk aligned.apk

"C:\Users\cabraLechera\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat" sign --ks research.keystore aligned.apk
```