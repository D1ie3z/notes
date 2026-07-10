---
title: Comandos Adb
sidebar_position: 1
---

## ¿Qué es?

Adb nos permite llevar a cabo una comunicación entre nuestra computadora y el dispositivo.

Instalar una aplicación (apk):

```bash
adb install <path to .apk>
```

Instalar una aplicación multiple (multiapk)

```bash
adb install-multiple file1.apk file2.apk file3.apk
```

Listar todos los packages(apps) instalados(incluidos los que vienen con el sistema)

```bash
adb shell pm list packages
```

Listar solo los paquetes de terceros:

```bash
adb shell pm list packages -3
```

Limpiar todos los datos del aplicativo sin eliminarlo (Limpiar cache, datos almacenados, etc…):

```bash
adb shell pm clear <package_name>
```

Listar información de un package (actividades exportadas, permisos, etc…):

```bash
adb shell dumpsys package <package_name>
```

Iniciar una actividad de la aplicación

```bash
adb shell am start <package_name>/<activity_name>
```

Desinstalar una aplicación

```bash
adb uninstall <package_name>
```

Obtener una apk instalada en el dispositivo:

```bash
adb shell pm list packages -3
adb shell pm path com.example.someapp
adb pull /data/app/com.example.someapp-2.apk path/to/desired/destination
```

Documentación de PM:

- https://developer.android.com/tools/adb?hl=es-419#pm