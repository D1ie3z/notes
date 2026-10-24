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