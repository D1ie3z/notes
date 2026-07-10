---
title: Permisos
sidebar_position: 1
---

## ¿Qué es?
Existen diversos permisos dentro del sistema Android:

## Normal

TL;DR; Permisos que el sistema da automáticamente (Funciones sin riesgo, p. ej. el acceso a internet).

Este es el valor predeterminado. Es un permiso de riesgo bajo. Este es un permiso que otorga a las aplicaciones solicitantes acceso a funciones aisladas a nivel de aplicación con un riesgo mínimo para otras aplicaciones, el sistema o el usuario.

El sistema concede automáticamente este tipo de permiso a una aplicación solicitante durante la instalación, sin pedir la aprobación explícita del usuario, aunque este siempre tiene la opción de revisar estos permisos antes de la instalación.

## Dangerous

TL;DR; Permisos que el usuario tiene que aceptar con un popup (Funciones con algo de riesgo, p. ej. el acceso a los contactos).

Este es un permiso de mayor riesgo que otorga a la aplicación solicitante acceso a datos privados del usuario o control sobre el dispositivo, lo que puede afectar negativamente al usuario.

Dado que este tipo de permiso conlleva un riesgo potencial, es posible que el sistema no lo conceda automáticamente a la aplicación solicitante. Por ejemplo, cualquier permiso peligroso solicitado por una aplicación podría mostrarse al usuario y requerir su confirmación antes de continuar, o podría adoptarse algún otro enfoque para evitar que el usuario conceda automáticamente el uso de dichas funciones.

Algo relevante es que a partir de Android 5, aparte de declararlo en el Manifest, tambien se tiene que solicitar dinamicamente en el codigo JAVA.

## Signature

TL;DR; Permisos que para obtenerlo tiene que estar firmada tu app con el mismo certificado que la app declaro (Funciones que utilizan multiples aplicaciones del mismo desarrollador).

Es un permiso que el sistema otorga solo si la aplicación solicitante está firmada con el mismo certificado que la aplicación que declaró el permiso. Si los certificados coinciden, el sistema otorga automáticamente el permiso sin notificar al usuario ni solicitarle aprobación explícita.

Un problema aqui, es que si descargamos una app secundaria, que no tenga la declaracion del permiso. el permiso sera normal por default, haciendo que podamos crear una app y declarar el permiso nosotros:

Common mistakes when using permissions in Android | Oversecured Blog

## Privilege Escalation/Permission Hijacking

Si la app expone alguna forma de aprovecharse de un permiso, p.ej, un intent con permiso a los contactos que este expuesto y otra app pueda utilizarlo para ver los contactos. Esto es una vulnerabilidad de privilege escalation/permission hijacking.

## Permisos en componentes exportados

La forma más robusta de proteger los componentes es no exportándolos, sin embargo, también es posible exportarlos y colocar algunos permisos. Estos se colocan dentro del tag en el AndroidManifest y se pone como android:permission=”asdasdasd”

Un permiso comun es android.permission.BIND_JOB_SERVICE. Este permiso permite a el sistema hacer bind a un servicio. Este permiso se usa regularmente para que el WorkManager del sistema se comunique con la app y posteriormente ejecutar ese servicio en el futuro (Como una especie de cron).

De igual forma, es posible que una app requiera algun permiso para acceder a sus componentes. P. ej. una app tiene un intent con la localización del usuario, y lo quiere compartir, lo correcto seria que la otra app tuviera tambien el permiso de localización, o se haria un privilege escalation de igual forma.

Android Core Manifest para verificar el nivel de un permiso:

core/res/AndroidManifest.xml - platform/frameworks/base - Git at Google

Algo relevante es que muchos vendors modifican los permisos de android, o crean sus propios permisos y despues no los declaran o los declaran de forma incorrecta:

Two weeks of securing Samsung devices: Part 2 | Oversecured Blog

Discovering vendor-specific vulnerabilities in Android | Oversecured Blog

## Permisos Custom

Una app puede crear sus propios permisos, y utilizar de igual forma los niveles normal, dangerous, etc… esto se hace utilizando el tag permission

```java
<permission android:label="@string/permission_run_command_label"
    android:icon="@mipmap/ic_launcher"
    android:name="com.termux.permission.RUN_COMMAND"
    android:protectionLevel="dangerous"
    android:description="@string/permission_run_command_description"/>
```

## Protected Broadcast

De igual forma, hay protectedBroadcasts, los cuales mediante un permiso evitan que cualquier app envie broadcast protegidos (Por ejemplo enviar un broadcast de bateria baja).