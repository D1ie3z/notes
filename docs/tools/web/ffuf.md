---
title: ffuf
sidebar_position: 1
---

## ¿Qué es?

Una de las miles de herramientas que existen para hacer directory discover, pongo esta porque tengo alias y cosillas que funcionan cool :)


## Tips 

- Reduce la fricción requerida de fuzzing
- No gastes tiempo, esperando resultados
- No pierdas resultados
- Usa wordlists vivas
- Haz un Fuzzing grande y distribuido
- Ve sobre los resultados grandes y largos (Filtra por tamaño de respuesta, custom binary)
- Usa IA para construir sistemas, usa la IA para analisis.
- FUZZEA AUTENTICADO
- Si usas -t 3 previenes que te bloqueen la cuenta
- Usa custom agents, recursiones, fuzzing autenticado, manejando 429s, para evitar el fingerprint
- Guardar los resultados.
- fuzzing with /FUZZ and /FUZZ/ can both be good - (grande rez0)
- Pues si tienes varo y VPS, puedes dejar fuzzeando ahí, pero ojo depende mucho de lo que hagas si es un pentest con autoscaling eso afecta al cliente, pero si solo es hacking normal date
- En tus outputs verifica el size y ve los outliers

### Reduce la fricción requerida de fuzzing

Autocalibrate ve que codigo es el más comun y es donde se va a concentrar

- Bash alias
- Discord bot where you can go and do ffuf

### No gastes tiempo, esperando resultados

Si le das enter lo puedes pausar y ya poner otro filtro más.

> Aunque de todos checa we porque puede ser un arma de doble filo el estar filtrando de más 

### No pierdas resultados

Guarda los escaneos en archivos!!!

## Usa wordlists vivas

Las listas estaticas son buenas, pero lo ideal es ir actualizando todo.

Para esto puedes usar un `anew` y meterlo en un alias.

Si ves una path única interesante tipo `secreto-nuevo-administrador`. Siempre añade si puedes.

```bash

cat new_paths.txt | anew super_wordlist.txt

```

## Personalización

Esto lo puedes meter en un alias o en un bash para que se ejecute de forma auto todas las flags.

```bash
    ffuf -c -v -u https://URL.COM/FUZZ -w /usr/share/anyWordlist \
    -H "User-Agent: Mozilla Firefox Mozilla/5.0 X-Bug-bounty: 10" \
    -H "X-Bug-Bounty: 10" \
    -recursion -recursion-depth 10 \
    -t $thread \
    -mc all -ac -fc=400 \
    -o recursive/recursive_$dom.csv -of csv $4
```

> Juega y construye tus alias ;)


