---
title:Windows Memory Management
sidebar_position: 1
---

## Que onda

Modern operating systems do not allow normal user-mode processes to directly access physical memory, meaning RAM. Instead, each process works with its own [virtual address space](https://learn.microsoft.com/en-us/windows-hardware/drivers/gettingstarted/virtual-address-spaces). The operating system and processor translate virtual addresses into physical memory locations when needed.

> Shared DLL image pages: Se trata de un mecanismo de gestión de memoria en Windows donde las **páginas físicas** de un archivo **DLL** compartido (como `imageres.dll o` shared.dll`) se asignan a múltiples procesos simultáneamente para ahorrar recursos