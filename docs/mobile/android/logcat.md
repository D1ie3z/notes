---
title: Logcat
sidebar_position: 1
---
## ¿Por qué?

Dentro de los aplicativos, los desarrolladores suelen colocar logs, ya sea para guiarse durante el proceso de desarrollo o para poder saber que está haciendo la app, estos se pueden observar a través de logcat

Visualizar logs

```markdown
adb logcat
```

Es posible cambiar el formato de los logs utilizando la flag -v

```
adb logcat -v <log_format>
```

Los formatos existentes son:

| brief | Muestra la prioridad, la etiqueta y el PID del proceso que emite el mensaje. |
| --- | --- |
| long | Muestra todos los campos de metadatos y mensajes separados por líneas en blanco. |
| process | Muestra solo el PID. |
| raw | Muestra el mensaje del registro sin formato y sin otros campos de metadatos. |
| tag | Muestra la prioridad y la etiqueta únicamente. |
| thread | Es un formato heredado que muestra la prioridad, el PID y el TID del subproceso que emite el mensaje. |
| threadtime | (opción predeterminada) Muestra la fecha, la hora de invocación, la prioridad, la etiqueta, el PID y el TID del subproceso que emite el mensaje. |
| time | Muestra la fecha, la hora de invocación, la prioridad y la etiqueta, y el PID del proceso que emite el mensaje. |

# **Log Filtering**

Es posible llevar a cabo un filtrado de logs . Por ejemplo, si solo queremos los logs que genera `MainActivity`, podemos filtrar de la siguiente forma:

```
adb logcat "MainActivity:V *:S"
```

Explicación:

- `MainActivity:V` Se asegura que solo se loggeen logs pertenecientes a MainActivity con una severidad Verbose o superior
- `*:S` Se ignoran todos los tags con severidad Silent o inferior (O sea todos ya que no hay nada mas abajo)

Severidades de logs:

|  | Log level |
| --- | --- |
| V | Verbose |
| D | Debug |
| I | Info |
| W | Warning |
| E | Error |
| F | Fatal |
| S | Silent |