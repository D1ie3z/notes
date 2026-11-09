---
title: DLLs - el código que vive en procesos ajenos
sidebar_position: 10
---

**Analogía para empezar**: un EXE es como el dueño de una fiesta: arranca el evento (el proceso). Una DLL es como el invitado que se monta en la fiesta de otro: no inicia nada por sí sola, entra al lugar (el proceso) y ahí dentro hace lo suyo — abre handles, aloca memoria, crea hilos — pero siempre **dentro del contexto del anfitrión**. Si el anfitrión es sospechoso, todo lo que hace el invitado se le atribuye al anfitrión. Eso es lo que hace a las DLLs tan importantes para el MalDev.

## ¿Qué es una DLL?

Una **Dynamic-Link Library** es una librería compartida: código ejecutable + datos + recursos, que muchas aplicaciones pueden usar sin llevar cada una su propia copia.

- Cuando un proceso carga una DLL, **Windows la mapea al espacio de direcciones virtuales del proceso**.
- El código de la DLL corre en el contexto del proceso que la cargó: si la DLL aloca memoria, abre handles o crea hilos, lo hace "como si fuera" el proceso anfitrión.
- Ejemplos que vas a ver en todo lado: `ntdll.dll`, `kernel32.dll`, `KernelBase.dll`, `user32.dll`, `advapi32.dll`.

**EXE vs DLL**: los dos son formato PE, pero el EXE normalmente *crea* un proceso y la DLL *se carga* en uno existente. Doble-clic en `kernel32.dll` no inicia un programa: una DLL necesita que otro ejecutable la cargue y llame sus funciones exportadas.

## ¿Por qué existen?

- **Reuso de código**: un programa que llama `CreateFileW` no implementa archivos — Windows resuelve la llamada vía las DLLs que exponen esa función.
- **Modularización**: una DLL de red, otra de UI, otra de parsing.
- **Memoria eficiente**: cuando varios procesos cargan la misma DLL, Windows **comparte las páginas read-only** de la imagen (el código) entre ellos — no guarda copias físicas separadas.
- **Updates fáciles**: actualizas la DLL y todas las apps que la usan se actualizan (si el contrato de exports no cambia).
- **Plugins**: apps que cargan DLLs en runtime para funcionalidad opcional.

## Base addresses: misma dirección, distinta memoria

Puede verse `kernel32.dll` en la misma dirección virtual (p. ej. `0x7fff9fad0000`) en varios procesos. Confunde hasta que recuerdas: **una dirección virtual NO es una dirección física**.

- Cada proceso tiene su propio espacio virtual privado.
- Windows traduce virtual → físico por proceso.
- Como las páginas de código de la DLL son read-only, el memory manager puede **mapear las mismas páginas físicas** en varios procesos: ahorro de RAM y de tiempo de carga.

> Ojo: no trates esa dirección como permanente. Con **ASLR** (Address Space Layout Randomization), la base de cada DLL cambia entre boots, máquinas, versiones de Windows y configuraciones de proceso. Por eso los loaders nunca asumen direcciones fijas — las resuelven en runtime.

## Crear una DLL con Visual Studio

1. Nuevo proyecto → plantilla **Dynamic-Link Library (DLL)**.
2. Aparece `dllmain.cpp` — como este material es C, renómbralo a `dllmain.c`.
3. **Quitar precompiled headers** (para proyectos chicos no hacen falta): borra `framework.h`, `pch.h`, `pch.cpp`, elimina `#include "pch.h"` y pon `#include <Windows.h>`. Luego en el proyecto: `C/C++ > Precompiled Headers > Not Using Precompiled Headers`.

## DllMain: la puerta de entrada (y el candado)

La DLL puede definir `DllMain`, que el loader llama cuando pasan eventos:

| Razón | Cuándo |
|---|---|
| `DLL_PROCESS_ATTACH` | La DLL se carga en el proceso |
| `DLL_THREAD_ATTACH` | El proceso crea un hilo |
| `DLL_THREAD_DETACH` | Un hilo sale normalmente |
| `DLL_PROCESS_DETACH` | La DLL se descarga del proceso |

**El Load Lock (candado del loader)**: `DllMain` corre mientras Windows sostiene un candado de sincronización. Si `example.exe` carga A.dll, B.dll y C.dll, espera a que el `DllMain` de A termine antes de seguir con B y C. Si el `DllMain` de A hace algo pesado o que espera sincronización → el proceso puede quedarse colgado sin cargar el resto.

> Regla de Microsoft: `DllMain` **mínimo**. Nada de trabajo pesado, ni esperar objetos de sincronización, ni lógica compleja de hilos, ni llamar `LoadLibrary`, ni APIs que indirectamente carguen otras DLLs. La lógica real va en **funciones exportadas**, que el anfitrión invoca cuando la DLL ya está cargada.

## Exportar una función

La forma simple: `extern __declspec(dllexport)`.

