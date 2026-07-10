---
title: JS Files
sidebar_position: 1
---

## Analizalos y leelos 

No subestimes el poder de js muchas de las aplicaciones modernas se basan en js y puedes sacar cosas jugosas.

Esta tool ta rica:

- https://github.com/schooldropout1337/lazyegg

```bash
echo example.com | katana -d 5 | grep -E "\.js$" | nuclei -t /path/to/nuclei-templates/http/exposures/ -c 30
cat alljs.txt | nuclei -t /path/to/nuclei-templates/http/exposures/
```

Usa grep tambien manual si gustas

```bash
# Buscar keys, secrets, tokens
rg "apiKey|secret|password|encrypt|AES|token" main_clean.js

# Buscar URLs
rg "https?://[^\s\"']+" main_clean.js

# Buscar patrones de JWT
rg "eyJ[A-Za-z0-9]+" main_clean.js
```

## Script en consola para obtener rutas

Muchas gracias @fl4m3 :)

```js
javascript:(function(){var scripts=document.getElementsByTagName("script"),regex=/(?<=(\"|\'|\`))\/[a-zA-Z0-9_?&=\/\-\#\.]*(?=(\"|\'|\`))/g;const results=new Set;for(var i=0;i<scripts.length;i++){var t=scripts[i].src;""!=t&&fetch(t).then(function(t){return t.text()}).then(function(t){var e=t.matchAll(regex);for(let r of e)results.add(r[0])}).catch(function(t){console.log("An error occurred: ",t)})}var pageContent=document.documentElement.outerHTML,matches=pageContent.matchAll(regex);for(const match of matches)results.add(match[0]);function writeResults(){results.forEach(function(t){document.write(t+"<br>")})}setTimeout(writeResults,3e3);})();
```

Otras tools:

- jsparser
- Linkfinder
- prettier.io
- beautifer.io
- https://deobfuscate.io/
- obfuscator.io
- unpacker
- webcrack (instalala con npm)
- synchrony
- js-beautify

Patrones comunes para saber cual usar:

### obfuscator.io
`while(!![])  +  array gigante  +  función _0xABC(index)`
### JJEncode / PackedJS

`eval(function(p,a,c,k,e,d)`

### JSFuck variant

`_$_` como prefijo

### Webpack — no es ofuscación, es bundling

Webpack chunks `__webpack_require__`


> Ofuscar es importante para los payloads y evitar detección de IDS o WAFs

> Intentar mandar las peticiones del JS para ver que es lo que está haciendo


NOTA: Vas a ver ofuscado y así bien pinche raro el js, trata de ver si viene harcodeada la llave AES en el mismo JS para ver su contenido ;)

> Ya de ultimas a la IA dile que te ayude a analizarlo (si es que sigue viva y pública para todos XD)

# Js Moderno

Cuando atacas una aplicación web a fondo, aprendes qué endpoints, tokens, y patrones existen en su JS. El problema es que cuando vuelves semanas después, la app cambió y no sabes qué cambió.

## ¿Por qué se actualizan los JS? La raíz del asunto

Los JS modernos no son archivos estáticos simples. Aquí está el porqué cambian:

**Build systems y bundlers.** La mayoría de apps grandes usan Webpack, Vite, esbuild, etc. Cada vez que un dev hace deploy, el bundler recompila todo el código fuente en uno o varios archivos JS. Este proceso genera nombres con hashes como `main.a3f9c2.js`. El hash cambia si cambió cualquier línea de código.

**Por qué el hash en el nombre:** El navegador cachea archivos por URL. Si el archivo siempre se llama `main.js`, el navegador usa la versión cacheada. Al meter un hash en el nombre, un nuevo deploy genera una URL nueva, forzando al navegador a descargar la versión fresca. Esto se llama **cache busting**.

**Por qué importa esto para bug hunting:**

- Cada deploy nuevo = potencialmente código nuevo
- El código nuevo puede exponer endpoints que antes no existían
- Puede revelar feature flags, rutas internas, tokens hardcodeados, lógica de negocio, etc.
- A veces el dev comete un error en un deploy puntual que expone algo sensible y lo corrige en el siguiente

```
- common.99a1a818d1e35304356e.js → código compartido entre módulos
- main.4ceeb7a803308d605697.js → punto de entrada principal (el más jugoso) 
- polyfills.7f2c4beb2607ba3f9300.js → compatibilidad con browsers viejos (poco interés)
- runtime.52d2646af675e833a9a0.js → bootstrap de webpack (poco interés)te dice que significa cada id
- scripts.efdd0fbfa0839df7b9f9.js → scripts varios
```

> YO TE RECOMIENDO QUE HAGAS TODO A MANO PRIMERO PARA QUE ENTIENDAS QUE HACES. YA SI LO ENTIENDES AUTOMATIZA EL PROCESO PARA MÁS EFICIENCIA
