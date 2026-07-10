---
title: Nmap
sidebar_position: 1
---

## Nomas por poner

Uso estos comandos:

```bash

# PUEDES SEPARAE EL -sCV pa que no tarde tanto y modifica el min rate, nmap es en pruebas controladas o maquinolas
sudo nmap -sS -sCV -p- --open --min-rate 5000 -n -vvv -Pn IP -oN targeted

# UDP

sudo nmap -sU -p- --open --min-rate 5000 -Pn IP

```

## Fast nmap pivot

```bash
seq 1 65535 | xargs -P 500 -I {} proxychains nmap -sT -Pn -p{} -open -T5 -v -n 10.185.10.27 2>&1 | grep "tcp open"
```