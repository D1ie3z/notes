---
title:Windows Architecture
sidebar_position: 1
---

## Que show

En Windows, el procesador opera en dos modos distintos para garantizar la estabilidad y seguridad del sistema: **User mode** y **Kernel mode**. La principal diferencia radica en los niveles de privilegio y el acceso a los recursos de hardware.

- **User mode**: Es un entorno restringido donde se ejecutan las aplicaciones de usuario (como navegadores o editores de texto). Cada proceso tiene su propio espacio de direcciones virtual privado, lo que impide que una aplicación acceda directamente al hardware o a la memoria de otras aplicaciones. Si una aplicación en este modo falla, solo se cierra esa aplicación sin afectar al resto del sistema.
    
- **Kernel mode**: Es un modo privilegiado reservado para los componentes centrales del sistema operativo, el núcleo y los controladores de hardware. Todo el código en este modo comparte un único espacio de direcciones virtual y tiene acceso ilimitado a todos los recursos del sistema. Un error en este modo es catastrófico y suele provocar la caída total del sistema (pantalla azul).


### User Mode

- **System Processes** - These are important Windows processes that support the operating system itself. Examples include the Service Control Manager, [lsass.exe](https://en.wikipedia.org/wiki/Local_Security_Authority_Subsystem_Service), [winlogon.exe](https://learn.microsoft.com/en-us/windows/win32/secauthn/responsibilities-of-winlogon), [smss.exe](https://en.wikipedia.org/wiki/Session_Manager_Subsystem), and [csrss.exe](https://en.wikipedia.org/wiki/Client/Server_Runtime_Subsystem). Although these processes are part of the operating system, they still execute in user mode. This is an important distinction because not every operating system component runs in kernel mode.
- **Services** - Windows services are background programs that usually run without direct user interaction. Examples include services hosted by [svchost.exe](https://en.wikipedia.org/wiki/Svchost.exe), the Print Spooler service running as [spoolsv.exe](https://learn.microsoft.com/en-us/windows-hardware/drivers/print/introduction-to-spooler-components), and [WMI components](https://learn.microsoft.com/en-us/windows/win32/wmisdk/wmi-architecture) such as `WmiPrvSE.exe`. Services are commonly used by Windows itself, third-party software, endpoint security products, and enterprise management tools
- **Applications** - Applications are normal user-mode programs. Examples include Task Manager, File Explorer, PowerShell, Microsoft Word, Google Chrome, or custom programs compiled during this course. Applications commonly call functions exported by subsystem DLLs such as `kernel32.dll`, `KernelBase.dll`, `user32.dll`, `gdi32.dll`, `advapi32.dll`, and others. These DLLs expose many functions from the [Windows API](https://learn.microsoft.com/en-us/windows/win32/api/). For example:
    
    - [CreateFileW](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) - Used to create or open files, directories, devices, pipes, and other objects.
    - [VirtualAlloc](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualalloc) - Used to reserve, commit, or change the state of pages in the virtual address space of the calling process.
    - [VirtualProtect](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualprotect) - Used to change the protection of committed pages.
    - [CreateProcessW](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createprocessw) - Used to create a new process and its primary thread.
    - [CreateThread](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createthread) - Used to create a thread in the current process.
    - [CreateRemoteThreadEx](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-createremotethreadex) - Used to create a thread in another process.
    - [RegOpenKeyExW](https://learn.microsoft.com/en-us/windows/win32/api/winreg/nf-winreg-regopenkeyexw) - Used to open a registry key.
    - [MessageBoxW](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messageboxw) - Used to display a message box.

- **Windows Subsystem** - The Windows subsystem provides the environment that most Windows applications use. This includes the Win32 API environment, which exposes the APIs commonly documented under the [Windows API](https://learn.microsoft.com/en-us/windows/win32/api/). Modern Windows can also provide other user-mode environments, such as the [Windows Subsystem for Linux](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux) (WSL). These environments still rely on controlled interfaces when they need services from the operating system.
    
- **Ntdll.dll and Win32u.dll** - `ntdll.dll` and `win32u.dll` are low-level user-mode DLLs involved in transitioning requests from user mode into kernel mode. `ntdll.dll` exposes lower-level Native API routines. Microsoft documents some of these routines in the Windows SDK and WDK documentation, including:
    
    - [NtCreateFile](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile) - Used to create or open a file, directory, device, volume, or similar object.
    - [NtAllocateVirtualMemory](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntallocatevirtualmemory) - Used to reserve, commit, or both reserve and commit pages in the virtual address space of a process.
    - [NtFreeVirtualMemory](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntfreevirtualmemory) - Used to release or decommit virtual memory.
    - [NtQueryVirtualMemory](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntqueryvirtualmemory) - Used to query information about a region of virtual memory.
    
    For many standard system operations, `ntdll.dll` contains the syscall stub that prepares the system call and transfers execution into kernel mode. `win32u.dll` is used for many GUI and GDI-related system calls. For example, higher-level GUI functions exposed through `user32.dll` and `gdi32.dll` may eventually reach `win32u.dll` before entering kernel mode.

### Kernel Mode

- **System Service Dispatcher** - After a syscall enters kernel mode, the [System Service Dispatcher](https://www.ired.team/miscellaneous-reversing-forensics/windows-kernel-internals/glimpse-into-ssdt-in-windows-x64-kernel) routes the request to the appropriate kernel service routine. This dispatcher acts as the kernel-side entry point for many services requested by user-mode code.
    
-  **Windows Executive Components** - The Windows Executive contains several major kernel-mode managers responsible for core operating system functionality. These include the I/O Manager, Object Manager, Plug and Play Manager, Power Manager, Security Reference Monitor, Virtual Memory Manager, Process and Thread Manager, Configuration Manager, and Local Procedure Call components. These components are responsible for handling many important operating system tasks, including file operations, handle management, object access, memory management, process and thread creation, registry access, security checks, and communication between processes.
    
- **Window Manager, GDI, and Graphics Drivers** - GUI and graphics-related operations follow a related but separate path. Calls from `user32.dll` and `gdi32.dll` can enter kernel mode through `win32u.dll` and reach kernel-mode components such as `win32k.sys`, `win32kbase.sys`, and `win32kfull.sys`. These components are responsible for window management and GDI services. Graphics drivers then interact with the display hardware through the Windows Display Driver Model, or WDDM.
    
- **Windows Kernel** - The Windows kernel provides low-level operating system functionality such as scheduling, interrupt handling, exception handling, synchronization, timers, traps, and [Deferred Procedure Calls](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/introduction-to-dpc-objects), also known as DPCs. The Windows kernel image is stored on disk as [ntoskrnl.exe](https://en.wikipedia.org/wiki/Ntoskrnl.exe) under `C:\Windows\System32\ntoskrnl.exe`.
    
- **Hardware Abstraction Layer and Hardware** - The [Hardware Abstraction Layer](https://en.wikipedia.org/wiki/Hardware_abstraction), or [HAL](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/windows-kernel-mode-hal-library), provides an abstraction between Windows and the underlying hardware platform. Below the HAL is the physical hardware itself, including the CPU, memory, storage devices, network adapters, display devices, buses, interrupts, and other peripherals.


UN SID SE PUEDE CONVERTIR EN UN STRING LEGIBLE

|SID|Identity|
|---|---|
|`S-1-1-0`|Everyone|
|`S-1-5-18`|Local System|
|`S-1-5-32-544`|Built-in Administrators group|
|`S-1-5-32-545`|Built-in Users group|

>Ve las APIs de windows

> En el contexto de **Windows**, el término "page" suele referirse principalmente al **archivo de página** (`pagefile.sys`), un archivo de sistema oculto que forma parte de la **memoria virtual** del sistema operativo. Su función principal es extender la **RAM física** del ordenador; cuando la memoria disponible se agota, Windows mueve datos de baja frecuencia a este archivo en el disco duro o SSD para liberar espacio en la RAM y mantener el rendimiento de las aplicaciones activas.
### Page state

Una pagina en la memoria de windows puede tener distintos estados

- Free: A free page is not reserved or committed. It is not accessible to the process. A free address range can later be reserved, committed, or both reserved and committed. Attempting to read from or write to a free page will usually result in an access violation.
- A reserved page is a range of virtual address space that has been set aside for future use. The address range cannot be used by another allocation request, but it does not yet have committed storage associated with it. Reserved memory is useful when a program wants to reserve a large range of addresses and commit smaller parts of that range later. For example, `VirtualAlloc` can reserve memory using `MEM_RESERVE`.
- A committed page has memory charges allocated from the system's available commit limit, which is backed by RAM and paging files. A committed page is accessible only if its protection allows the requested operation. Committed does not always mean the page is already resident in physical RAM. The system can bring the page into memory when the process first accesses it. This is one reason virtual memory is more flexible than directly exposing physical RAM to applications. `VirtualAlloc` can commit memory using `MEM_COMMIT`.

### Page Protection Options

- [PAGE_NOACCESS](https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants#:~:text=Windows%20Server%C2%A02008.-,PAGE_NOACCESS,-0x01) - Disables all access to the committed pages. Reading, writing, or executing this region causes an access violation.
    
- [PAGE_READONLY](https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants#:~:text=PAGE_READONLY,0x02) - Enables read-only access to the committed region of pages. An attempt to write to the committed region results in an access violation.
    
- [PAGE_READWRITE](https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants#:~:text=an%20access%20violation.-,PAGE_READWRITE,-0x04) - Enables both read and write permissions to the commited region of pages.
    
- [PAGE_EXECUTE_READ](https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants#:~:text=PAGE_EXECUTE_READ,0x20) - Enables both execution and reading on the commited region of pages.
    
- [PAGE_EXECUTE_READWRITE](https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants#:~:text=2003%20with%20SP1.-,PAGE_EXECUTE_READWRITE,-0x40) - Enables Read, Write and Execute. This is highly discouraged from being used and is generally an IoC because it's uncommon for memory to be both writable and executable at the same time.
    
- [PAGE_GUARD](https://learn.microsoft.com/en-us/windows/win32/memory/memory-protection-constants#:~:text=Description-,PAGE_GUARD,-0x100) - Creates a guard page, where any attempt to access the guarded region (whether to write, execute, or ever read) will cause the system to raise an `STATUS_GUARD_PAGE_VIOLATION` exception and turn off the guard page status. Guard pages thus act as a one-time access alarm.

### Page Type

1. **Private Memory** - A region reported as [MEM_PRIVATE](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-memory_basic_information#:~:text=MEM_PRIVATE) contains pages that are private to the process and are not mapped from a file or shared section. Memory allocated using APIs such as `VirtualAlloc` is generally reported as `MEM_PRIVATE`. Process heaps, stacks, and manually allocated buffers commonly use private memory as well.
    
2. **Mapped Memory** - A region reported as [MEM_MAPPED](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-memory_basic_information#:~:text=MEM_MAPPED) contains pages mapped from a section object that is not an executable image. This commonly includes views created using APIs such as [CreateFileMapping](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createfilemappinga) and [MapViewOfFile](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-mapviewoffile). The section may be backed by a data file or by the system paging file. Multiple processes can map the same section, allowing the underlying memory to be shared between them. The mapping APIs are covered later in details when discussing techniques like _Mapping Injection_.
    
3. **Image Memory** - A region reported as [MEM_IMAGE](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-memory_basic_information#:~:text=MEM_IMAGE) contains pages mapped from a Portable Executable image, such as an `.exe` or `.dll` (more on PE files in the next module). When Windows loads an executable image or DLL into a process, its PE sections are mapped into the process's virtual address space and are generally reported as `MEM_IMAGE`. The protection of each region is derived from the characteristics of its corresponding PE section. For example, the `.text` section is commonly mapped as executable and readable, whereas data sections may be mapped as readable and writable.

## Memory Protection

Modern Windows systems include several memory protection features that make exploitation harder and help reduce the impact of memory corruption bugs. This section will explore both [Data Execution Prevention](https://learn.microsoft.com/en-us/windows/win32/memory/data-execution-prevention) and [Address Space Layout Randomization](https://techcommunity.microsoft.com/discussions/windows-security/turn-on-mandatory-aslr-in-windows-security/1186989).

### Data Execution Prevention

[Data Execution Prevention](https://learn.microsoft.com/en-us/windows/win32/memory/data-execution-prevention), commonly known as DEP, is a Windows memory protection feature that prevents code from executing from memory regions that are not explicitly marked as executable. In practice, this means that memory used for normal data, such as the stack, heap, and buffers allocated as `PAGE_READWRITE`, should not be treated as executable code.

DEP relies on page permissions. If a page is committed with a non-executable protection such as `PAGE_READWRITE` or `PAGE_READONLY`, the process can read or write the page depending on its protection, but it cannot execute instructions from it. If execution is attempted from that page, Windows raises an _access violation_. Executable pages must use one of the executable protection constants, such as `PAGE_EXECUTE`, `PAGE_EXECUTE_READ`, or `PAGE_EXECUTE_READWRITE`.

The reason writable and executable memory should be avoided is that it weakens this separation. If a memory region is both writable and executable, a bug or vulnerability that allows data to be written into that region may also allow that data to be executed as code. For this reason, normal programs should usually keep writable data pages and executable code pages separate. A safer pattern for programs that generate code at runtime is to write the data while the memory is writable, then change the protection with [VirtualProtect](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-virtualprotect) so the region becomes executable but no longer writable.

> Si es largo, pero necesario de entender.