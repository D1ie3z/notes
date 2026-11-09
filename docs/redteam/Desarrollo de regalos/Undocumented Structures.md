---
title: Undocumented Structures
sidebar_position: 5
---

## Windows SDK, WDK, and Microsoft Learn

The installed Windows SDK and WDK should be checked first. Microsoft has documented additional Native API functions, structures, and information classes over time, meaning an older third-party definition may no longer be necessary. Useful headers include [winternl.h](https://learn.microsoft.com/en-us/windows/win32/api/winternl/), [ntddk.h](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntddk/), and [wdm.h](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/). Not every declaration in these headers has a dedicated Microsoft Learn page.

In some cases, Microsoft Learn documents the function or information class that uses a structure rather than publishing a separate page for the structure itself. For example, `SYSTEM_PROCESS_INFORMATION` and `SYSTEM_THREAD_INFORMATION` are documented as part of the [NtQuerySystemInformation](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntquerysysteminformation) documentation rather than through separate structure pages. Other types may only be discoverable by inspecting the installed header files.

Visual Studio's [Go To Definition](https://learn.microsoft.com/en-us/visualstudio/ide/go-to-and-peek-definition?view=visualstudio#go-to-a-definition) functionality can be used to open the definition provided by the locally installed SDK or WDK.

## Microsoft Public Symbols

Microsoft's public symbols are generally the best source for determining the layout used by the exact Windows build being debugged. They are downloaded from the [Microsoft Public Symbol Server](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/microsoft-public-symbols) and may contain function names, global symbols, type information, structure members, and member offsets that WinDbg can use when interpreting memory. Once the appropriate symbols are loaded, commands such as `dt ntdll!_PEB`, `dt ntdll!_RTL_USER_PROCESS_PARAMETERS`, and `dt nt!_EPROCESS` can be used to inspect the available structure definitions.

In WinDbg, the symbol path can be configured using the `.symfix` command, after which `.reload` can be used to load or refresh the required symbols. Refer to the Microsoft documentation for the [.symfix command](https://learn.microsoft.com/en-us/windows-hardware/drivers/debuggercmds/-symfix--set-symbol-store-path-), the [.reload command](https://learn.microsoft.com/en-us/windows-hardware/drivers/debuggercmds/-reload--reload-module-), and [Custom Symbol Stores and Symbol Servers](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/symbol-stores-and-symbol-servers) for more information.

However, it is important to note that not every private type is guaranteed to be present in public symbols. If `dt` reports that a type cannot be found, another source may be required.

##  System Informer

[System Informer](https://github.com/winsiderss/systeminformer), formerly known as Process Hacker, maintains a collection of Native API definitions in its [phnt header files](https://github.com/winsiderss/systeminformer/tree/master/phnt/include). These definitions were gathered from official Microsoft headers, Microsoft symbol files, reverse engineering, and other research. Although they are not part of the official Windows SDK, they are actively maintained and can provide complete definitions for structures that are missing or partially documented in the public Windows headers.

Some useful headers include [ntpebteb.h](https://github.com/winsiderss/systeminformer/blob/master/phnt/include/ntpebteb.h), which contains definitions related to the PEB, TEB, process parameters, and loader structures; [ntpsapi.h](https://github.com/winsiderss/systeminformer/blob/master/phnt/include/ntpsapi.h), which contains process, thread, job, and process-creation definitions; [ntexapi.h](https://github.com/winsiderss/systeminformer/blob/master/phnt/include/ntexapi.h), which contains system information classes and their associated structures; and [ntmmapi.h](https://github.com/winsiderss/systeminformer/blob/master/phnt/include/ntmmapi.h), which contains Native API memory-management definitions.

The complete header collection can also be included in a Visual Studio project. However, the latest Windows SDK should be installed, and the appropriate `PHNT_VERSION` value should be defined before including the headers. For example, `PHNT_WINDOWS_11` can be used when compiling code that requires definitions available on Windows 11. For more information check the [Usage section](https://github.com/winsiderss/systeminformer/tree/master/phnt#usage) of their readme file.

## NtDoc

[NtDoc](https://ntdoc.m417z.com/) provides searchable online documentation for Native API functions, structures, enumerations, constants, and information classes. Its Native API documentation is primarily based on System Informer's `phnt` headers, but the definitions are presented in a format that is easier to search and navigate than the header files themselves.

NtDoc can be used to locate a structure definition, determine which header contains it, identify the functions that use it, and inspect related structures or enumerations. Many entries also describe the purpose of individual members and whether function parameters are used for input, output, or both.

NtDoc also incorporates information from the official Windows Driver Kit and parts of the Win32 API documentation. Where available, entries include links to the corresponding Microsoft documentation and the original definition in the System Informer repository.

## ReactOS

[ReactOS](https://github.com/reactos/reactos) is an open-source operating system designed to be compatible with Windows applications and drivers. Its source code contains definitions and implementations for many NT-compatible structures, functions, and internal operating system components.

The generated [ReactOS Doxygen documentation](https://doxygen.reactos.org/globals_type.html) can be used to search for structure definitions and identify the source files in which they are declared or used. The ReactOS source code can also help explain the relationships between structures and how their members may be used by an NT-compatible operating system.

However, ReactOS is an independent implementation and does not necessarily use the same internal structure layouts as Microsoft Windows. Therefore, its definitions should not be treated as authoritative when exact member offsets or build-specific Windows layouts are required.

## Historical Sources

Older resources such as [undocumented.ntinternals.net](https://web.archive.org/web/20230401045934/http://undocumented.ntinternals.net/) may still be useful when researching historical Native API functions, structures, or behavior from older Windows versions.

However, much of the information provided by these sources predates modern Windows releases. They should not be used as the primary source for current Windows 11 structure definitions.

Any definition obtained from a historical source should be compared with the installed Windows headers, Microsoft public symbols, System Informer, NtDoc, or another maintained source before it is used.