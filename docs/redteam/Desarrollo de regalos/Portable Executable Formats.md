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

La estructura de un PE tiene varias secciones:

Los headers que describen el archivo , las secciones que contienen el código, datam imports, exports, recursos, relocation information y otra metadata.

### DOS Header

The first structure in a PE file is the DOS header, represented by the `IMAGE_DOS_HEADER` structure. Unfortunately, it is defined in the `winnt.h` header file.

```c
typedef struct _IMAGE_DOS_HEADER {      // DOS .EXE header
    WORD   e_magic;                     // Magic number
    WORD   e_cblp;                      // Bytes on last page of file
    WORD   e_cp;                        // Pages in file
    WORD   e_crlc;                      // Relocations
    WORD   e_cparhdr;                   // Size of header in paragraphs
    WORD   e_minalloc;                  // Minimum extra paragraphs needed
    WORD   e_maxalloc;                  // Maximum extra paragraphs needed
    WORD   e_ss;                        // Initial (relative) SS value
    WORD   e_sp;                        // Initial SP value
    WORD   e_csum;                      // Checksum
    WORD   e_ip;                        // Initial IP value
    WORD   e_cs;                        // Initial (relative) CS value
    WORD   e_lfarlc;                    // File address of relocation table
    WORD   e_ovno;                      // Overlay number
    WORD   e_res[4];                    // Reserved words
    WORD   e_oemid;                     // OEM identifier (for e_oeminfo)
    WORD   e_oeminfo;                   // OEM information; e_oemid specific
    WORD   e_res2[10];                  // Reserved words
    LONG   e_lfanew;                    // Offset to the NT header
  } IMAGE_DOS_HEADER, *PIMAGE_DOS_HEADER;

```


Los miembros más importantes de esta estructura son:

- `e_magic` - Also referred to as the _DOS signature_. This is a 2-byte field with a fixed value of `MZ`, or `0x5A4D` as a little-endian WORD. It is used to validate the DOS header. If this field contains anything other than `MZ`, then the inspected structure is not a valid `IMAGE_DOS_HEADER`, and the parsed file is not a valid PE file. It is worth noting that the DOS signature is represented programmatically by the `IMAGE_DOS_SIGNATURE` constant.
    
- `e_lfanew` - A 4-byte value that stores the file offset to the start of the NT headers. This field is always located at offset `0x3C` inside the DOS header.


### DOS Stub

After the DOS header and before the NT headers, there is usually a _DOS stub_. This is a small [DOS](https://en.wikipedia.org/wiki/DOS)-compatible program that prints a message such as:

### NT Headers

After the DOS header and DOS stub comes the NT headers. The NT headers are reached using the `e_lfanew` member from the previously discussed `IMAGE_DOS_HEADER` structure, but unlike `IMAGE_DOS_HEADER`, the NT headers structure varies depending on the machine's architecture:

- [IMAGE_NT_HEADERS32](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-image_nt_headers32) representing the 32-bit version:

```c
typedef struct _IMAGE_NT_HEADERS {
  DWORD                   Signature;               // Same as IMAGE_NT_HEADERS64
  IMAGE_FILE_HEADER       FileHeader;              // Same as IMAGE_NT_HEADERS64
  IMAGE_OPTIONAL_HEADER32 OptionalHeader;          // IMAGE_OPTIONAL_HEADER32
} IMAGE_NT_HEADERS32, *PIMAGE_NT_HEADERS32;
```

- [IMAGE_NT_HEADERS64](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-image_nt_headers64) representing the 64-bit version:

```c
typedef struct _IMAGE_NT_HEADERS64 {
    DWORD                   Signature;           // Same as IMAGE_NT_HEADERS32
    IMAGE_FILE_HEADER       FileHeader;          // Same as IMAGE_NT_HEADERS32
    IMAGE_OPTIONAL_HEADER64 OptionalHeader;      // IMAGE_OPTIONAL_HEADER64
} IMAGE_NT_HEADERS64, *PIMAGE_NT_HEADERS64;
```

Both versions contain the same three main members:

- `Signature` - A 4-byte signature used to validate that the parser has reached the PE header. This value should be `PE\0\0`, or `0x00004550` as a little-endian DWORD. This is represented programmatically by the `IMAGE_NT_SIGNATURE` constant.
    
- `FileHeader` - An [IMAGE_FILE_HEADER](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-image_file_header) structure that contains general information about the PE file, such as the target architecture, the number of sections, and several file characteristics.
    
- `OptionalHeader` - An `IMAGE_OPTIONAL_HEADER32` or `IMAGE_OPTIONAL_HEADER64` structure that contains important information required by the Windows loader, such as the image base, entry point, section alignment, subsystem, data directories, and security-related flags. Both versions serve the same purpose, but the 64-bit version uses larger fields for values such as `ImageBase`, stack sizes, and heap sizes, and does not contain the `BaseOfData` member found in the 32-bit version.

