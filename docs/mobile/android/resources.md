---
title: Resources
sidebar_position: 1
---

## ¿Qué es?
Cuando se define una cadena que se imprimira en la aplicación, esta se coloca dentro de la carpeta res, esto debido a que si se hace una traducción de la app, android sepa que mostrar.

Por ejemplo, si el idioma del dispositivo esta puesto en frances, android buscara las cadenas de:

```java
res/values-fr/strings.xml
```

Si esta en japones buscara en:

```java
res/values-ja/strings.xml
```

Y si es otro distinto a japones y frances, cargara los valores por defecto:

```java
res/values/strings.xml
```