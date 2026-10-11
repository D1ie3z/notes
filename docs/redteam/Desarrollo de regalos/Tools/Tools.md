---
title: "Tooling Philosophy — Kit de Herramientas del Lab"
sidebar_position: 3
---

# Tooling Philosophy

La meta no es instalar muchas herramientas: cada herramienta existe para sostener **una tarea concreta**.

| Tarea | Categoría de tool |
|---|---|
| Escribir/compilar código Windows | IDE, compilador, SDK, build tools |
| Debuggear binarios | Debugger user-mode / Windows debugger |
| Inspeccionar estructura PE | PE viewer, hex editor, static analysis |
| Observar comportamiento runtime | Procesos, archivos, registry, memoria, handles, DLLs |
| Observar red | Packet capture, conexiones |
| Comparar vista ofensiva vs defensiva | Payload generators, logs, telemetría, monitoring |

Habilidad central: cambiar fluidamente entre **la vista del developer** y **la del analyst**. Todo binario que compiles también debe inspeccionarse como si fuera una muestra desconocida.

## Core toolkit

### Visual Studio 2022
- IDE principal: editor, compilador (MSVC), linker, debugger, sistema de proyectos, build config.
- Instalar con workload **"Desktop development with C++"** (trae el Windows SDK incluido — headers, libs, metadata, build tools).
- Verificar: abrir *Developer PowerShell for VS 2022* o *x64 Native Tools Command Prompt* → `cl.exe` debe imprimir el banner de Microsoft C/C++.

### Visual Studio Code
- Editor ligero para abrir rápido fuentes sueltas, scripts, configs, logs y notas. El compilado pesado sigue en VS.

### Git for Windows
- Versionar experimentos locales. Trabajando solo igual sirve: comparar cambios y revertir errores. Opcional.

### Python
- No es el lenguaje del payload: helper scripts, parsing binario, procesar logs, generar input de prueba.
- Al instalar en Windows: marcar **"Add Python to PATH"**. Verificar: `python --version`, `pip --version`.

### x64dbg  debugger user-mode principal
- Soporta x86 y x64. Sirve para breakpoints, inspeccionar memoria, registros, stack, heap, step through assembly.
- Los 4 paneles de la pestaña "CPU":
  - **Disassembly** (arriba-izq): instrucciones en ejecución.
  - **Dump** (abajo-izq): contenido de memoria.
  - **Registers** (arriba-der): valores de registros CPU.
  - **Stack** (abajo-der): contenido del stack.
- WinDbg es más potente (kernel-mode, dumps, símbolos) pero su interfaz es por comandos más dura de adoptar.

### PE-Bear
- Analizador de PE (Portable Executable): headers, secciones, imports, exports, resources, validación, hex editor integrado. La vista del analyst sobre tu propio binario.

### Ghidra / IDA Free
- Disassemblers/decompilers para static RE. IDA es la referencia principal. Opcional pero recomendado para ver tu código compilado con ojos de analista.

### System Informer

- Sucesor de Process Hacker. Procesos, servicios, DLLs cargadas, handles, threads, regiones de memoria — todo en vivo.

### Sysinternals Suite
Tres herramientas principales:
- **Process Monitor (ProcMon)**: captura filesystem, registry, proceso, thread, image loads. Compara intención a nivel código con comportamiento real. Si tu programa escribe un archivo, crea una clave o carga una DLL, ProcMon lo muestra desde la vista del analyst.
- **Process Explorer**: árbol de procesos, command lines, DLLs, handles, firmas — cómo se ve tu proceso en el sistema.
- **Strings**: extrae cadenas printables del binario → paths, URLs, claves de registry, nombres de API, configs embebidos. Análisis estático básico.

### Wireshark (opcional)
- Captura de red en el lab: DNS, TCP, HTTP, metadata TLS. No esencial.

## Payload/C2 frameworks (Metasploit/msfvenom, Sliver, Havoc)

- Rol: generar formatos de payload conocidos, testear workflows de carga, comparar cómo distintos frameworks estructuran payloads e implants.
- **Isolación obligatoria**: nunca en la máquina Windows de desarrollo — los archivos instalados y payloads generados los flaggea Defender. Linux VM (o WSL siguiendo la doc oficial de cada tool).
- Diferencia de interfaces: Havoc es GUI (dashboard de listeners/payloads/sessions); msfconsole y Sliver son consola interactiva.

### VMs pre-construidas

- VMs con tools y código pre-instalados (VMware y VirtualBox, con SHA256 publicado para verificar integridad).

### Analogía

El toolkit es un quirófano, no un cajón de herramientas:

- **VS + MSVC** = los bisturís con los que opera (compilas).
- **x64dbg** = el monitor de signos vitales (ves qué hace el binario pulmón por pulmón: registros, stack, memoria).
- **ProcMon / System Informer** = las cámaras del quirófano (qué toca tu proceso en el sistema real: archivos, registry, handles).
- **PE-Bear / IDA** = la autopsia del propio paciente (tu binario, abierto y leído como si no lo hubieras escrito tú).
- **Havoc/Sliver** = material de simulacro traído de otro hospital, nunca operando con él en tu propia sala.

> La regla de oro: **compila con un sombrero, analiza con el otro**. Si solo compilas, eres dev; si solo analizas, eres analyst; el red teamer necesita ambos en menos de un minuto de cambio.

