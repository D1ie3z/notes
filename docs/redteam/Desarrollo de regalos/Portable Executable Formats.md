---
title: Portable Executable Formats
sidebar_position: 1
---

## Qué es?

Basicamente los archivos ejecutables. Se les pone el acronimo PE (Portable Executable). Cuando piensan en ejecutables, lo primero que se viene a la mente es `.exe`. Sin embargo existen otros formatos en windows cómo `.dll`, `.sys`, `.scr`, `.ocx`, y `.cpl` que usualmente son PE's.

Un PE no solo es un bloque de código ejecutable, es un archivo estructurado que le dice a Windows cómo la imagen debe ser cargada en memoría, donde la ejecución debe iniciar, cuales son las DLLs requeridas, donde las funciones son importadas y exportadas, cuales son las secciones donde hay R,W,X y que metadata de seguridad tiene relacionada


## File vs Image

- **Archivo de Objeto (Object File):** Es el resultado de la compilación pero **antes del enlace**. Contiene código máquina parcial que aún no está vinculado con bibliotecas externas ni resuelto completamente. El enlazador (_linker_) toma estos archivos como entrada para procesar referencias pendientes.
    
- **Archivo de Imagen (Image File):** Es el resultado final generado por el enlazador. Es el archivo **ejecutable listo para ser cargado** en la memoria por el sistema operativo (como los archivos `.exe` o `.dll`). A diferencia del objeto, la imagen ya contiene las direcciones de memoria resueltas y toda la información necesaria para el cargador (_loader_).


### File On Disk vs Image In Memory

Hay dos vistas distintas de un PE:

- **The File View** - This is how the PE exists on disk. Offsets are _file offsets_, meaning positions inside the physical file

- **The Memory View** - This is how the PE looks after the Windows loader maps it into a process address space. Addresses in this view are _virtual addresses_.


These two views are related, but they are not identical. Windows does not simply copy the PE file byte-for-byte into memory and execute it from the same layout that exists on disk. Instead, the Windows loader (Windows component that loads PE files into memory) reads the PE headers, reserves memory for the image, maps each section into memory, applies the required permissions, resolves API imports, performs relocations if needed, and then transfers execution to the image entry point. This means that a byte located at file offset `0x400` on disk may appear at _[relative virtual address](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format#:~:text=Relative%20virtual%20address%20\(RVA\))_ (RVA) `0x1000` after the image is mapped into memory.


## PE Structure

La estructura de 

![[Pasted image 20261029142947.png]] 