```c
#include <Windows.h>

extern __declspec(dllexport) VOID WINAPI HelloWorld(VOID) {
    MessageBoxA(NULL, "Hello, World!", "DLL Message", MB_ICONINFORMATION);
}

BOOL WINAPI DllMain(HMODULE hModule, DWORD ul_reason, LPVOID lpReserved) {
    switch (ul_reason) {
        case DLL_PROCESS_ATTACH: case DLL_THREAD_ATTACH:
        case DLL_THREAD_DETACH:  case DLL_PROCESS_DETACH:
            break;
    }
    return TRUE;
}
```

Para verificar que quedó exportada:

```
dumpbin /exports sampleDLL.dll
```

Deberías ver `HelloWorld` en la tabla de exports — es lo que `GetProcAddress` podrá resolver después.

## Load-time vs Run-time linking

| | Load-time | Run-time |
|---|---|---|
| Cómo | El EXE se enlaza contra una import library en compilación | El programa carga la DLL en runtime |
| Quién resuelve | El loader de Windows al arrancar, vía la **IAT** (Import Address Table) | El propio código, con `LoadLibrary` + `GetProcAddress` |
| Cuándo se usa | Imports normales del binario | Carga manual, resolución dinámica (lo que interesa en MalDev) |

El runtime linking muestra la relación completa: DLL → handle del módulo → dirección de la función → puntero a función. Es la base de la resolución dinámica de APIs.

## Run-time linking, paso a paso

**Paso 1 — Cargar la DLL.** Un EXE (el anfitrión) carga `sampleDLL.dll` con `LoadLibraryA`, que mapea la DLL al proceso y devuelve un **handle** (`HMODULE`). Las DLLs del sistema (user32, kernel32) ya están cargadas antes del entry point; las tuyas no, hay que cargarlas.

```c
HMODULE hModule = LoadLibraryA("sampleDLL.dll");
if (hModule == NULL) return -1;
// ... usar ...
FreeLibrary(hModule);   // descargar cuando ya no hace falta
```

**Paso 2 — Obtener el handle si ya está cargada.** `GetModuleHandleA("sampleDLL.dll")` devuelve el handle sin cargarla. Patrón común: intentar con GetModuleHandle; si falla, cargar con LoadLibrary y recordar que la cargaste tú (para descargarla con FreeLibrary al final).

**Paso 3 — Resolver la función.** `GetProcAddress(hModule, "HelloWorld")` devuelve la dirección de la exportada como puntero genérico (`PVOID`).

**Paso 4 — Type-cast y ejecutar.** GetProcAddress devuelve un puntero genérico; hay que castearlo al tipo de puntero a función correcto. Si la exportación es `VOID WINAPI HelloWorld(VOID)`, el tipo es:

```c
typedef VOID (WINAPI* fnHelloWorld)(VOID);
```

```c
PVOID pHelloWorld = GetProcAddress(hModule, "HelloWorld");
fnHelloWorld HelloWorld = (fnHelloWorld)pHelloWorld;
HelloWorld();   // ejecutar
```

> Si el tipo no coincide con el prototipo real (tipo de retorno, parámetros o **convención de llamada** mal), la función puede ejecutarse mal o crashear el proceso.

**Ejemplo completo con MessageBoxA** (asumiendo que user32 no está cargada — en la práctica casi siempre lo está):

```c
typedef int (WINAPI* fnMessageBoxA)(HWND, LPCSTR, LPCSTR, UINT);

HMODULE hUser32 = LoadLibraryA("user32.dll");
fnMessageBoxA pMessageBoxA = (fnMessageBoxA)GetProcAddress(hUser32, "MessageBoxA");
pMessageBoxA(NULL, "text", "caption", MB_OK);
FreeLibrary(hUser32);
```

## Convención de nombres de punteros a función

Para que el código quede legible y no confundir el puntero con la API real: el tipo de puntero a función usa el nombre de la API con prefijo `fn`.

```c
typedef int (WINAPI* fnMessageBoxA)(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType);
```

## rundll32.exe: ejecutar un export sin escribir programa

`rundll32.exe` es un binario del sistema que corre una función exportada de una DLL:

```
rundll32.exe user32.dll,LockWorkStation
```

No es una navaja suiza: la función exportada debe usar el prototipo callback esperado por rundll32:

```c
VOID CALLBACK EntryPoint(HWND hwnd, HINSTANCE hinst, LPSTR lpszCmdLine, int nCmdShow);
```

Con una DLL que exporte algo así, se invoca:

```
rundll32.exe sampleDLL.dll,EntryPoint
```

## Por qué te importa en MalDev

- La DLL corre **dentro del proceso anfitrión** → el loader hace que un proceso legítimo "haga cosas" sin serlo.
- La **resolución dinámica** (`LoadLibrary`/`GetProcAddress`/`GetModuleHandle`) es la técnica base para esconder imports y complicarle la vida a los EDRs: el binario ya no declara `MessageBoxA` en su IAT — la busca en runtime.
- `rundll32.exe` es un LOLBin clásico: correr código con un binario firmado de Microsoft como vehículo.