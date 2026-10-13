---
title: Progra en C
sidebar_position: 1
---

## Vamonos ricky 

SI ya sé que es C++, pero está más completo este we es DIOS, QEPD.

- https://www.youtube.com/playlist?list=PLWtYZ2ejMVJlUu1rEHLC0i_oibctkl0Vh

C estándar no sabe nada de Windows. Microsoft construyó una capa encima con sus propios tipos, convenciones y reglas de errores. Si abres cualquier código que llame al API de Windows y no conoces este dialecto, parece escrito en otro lenguaje. Conocerlo = leer cualquier injector, loader o herramienta ofensiva sin fricción.


## Windows Headers

Todo programa C que toca el API de Windows empieza incluyendo headers. Estos no son "librerías": son **declaraciones** (prototipos de funciones, constantes, macros, structs, typedefs). El linker resuelve después contra las .lib; el header solo le dice al compilador "esto existe y se llama así".

```c
#include <Windows.h>   // el gran paraguas: núcleo de Win32 Incluye a su vez winbase.h, winuser.h, winnt.h y decenas más. Con solo este ya tienes casi todo Win32: tipos (`DWORD`, `HANDLE`...), constantes
#include <TlHelp32.h>  // Tool Help: snapshots de procesos, threads, módulos, heaps
#include <stdio.h>     // estándar, para printf
```

Los que te vas a cruzar siempre en contexto ofensivo:

- `TlHelp32.h` → enumeración de procesos/módulos. La base de casi cualquier injector que busca un proceso objetivo por nombre.
- `Psapi.h` → información de procesos y módulos (EnumProcessModules, GetModuleBaseName).
- `Winternl.h` → declara las Native APIs (`Nt*`) y estructuras internas (PEB, TEB, UNICODE_STRING). Este es el header de los syscalls directos.
- `Bcrypt.h` → criptografía (hashing, RNG). Para claves de cifrado de payloads.
- `Strsafe.h` → funciones de string seguras. En desarrollo normal es para evitar overflows; en nuestro mundo interesa porque las funciones "seguras" son las que no generan warnings y ensucian menos el análisis estático.  

> Analogía: el header es el menú del restaurante (qué platos existen y con qué ingredientes vienen), no la cocina. `Windows.h` incluye a su vez decenas de headers internos, por eso basta con uno casi siempre.

## Tipos de Windows y convenciones de nombres

Windows redefinió los tipos de C con aliases. Hace los prototypes legibles y consistentes en toda la plataforma.

Los que importan (con su tipo real detrás):

- **`BYTE`** — 8 bits sin signo (`unsigned char`). El ladrillo de todo dato binario: shellcode, buffers, contenido de archivos. Cuando ves `PBYTE`, piensa "puedo indexar bytes uno a uno".
- **`WORD`** — 16 bits sin signo. Campos pequeños: campos del PE header (`e_magic`, `Machine`), versiones.
- **`DWORD`** — 32 bits sin signo (`unsigned long` históricamente, aunque en x64 `long` es 32 bits en Windows). El workhorse: PIDs, TIDs, códigos de error, flags, tamaños pequeños.
- **`LONG`** — 32 bits **con** signo. Prioridades de thread (`tpBasePri`), offsets firmados.
- **`ULONG`** — 32 bits sin signo. Contadores, flags. Igual tamaño que DWORD, distinta semántica documental.
- **`BOOL`** — `int` usado como booleano: `TRUE` (1) / `FALSE` (0). Ojo: **cualquier valor != 0 es verdadero**; una API puede devolver un código no-estándar que no es FALSE pero tampoco TRUE literal — por eso se compara contra el valor de fallo documentado, no contra TRUE.
- **`BOOLEAN`** — un solo byte (`unsigned char`). Aparece en estructuras NT, no en APIs Win32 comunes.
- **`CHAR`** / **`WCHAR`** — carácter ANSI de 8 bits / carácter wide de 16 bits (unidad de código UTF-16). En Windows, Unicode = UTF-16, siempre. `WCHAR` = 2 bytes, punto.
- **`LPSTR` / `LPCSTR`** — puntero a string ANSI modificable / constante (la C de _const_).
- **`LPWSTR` / `LPCWSTR`** — lo mismo para Unicode.
- **`PVOID` / `LPVOID`** — `void*`: dirección genérica sin tipo. Llega a todo: APIs de memoria, callbacks, datos opacos. Antes de usarlo hay que castearlo a un tipo concreto.
- **`HANDLE`** — el tipo más engañoso. _Parece_ un puntero pero es una referencia opaca a un objeto gestionado por el kernel (archivo, proceso, thread, evento, mutex). Internamente, cada proceso tiene una **handle table**: el kernel guarda ahí los objetos reales, y tu handle es un índice/cookie hacia esa tabla. No puedes dereferenciarlo ni hacer aritmética con él — solo presentarlo a otras APIs.
- **`HMODULE`** — handle de módulo cargado. En user-mode, el valor **es la dirección base** donde el loader mapeó la DLL o EXE. Conseguir el `HMODULE` de kernel32.dll = tener su base address, y desde ahí puedes caminar sus PE headers para encontrar su export table. Esa es la semilla de GetProcAddress manual.
- **`SIZE_T`** — `size_t` de la plataforma: 32 bits en x86, 64 en x64. Para tamaños de buffer y operaciones de memoria.
- **`DWORD_PTR` / `ULONG_PTR` / `UINT_PTR`** — enteros que escalan con la arquitectura: lo suficientemente grandes como para contener un puntero. Sirven para aritmética de punteros y para guardar direcciones como enteros sin truncar.


## Pointer-sized types:

- x86 → puntero = 4 bytes. x64 → puntero = 8 bytes.
- `DWORD` **nunca** cambia: siempre 32 bits, en ambas arquitecturas.
- `SIZE_T` y los `*_PTR` **escalan**: 4 u 8 según el target.

```c
DWORD x = (DWORD)pBuffer;       // MAL en x64: trunca 8 bytes a 4
ULONG_PTR x = (ULONG_PTR)pBuffer; // BIEN: válido en x86 y x64
```


Si `pBuffer` = `0x00007FFA` `12345678` (8 bytes), el cast a DWORD se queda con los 4 bytes **bajos**: `0x12345678`. Has perdido la mitad alta. Ese valor como puntero apunta a cualquier otra parte (o a nada) → access violation cuando lo uses, o peor, escritura en memoria equivocada. El mismo código "funciona" en x86 porque ahí la mitad alta no existía: es la clase de bug que aparece solo al migrar a x64.

```c
ULONG_PTR Value = (ULONG_PTR)pBuffer;   // correcto: 4 bytes en x86, 8 en x64
```


**Nunca** se debe almacenar una dirección en un tipo de tamaño fijo; usar `ULONG_PTR`/`SIZE_T`/`DWORD_PTR`. Los `*_PTR` existen exactamente para escribir código una sola vez que compile bien en ambas arquitecturas — los headers Windows los usan por todas partes (de ahí campos como `DWORD_PTR` en estructuras que guardan direcciones).

> Cuando parseas un PE (Portable Executable) o manipulas direcciones de memoria (ImageBase, AddressOfEntryPoint, punteros a structs), la diferencia entre una imagen x86 y x64 es exactamente esto: los campos de puntero pasan de 4 a 8 bytes. Un parser PE hardcodeado para x86 lee campos corridos en x64. Los `*_PTR` existen precisamente para que el mismo código compile bien en ambas arquitecturas.


## Declaraciones reales, una a una


```c
DWORD dwVariable = 42;
```

Entero sin signo de 32 bits. Rango 0 a 2³²−1 = 4,294,967,295. Igual de grande en x86 que en x64.

```c
SIZE_T cbVariable = sizeof(int);
```

Tamaño de objeto. En x86: 32 bits (rango ~4 GB). En x64: 64 bits. `sizeof` devuelve `SIZE_T` precisamente por esto — compara tamaños siempre con `SIZE_T`, no con `int`, o truncas en x64.

```c
PVOID pVariable = &SomeData;
```

"Un puntero a lo que sea". 4 u 8 bytes según arquitectura. No dice qué hay al otro lado.


```c
HANDLE hFile = CreateFile(...);
```

Una cookie del kernel para un objeto archivo. No es la dirección del archivo; es tu ticket en la handle table.


```c
HMODULE hModule = GetModuleHandle(...);
```

Ticket de módulo que, en la práctica, **es la base address** del módulo mapeado en tu proceso. Cast a `PBYTE` y ya estás parado en el MZ del PE.


```c
WCHAR wszVariable[] = L"Example";
LPWSTR lpwszVariable = wszVariable;
```

Primera línea: array de 8 WCHAR en el stack (7 letras + null), cada uno 2 bytes → 16 bytes totales. El `L` marca literal wide. Segunda línea: un puntero que apunta a ese array. `wsz` = "wide string, zero-terminated"; `lpwsz` = "long pointer a wide string z".

```c
LPCSTR lpcszVariable = "Example";
```

Puntero a string ANSI **constante**. La C promete no modificarla (romper esa promesa = crash si el literal vive en sección de solo lectura).

Desglose de cualquier tipo de string Windows con tres preguntas: ¿ANSI o Unicode? (`STR` vs `WSTR`) ¿constante o modificable? (`C` o nada) ¿carácter suelto o puntero a buffer? (`CHAR`/`WCHAR` vs `LP...`).


## Notación húngara

Es un sistema de prefijos que dice **qué representa** un valor. Tiene raíz en los años 80 de Microsoft y pervive en toda la superficie Win32, headers, samples viejos y estructuras de internals. Código de aplicación moderno ya no lo usa, pero no puedes evitar leerlo.

Ejemplo real para desmontar, `THREADENTRY32`:


```c
typedef struct tagTHREADENTRY32 {
    DWORD dwSize;
    DWORD cntUsage;
    DWORD th32ThreadID;
    DWORD th32OwnerProcessID;
    LONG  tpBasePri;
    LONG  tpDeltaPri;
    DWORD dwFlags;
} THREADENTRY32;
```

- `dwSize` → DWORD que guarda un tamaño. En uso real: debes poner `te.dwSize = sizeof(THREADENTRY32)` antes de `Thread32First` — la API lo valida como control de versionado de la estructura.
- `th32ThreadID` → identificador de thread de 32 bits. `th32` = familia Tool Help 32.
- `th32OwnerProcessID` → PID del proceso propietario — con esto cruzas threads con procesos.
- `dwFlags` → DWORD de flags.
- `cntUsage`, `tpBasePri` → contador de uso, prioridad base (thread priority).

Tabla completa de prefijos, con el matiz de cada uno:

|Prefijo|Qué indica|Matiz importante|
|:--|:--|:--|

|   |   |   |
|---|---|---|
|`b`|boolean o byte|BOOL, BOOLEAN o BYTE: verifica el tipo real|
|`f`|condición booleana|`fSuccess`, `fCreate`|
|`w`|WORD|16 bits|
|`dw`|DWORD|32 bits — el más común de todos|
|`u` / `ul`|UINT / ULONG|sin signo|
|`n` / `i`|int / índice|`nCmdShow`, contadores de loop|
|`cb`|**bytes**|tamaños de buffer, allocaciones — siempre bytes|
|`cch`|**caracteres**|buffers de string — nunca bytes|
|`ch`|un carácter|no un string|
|`sz`|string con null final|la "z" = zero-terminated|
|`psz` / `lpsz`|puntero a string|`lpsz` es estilo viejo pero idéntico en efecto|
|`p`|puntero|`pBuffer`, `pInfo`|
|`pp`|puntero a puntero|la función te entrega un puntero escribiendo en él|
|`pv` / `ppv`|puntero a void / a puntero a void|`ppvObject` es el clásico de COM|
|`lp`|"long pointer"|herencia de Win16; hoy = puntero normal|
|`h`|handle|`hProcess`, `hThread`, `hModule`, `hKey`|
|`fn` / `pfn` / `lpfn`|función / puntero a función|callbacks, window procedures|
|`rg` / `rgsz`|array / array de strings|estilo viejo Microsoft|

La regla que lo gobierna todo: **el prefijo es una pista, la declaración es la ley**. `dwSize` _sugiere_ DWORD — y aquí lo es. Pero solo el typedef lo confirma. Lee siempre el tipo, nunca confíes en el nombre; el código viejo tiene excepciones históricas.


## Las APIs gemelas A y W

Casi toda API que acepta strings existe en dos versiones:

```c
CreateFileA(...)   // recibe LPCSTR  — ANSI, 1 byte por carácter
CreateFileW(...)   // recibe LPCWSTR — Unicode UTF-16, 2 bytes por carácter
```

`CreateFile` sin sufijo **no es una función**: es una macro del header que expande a una u otra:

```c
// winbase.h, simplificado:
#ifdef UNICODE
  #define CreateFile CreateFileW
#else
  #define CreateFile CreateFileA
#endif
```

Visual Studio define `UNICODE` en plantillas modernas → por defecto `CreateFile` = `CreateFileW`. Si tu código o una dependencia lo desdefinen, silenciosamente compilas contra la versión ANSI y las cadenas wide que le pases se interpretan mal.

La recomendación operativa: usa las versiones W explícitas y tipos wide. Windows es UTF-16 por dentro; ir por ANSI fuerza conversiones en cada frontera y genera llamadas extra (`MultiByteToWideChar`) que ensucian tanto el binario como tu huella de APIs.

## Tipos de string:

|Tipo|Es|Ejemplo|
|:--|:--|:--|

|   |   |   |
|---|---|---|
|`CHAR`|carácter ANSI de 8 bits|`CHAR ch = 'A';`|
|`char*` / `PSTR` / `LPSTR`|puntero a buffer ANSI **modificable**|`LPSTR s = Buffer;`|
|`const char*` / `PCSTR` / `LPCSTR`|puntero a ANSI **constante**|`LPCSTR s = "notepad.exe";`|
|`WCHAR`|carácter wide UTF-16|`WCHAR ch = L'A';`|
|`PWSTR` / `LPWSTR`|puntero a buffer Unicode modificable||
|`PCWSTR` / `LPCWSTR`|puntero a Unicode constante|`LPCWSTR s = L"notepad.exe";`|
|`TCHAR`|genérico: WCHAR si UNICODE, CHAR si no|`TCHAR ch = TEXT('A');`|
|`LPTSTR` / `LPCTSTR`|puntero genérico a string|`LPCTSTR s = TEXT("x.exe");`|

Los `TCHAR`/`TEXT()` son para código que debe compilar en ambos mundos. En código nuevo: tipos explícitos W, siempre. Las macros A usan `LPCSTR/LPSTR`; las W usan `LPCWSTR/LPWSTR` — mismatch de tipo = warning o corrupción.

### El desastre clásico: caracteres vs bytes


```c
SIZE_T cchPath = wcslen(UnicodePath);             // 39 caracteres (sin contar null)
SIZE_T cbPath  = (cchPath + 1) * sizeof(WCHAR);   // 80 bytes (con null)
```

UTF-16: cada carácter = 2 bytes. Si reservas 40 bytes pensando "40 caracteres", escribes el doble → stack/heap overflow. Si pasas bytes donde la API espera caracteres, lee el doble de tu buffer → over-read. El prefijo te salva si lo respetas: `cch` multiplica por `sizeof(WCHAR)`, `cb` no. Y recuerda sumar 1 para el null terminator cuando calcules bytes a reservar.

---

## Punteros

Un puntero es una variable cuyo contenido es una **dirección de memoria**. Nada más.


```c
int  Value  = 10;
int* pValue = &Value;
```

- `Value` vive en algún sitio del stack, digamos `0x00F3A8`.
- `&Value` = "la dirección de Value" = `0x00F3A8`.
- `pValue` es otra variable (vive en `0x00F9B0`, digamos) que **contiene** `0x00F3A8`.

Operadores:

```c
printf("%p\n", (void*)pValue);   // imprime 0x00F3A8 — el %p muestra direcciones
printf("%d\n", *pValue);         // * = "ve a esa dirección y trae el int" → 10
*pValue = 20;                    // ve a esa dirección y escribe 20 → Value ahora es 20
```

La analogía: el puntero es una hoja con la dirección de una casa; `*` es ir a esa casa; `&` es escribir tu propia dirección en la hoja. Modificar a través de `pValue` modifica `Value` porque ambos acceden la misma memoria.

Uso intensivo en Windows — buffers byte a byte:


```c
BYTE  Buffer[16] = { 0 };   // 16 bytes de stack, todos cero
PBYTE pBuffer    = Buffer;  // apunta al byte 0 del array
pBuffer[0] = 0x41;          // notación[i] == *(pBuffer + i)
pBuffer[1] = 0x42;
```

Ese patrón es literalmente el tratamiento de shellcode: la dirección que devuelve `VirtualAllocEx` llega como valor genérico y la trabajas byte a byte con un `PBYTE`.

`PVOID` guarda direcciones pero no sabe qué hay al otro lado:


```c
PVOID pAddress = Buffer;
PBYTE pBytes = (PBYTE)pAddress;    // cast: "voy a tratarlo como bytes"
printf("0x%02X\n", pBytes[0]);     // 0x41
```

El cast no cambia nada en memoria; solo le dice al compilador cómo interpretar lo que hay ahí (cuántos bytes leer por elemento).

### Punteros inválidos y el NULL check

Todo puntero sin destino válido se inicializa a `NULL`. Dereferenciar NULL = access violation garantizada (la página 0 está no-mapeada por el SO precisamente para atrapar esto). La lista de punteros que no debes tocar: NULL, sin inicializar (basura del stack), liberados (dangling — la memoria pudo ser reasignada), y de tipo equivocado.


```c
PBYTE pBuffer = NULL;
if (pBuffer == NULL) {
    return FALSE;
}
```

Cada dereferencia potencial se precede de un check. En código ofensivo esto es doblemente cierto: la dirección remota de un proceso objetivo puede ser NULL si la alloc falló, y escribir en NULL remoto o en memoria no comprometida es fallo + telemetría.

## Estructuras

Una struct agrupa campos relacionados bajo un tipo. Windows las usa a dos direcciones: tú se las entregas rellenas (input) o ellas te las rellenan (output).

El patrón de declaración con `typedef`:

```c
typedef struct _READER_INFO {
    int  Id;
    int  Age;
    char Initial;
} READER_INFO, *PREADER_INFO;
```

Tres nombres salen de ahí:

- `_READER_INFO` — el tag (opcional usarlo).
- `READER_INFO` — el tipo. Declaras: `READER_INFO r;`
- `PREADER_INFO` — puntero al tipo. Declaras: `PREADER_INFO p;`

`struct _READER_INFO x;` y `READER_INFO x;` son idénticas; la segunda es la forma canónica cuando existe el alias.

### Inicialización

```c
READER_INFO r1 = { 0 };   // TODOS los campos a cero
PREADER_INFO p = NULL;    // el puntero va a NULL, no a {0}
```

`{ 0 }` es el hábito obligatorio con structs Windows: un struct sin inicializar hereda basura del stack, y varias APIs validan campos concretos (Tool Help exige `dwSize = sizeof(...)` correcto; otras exigen cero en campos reservados). Basura en un campo reservado = error `ERROR_INVALID_PARAMETER` misterioso.

Inicialización designada:

```c
READER_INFO r = { .Id = 1470, .Age = 34 };
```

Especificas miembro por miembro, sin depender del orden. Ojo: es sintaxis **C** (C99). En C++ su compatibilidad depende del estándar (C++20 lo admite; antes, no). Si un archivo .c te da error raro en Visual Studio, verifica que no se esté compilando como C++.

### Acceso: punto vs flecha

```c
READER_INFO r = { 0 };
r.Id = 1470;              // tengo la struct: operador punto

PREADER_INFO p = &r;
p->Id = 8765;             // tengo un puntero: operador flecha
```

`p->Id` es azúcar sintáctica exactamente igual a `(*p).Id`: dereferencia el puntero y accede al miembro. Por eso la flecha solo existe con punteros a struct.

### Padding y alineación, al detalle

La regla del compilador MSVC: **cada miembro se coloca en un offset múltiplo de su propio tamaño** (hasta 8 bytes en x64), y la struct completa se redondea al múltiplo del miembro más grande.


```c
typedef struct _EXAMPLE {
    BYTE  A;    // offset 0  (1 byte)
    // offsets 1,2,3: PADDING — hueco
    DWORD B;    // offset 4  (4 bytes)
} EXAMPLE;
```

`sizeof(EXAMPLE)` = 8, no 5. El compilador mete 3 bytes muertos para que B quede alineado a 4 (los accesos de 4 bytes son más baratos alineados en la arquitectura).

En x64 esto se agudiza: un puntero (8 bytes) exige alineación de 8.


```c
typedef struct _X64EX {
    BYTE  A;     // offset 0
    // 7 bytes de padding
    PVOID B;     // offset 8
} X64EX;         // sizeof = 16 en x64
```

La analogía del aparcamiento: los vehículos (miembros) solo pueden estacionar arrancando en múltiplos de su tamaño; un vehículo de 1 metro en un parqueo de múltiplos de 4 desperdicia 3 metros.

Por qué te debe importar: cuando parseas formatos binarios — un PE en disco, estructuras de red, dumps de memoria — los offsets documentados **incluyen el padding del layout de MSVC**. Tu struct debe replicar ese layout exactamente o leerás campos corridos. Por eso se usa `#pragma pack(1)` para forzar empaquetado sin huecos al definir structs que deben coincidir byte a byte con un formato en disco, y por eso `sizeof()` es la única fuente confiable del tamaño real.

---

## Enumeraciones

Un enum es un conjunto de constantes con nombre. El compilador numera automáticamente desde 0:


```c
typedef enum _DAY_OF_WEEK {
    Monday,     // 0
    Tuesday,    // 1
    Wednesday,  // 2
    Thursday,   // 3
    Friday,     // 4
    Saturday,   // 5
    Sunday      // 6
} DAY_OF_WEEK;
```

Detalles de uso:

- No es un struct: no hay operador punto. Los valores se usan directos: `DAY_OF_WEEK d = Friday;`
    
- En memoria es un `int` (4 bytes) salvo que fuerces otro tipo.
    
- El switch sobre enum es el patrón canónico de manejo de estados, y el compilador puede avisarte si falta un `case`.
    

Asignación manual cuando el número significa algo:

```c
typedef enum _OPERATION_STATUS {
    OperationSuccess      = 0,
    OperationInvalidInput = 1,
    OperationAccessDenied = 2,
    OperationFailure      = 3
} OPERATION_STATUS;
```

En Windows internals los enums son gigantes y reales: la lista de NTSTATUS completa es literalmente un enum de miles de entradas con valores asignados manualmente (0x00000000, 0xC0000022...). Cuando veas una función que "devuelve un enum", el número ya viene con significado definido.

---

## Unions

Una union permite que varios miembros de tipos distintos **ocupen la misma memoria**. El tamaño total = el miembro más grande. Escribir por un miembro redefine los bytes que los demás leen.

```c
typedef union _EXAMPLE_UNION {
    int   IntegerValue;    // 4 bytes
    char  CharacterValue;  // 1 byte
    float FloatValue;      // 4 bytes
} EXAMPLE_UNION;           // sizeof = 4
```

La analogía: un mismo cajón con varias etiquetas. Meter algo por la etiqueta "int" no cambia el cajón — cambia cómo lo interpretas al leer por otra etiqueta.

Ejemplo byte a byte, con little-endian de por medio:


```c
EXAMPLE_UNION Value = { 0 };
Value.IntegerValue = 0x41424344;
```

En little-endian (x86/x64), los bytes se guardan **al revés** en memoria: el byte menos significativo primero. Así que en memoria:

```plain
dirección+0: 0x44
dirección+1: 0x43
dirección+2: 0x42
dirección+3: 0x41
```

Ahora:

```c
Value.CharacterValue = 'A';   // 'A' = 0x41 → escribe SOLO en dirección+0
printf("%c\n", Value.CharacterValue);     // A
printf("0x%X\n", Value.IntegerValue);     // 0x41424341
```

El 'A' (0x41) pisó el byte bajo (que era 0x44), y los otros tres quedaron: 41 42 43 41 → leído como int, 0x41424341. Por eso la salida final del ejemplo es 0x41424341 y no el original 0x41424344.

Dónde aparece esto en Windows: estructuras NT definen campos como union cuando el mismo offset significa cosas distintas según el contexto — un campo que en un escenario es un valor pequeño y en otro es un puntero. También es la técnica base del type punning manual (reinterpretar bytes de una forma a otra sin copiar nada).

---

## Operadores bitwise

Trabajan bit a bit sobre enteros. Distintos de los operadores lógicos (`&&`, `||`, `!`), que trabajan sobre valores booleanos completos. En Windows son esenciales porque los argumentos de APIs, máscaras de acceso, protecciones de memoria y atributos se empaquetan como bits dentro de un entero: un DWORD de 32 bits puede llevar 32 opciones simultáneas.

### Shifts: `<<` y `>>`

Desplazan los bits; entran ceros por un extremo y se descartan los del otro.

`10100111 >> 2`: cada bit se mueve dos posiciones a la derecha, entran dos ceros por la izquierda → `00101001`. `10100111 << 2`: se mueven a la izquierda, entran ceros por la derecha → `10011100`.

Uso práctico — multiplicar/dividir por potencias de 2 en unsigned:

```c
DWORD v = 8;
v << 1;   // 16
v >> 1;   // 4
v << 2;   // 32  (v*4)
v >> 2;   // 2   (v/4)
```

Y construir/mover máscaras: `1 << 4` = el bit 4 encendido (0x10). Con signed hay comportamiento definido con negativos que depende del compilador — en código limpio de flags, usa unsigned.

### OR (`|`): combinar

Tabla: 1 si **alguno** de los dos es 1. `0|0=0, 0|1=1, 1|0=1, 1|1=1`.


```c
BYTE a = 0x0A;    // 00001010
BYTE b = 0x0C;    // 00001100
BYTE r = a | b;   // 00001110   ← cada posición con un 1 en cualquiera queda en 1
```

En APIs: pedir varias cosas a la vez en un solo argumento:

```c
DWORD dwAccess = GENERIC_READ | GENERIC_WRITE;
```

Un solo DWORD lleva los dos derechos. Es la forma en que se construyen casi todos los argumentos flag de Win32.

### AND (`&`): interrogar

Tabla: 1 solo si **ambos** son 1. `0&0=0, 0&1=0, 1&0=0, 1&1=1`.

```c
BYTE a = 0x0A;    // 00001010
BYTE b = 0x0C;    // 00001100
BYTE r = a & b;   // 00001000   ← solo sobrevive el bit que ambos comparten
```

La mecánica de "preguntar por un flag": la constante del flag tiene **un solo bit** encendido. Haces AND con tu valor de flags; si el resultado es no-cero, ese bit estaba encendido en tu valor:


```c
DWORD dwFlags = TH32CS_SNAPPROCESS | TH32CS_SNAPTHREAD;

if (dwFlags & TH32CS_SNAPPROCESS) {   // resultado no-cero → activo
    printf("[+] snapshot de procesos activo\n");
}
```

Otro caso real:


```c
DWORD attr = GetFileAttributesW(L"C:\\Windows");
if (attr & FILE_ATTRIBUTE_DIRECTORY) { ... }
```

`FILE_ATTRIBUTE_DIRECTORY` (0x10) es un único bit dentro del DWORD que devuelve la API. El AND filtra solo ese bit. Analogía: el AND con máscara es un colador que solo deja pasar la posición que te interesa.

### XOR (`^`): diferencia y conmutación

Tabla: 1 si son **distintos**. `0^0=0, 0^1=1, 1^0=1, 1^1=0`.

```c
BYTE a = 0x0A;    // 00001010
BYTE b = 0x0C;    // 00001100
BYTE r = a ^ b;   // 00000110   ← un 1 donde diferían
```

Toggle de un bit — dos XOR seguidos lo encienden y apagan:


```c
DWORD dwFlags = 0x00;
dwFlags ^= 0x01;   // bit 0 ON
dwFlags ^= 0x01;   // bit 0 OFF
```

**La propiedad fundamental:** XOR con la misma clave dos veces restaura el original. Funciona bit a bit: si los dos bits eran iguales, XOR da 0; aplicar otra vez la misma clave sobre ese resultado reproduce el bit original.


```c
BYTE enc = valor ^ clave;   // cifra
BYTE dec = enc   ^ clave;   // descifra → == valor
```

Esta es toda la matemática de los encoders simétricos: un cifrado XOR de shellcode con clave K se revierte aplicando la misma operación. Simple, reversible, y la base sobre la que luego se montan capas serias (AES, etc.).

### NOT (`~`): invertir

Un operador unario: voltea cada bit. `~0=1, ~1=0`.


```c
BYTE b = 0x0A;    // 00001010
BYTE r = ~b;      // 11110101
```

Su uso real es en combinación con AND para **apagar un bit sin tocar los demás**:

```c
DWORD flags = 0x07;       // 00000111
flags = flags & ~0x02;    // ~0x02 = ...11111101 → bit 1 apagado, resto intacto
// corto: flags &= ~0x02;
```

La máscara `~0x02` tiene todos los bits en 1 excepto el que quieres borrar; el AND conserva todo lo que la máscara deja en 1.

---

## Paso de parámetros

### Por valor: la fotocopia

C pasa argumentos copiando su valor. La función trabaja con una copia local en su stack frame; tu variable original ni la ve:

```c
void UpdateValue(int Value) {
    Value = 100;              // modifica la copia local
}
int Number = 10;
UpdateValue(Number);          // se copia 10
printf("%d\n", Number);       // 10 — intacto
```

Esto vale para enteros, flags, handles, campos sueltos. `PrintProcessId(DWORD pid)` recibe una copia del PID: puede leerlo, imprimirlo, compararlo, pero jamás podría "devolver" nada modificado por esa vía.

### Por puntero: la dirección

C no tiene paso por referencia como C++. La vía para que una función modifique tu variable es pasar su dirección:

c

```c
void UpdateValue(int* pValue) {
    if (pValue == NULL) return;   // validación: nunca escribir a ciegas
    *pValue = 100;                // ve a esa dirección y escribe
}
int Number = 10;
UpdateValue(&Number);             // paso la dirección de Number
printf("%d\n", Number);           // 100 — modificado
```

Tecnicidad fina: el puntero mismo **también** se pasó por valor (se copió la dirección). Pero copiar la dirección basta: la función usa esa copia para llegar a tu memoria original. "Pasar por referencia en C" es un decir; siempre es pasar el valor de una dirección.

### Output parameters: el patrón dominante de Win32

Patrón que verás en cientos de APIs: el valor de retorno lleva éxito/fracaso, y el dato real llega escrito en tu variable a través de un puntero:

c

```c
BOOL GetNumber(int* pNumber) {
    if (pNumber == NULL) return FALSE;
    *pNumber = 1337;
    return TRUE;
}

int Number = 0;
if (GetNumber(&Number)) {
    printf("%d\n", Number);   // 1337
}
```

Una función devuelve un solo valor por `return`; con output parameters devuelve diez cosas si quiere. Por eso los prototypes Win32 están llenos de punteros: no es opcional, es el mecanismo de salida.

### Input vs output: el `const` como contrato

Un puntero no implica "la función escribe". A veces solo evita copiar un objeto grande; a veces es solo lectura. El `const` marca la intención:

```c
void PrintValue(const int* pValue) {          // INPUT: promete no modificar
    if (pValue == NULL) return;
    printf("%d\n", *pValue);
}

BOOL SetValue(int* pValue) {                  // OUTPUT: va a escribir
    if (pValue == NULL) return FALSE;
    *pValue = 50;
    return TRUE;
}
```

La documentación de cada función es la que define la dirección real del flujo de datos; el `const` y las anotaciones te lo resumen.

### Anotaciones SAL

Los headers modernos etiquetan cada parámetro con su intención. No cambian el código generado — son metadatos que la documentación, el IntelliSense y el análisis estático de Microsoft (PREfast) consumen para avisarte cuando pasas algo mal:

|Anotación|Significado|
|:--|:--|

|   |   |
|---|---|
|`_In_`|entrada obligatoria; la función la lee|
|`_In_opt_`|entrada opcional; NULL permitido|
|`_Out_`|salida obligatoria; la función escribe en tu puntero|
|`_Out_opt_`|salida opcional|
|`_Inout_`|la función la lee y puede modificarla|
|`_Inout_opt_`|in/out opcional|

Ejemplo:

```c
BOOL ExampleFunction(
    _In_     DWORD   dwProcessId,   // tú lo proves, la función lo lee
    _In_opt_ LPCWSTR lpFilePath,    // string o NULL
    _Out_    PDWORD  pdwExitCode    // la función escribe tu DWORD
);
```

En headers viejos encontrarás el equivalente con macros: `IN`, `OUT`, `OPTIONAL`. Mismo significado, sintaxis de otra época.

Cómo exprimirlo: cuando leas el prototype de una API de memoria o procesos, las anotaciones te dicen qué datos estás entregando al kernel en cada argumento — y un EDR que intercepte esa llamada inspecciona exactamente esos campos. Leer `_In_ HANDLE hProcess` + `_Out_ LPVOID *ppAddress` te dice, antes de ejecutar nada, qué vas a revelar y qué vas a recibir.

### Estructuras por puntero

Pasar una struct entera por valor copia todo su contenido — prohibitivo para structs grandes, y además inútil cuando quieres que la función la rellene. El patrón real es puntero + flecha:

```c
void PrintReaderInfo(const READER_INFO* p) {   // solo lectura (const)
    if (p == NULL) return;
    printf("%d\n", p->Id);
}

BOOL InitReaderInfo(PREADER_INFO p) {          // la función RELLENA
    if (p == NULL) return FALSE;
    p->Id = 1470;
    p->Age = 34;
    return TRUE;
}
```

Ejemplo Win32:

```c
SYSTEM_INFO si = { 0 };        // mi struct, limpia
GetSystemInfo(&si);            // la API escribe dentro
printf("%lu procesadores\n", si.dwNumberOfProcessors);
printf("%lu page size\n", si.dwPageSize);
```

Flujo: declaras la struct en tu stack → pasas su dirección → el sistema escribe los resultados → lees los campos. Cada vez que veas un parámetro puntero a struct, pregunta: ¿input, output, o ambos?

### Pointer-to-pointer: dos niveles de indirección

Cuando la función necesita **asignar memoria y entregarte la dirección**, no puede escribir en tu variable puntero sin conocer su dirección → necesita un puntero a tu puntero:


```c
BOOL AllocateBuffer(PBYTE* ppBuffer, DWORD cbBuffer) {
    if (ppBuffer == NULL || cbBuffer == 0)
        return FALSE;

    *ppBuffer = HeapAlloc(GetProcessHeap(), HEAP_ZERO_MEMORY, cbBuffer);
    return (*ppBuffer != NULL);
}
```

Después de la llamada, `main` tiene la dirección real en su `pBuffer`. Por eso abundan los nombres `ppBuffer`, `ppvObject` (COM devuelve interfaces así: tú pasas `IUnknown**` y la función escribe el puntero a la interfaz en tu variable).

### Ownership y lifetime

Pasar un puntero no transfiere propiedad automáticamente. Hay dos contratos, y mezclarlos es heap corruption:

**Contrato 1 — caller-owned:** tú reservas, la función solo lee o escribe dentro. Tú liberas.


```c
BYTE Buffer[1024] = { 0 };   // mío
ReadFile(hFile, Buffer, sizeof(Buffer), &read, NULL);   // escribe en mi buffer
```

**Contrato 2 — function-allocated:** la función reserva y te entrega el puntero por `pp`. Ahora tú eres responsable de liberar — **con la función pareja que el contrato indique**:

|Reservado con|Liberado con|
|:--|:--|

|   |   |
|---|---|
|`HeapAlloc`|`HeapFree(GetProcessHeap(), 0, p)`|
|`FormatMessageW` con `FORMAT_MESSAGE_ALLOCATE_BUFFER`, `LocalAlloc`|`LocalFree`|
|`CoTaskMemAlloc`, APIs COM que devuelven buffers|`CoTaskMemFree`|

Liberar un buffer COM con `HeapFree`, o uno de heap con `LocalFree`, corrompe el heap: el allocator de cada familia es distinto. En un proceso ofensivo, un crash por heap corruption es señal de actividad (evento de aplicación, WerFault) encima de un bug real.

---

##  Manejo de errores del API de Windows

No existe un sistema único. Tres familias de APIs reportan de tres formas, y usar el mecanismo equivocado es error clásico:

|Estilo|Retorna|Detección de fallo|Dónde está el detalle|
|:--|:--|:--|:--|

|   |   |   |   |
|---|---|---|---|
|Win32|`BOOL`, `HANDLE`, puntero, `DWORD`|valor de fallo documentado por función|`GetLastError()`|
|COM|`HRESULT`|`FAILED(hr)` / `SUCCEEDED(hr)`|el propio `HRESULT`|
|Native (`Nt*`, `Rtl*`)|`NTSTATUS`|`!NT_SUCCESS(Status)`|el propio `NTSTATUS`|

### Win32: el patrón GetLastError

Las APIs Win32 devuelven un valor simple de éxito/fracaso; el código detallado vive aparte:


```c
HANDLE hFile = CreateFileW(
    L"C:\\Temp\\example.txt",
    GENERIC_READ, 0, NULL,
    OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);

if (hFile == INVALID_HANDLE_VALUE) {          // fallo documentado de CreateFileW
    DWORD dwError = GetLastError();           // INMEDIATAMENTE
    printf("[!] CreateFileW fallo: %lu\n", dwError);
    return FALSE;
}
```

Cada función documenta su valor de fallo: `CreateFileW` → `INVALID_HANDLE_VALUE`; otras → `NULL`; las `BOOL` → `FALSE`. Nunca asumas: lee la página de la función.

Qué es GetLastError por dentro (detalle útil): cada hilo tiene un bloque de datos propio, el **TEB** (Thread Environment Block), y dentro un campo `LastErrorValue`. Cada API al terminar puede escribir ahí; `GetLastError()` simplemente lee ese campo del TEB del hilo actual. Consecuencias prácticas:

- Es **por hilo**: dos hilos no se pisan el error entre sí.
- Se **sobreescribe** con cada API subsiguiente: si llamas a otra cosa antes de leerlo, perdiste el error real. Ley de oro: inmediatamente después del fallo, nada en medio.
- Solo es válido si la documentación de la función dice que reporta por ahí.

Errores que verás hasta en la sopa:

- `ERROR_FILE_NOT_FOUND` (2) — archivo no existe
- `ERROR_PATH_NOT_FOUND` (3) — la ruta no existe
- `ERROR_ACCESS_DENIED` (5) — sin permisos
- `ERROR_INVALID_PARAMETER` (87) — parámetro mal  
- `ERROR_ALREADY_EXISTS` (183) — ya existe
 

### FormatMessageW: número → texto


```c
VOID PrintLastError(LPCWSTR lpFunctionName) {
    DWORD dwError = GetLastError();
    LPWSTR lpMessageBuffer = NULL;

    FormatMessageW(
        FORMAT_MESSAGE_ALLOCATE_BUFFER |   // "asigna tú el buffer y dame el puntero"
        FORMAT_MESSAGE_FROM_SYSTEM |       // "traduce códigos de error del sistema"
        FORMAT_MESSAGE_IGNORE_INSERTS,     // "no insertes parámetros en el texto"
        NULL,
        dwError,
        0,
        (LPWSTR)&lpMessageBuffer,          // ¡pointer-to-pointer! por eso el cast
        0,
        NULL);

    wprintf(L"[!] %s fallo con %lu: %s\n",
        lpFunctionName, dwError,
        lpMessageBuffer ? lpMessageBuffer : L"Unknown error");

    if (lpMessageBuffer)
        LocalFree(lpMessageBuffer);        // ALLOCATE_BUFFER → LocalAlloc interno → LocalFree
}
```

Uso:


```c
if (hFile == INVALID_HANDLE_VALUE) {
    PrintLastError(L"CreateFileW");
    return FALSE;
}
```

Fíjate en el detalle elegante: el quinto parámetro es `(LPWSTR)&lpMessageBuffer` — el patrón `pp` de la sección anterior en vivo. Y el ownership: como pediste `ALLOCATE_BUFFER`, la memoria es tuya y la liberas con `LocalFree`. Esta función auxiliar te servirá en absolutamente todo desarrollo Win32.

### HRESULT: los 32 bits con estructura

Las APIs COM devuelven el estado **directamente**, empaquetado en 32 bits con campos definidos:

```plain
bit  31      : severidad   (1 = error, 0 = éxito)
bits 30-16   : facility    (quién generó el error)
bits 15-0    : code        (el código específico)
```

Valores canónicos:

- `S_OK` (0x00000000) — éxito
- `S_FALSE` (0x000000001) — **éxito** con condición "false" — ¡ojo con esto!  
- `E_FAIL`, `E_INVALIDARG`, `E_OUTOFMEMORY`, `E_ACCESSDENIED`, `E_NOTIMPL` — fallos


```c
#define SUCCEEDED(hr) (((HRESULT)(hr)) >= 0)
#define FAILED(hr)    (((HRESULT)(hr)) < 0)
```

Por eso jamás `hr == S_OK`: `S_FALSE` también es éxito y tu comparación lo trataría como fallo. Los macros evalúan el bit de severidad: todo valor >= 0 es éxito.

El truco de lectura mental: `HRESULT_FROM_WIN32(ERROR_ACCESS_DENIED)` = `0x80070005`. Desarmado:

- `8` → severidad 1 (error)
- `007` → facility 7 = FACILITY_WIN32
- `0005` → el código Win32 original (ERROR_ACCESS_DENIED = 5)

Así reconoces 0x80070002 como "file not found de Win32" sin tabla. Los macros `HRESULT_CODE`, `HRESULT_FACILITY`, `HRESULT_SEVERITY` extraen cada campo.

### NTSTATUS: el dialecto nativo

Las Native APIs (`NtCreateFile`, `NtAllocateVirtualMemory`, `RtlGetVersion`...) devuelven el status **directamente**, sin GetLastError. `NTSTATUS` es un entero de 32 bits **con signo**:


```c
NTSTATUS Status = NtExampleFunction(...);

if (Status != STATUS_SUCCESS) {          // funciona, pero hay mejor patrón
    printf("0x%08X\n", Status);
    return FALSE;
}
```

El patrón correcto:


```c
if (!NT_SUCCESS(Status)) {
    printf("[!] fallo: 0x%08X\n", Status);
    return FALSE;
}
```


```c
#define NT_SUCCESS(Status) (((NTSTATUS)(Status)) >= 0)
```

¿Por qué no comparar contra `STATUS_SUCCESS`? Porque hay NTSTATUS **informativos exitosos** que no son cero (su severidad es 1, no 0). El macro acepta severidades 0 y 1 como éxito; los errores reales tienen severidad 2 o 3 y son negativos como signed.

La anatomía de un NTSTATUS:

```plain
bits 31-30 : severidad  (0 = éxito, 1 = información, 2 = warning, 3 = error)
bit  29    : customer bit
bit  28    : reservado
bits 27-16 : facility
bits 15-0  : code
```

Los macros finos que desarman la severidad:

c

```c
#define NT_INFORMATION(Status) ((((ULONG)(Status)) >> 30) == 1)
#define NT_WARNING(Status)     ((((ULONG)(Status)) >> 30) == 2)
#define NT_ERROR(Status)       ((((ULONG)(Status)) >> 30) == 3)
```

Ejemplo real: `STATUS_ACCESS_DENIED` = 0xC0000022. En binario, los dos bits altos son `11` → severidad 3, error. Como signed, 0xC0000022 es negativo — de ahí que `>= 0` distinga éxito de error.

Fallos típicos que aprenderás a reconocer de memoria:

- `STATUS_ACCESS_DENIED` (0xC0000022)
    
- `STATUS_INVALID_PARAMETER` (0xC000000D)
    
- `STATUS_OBJECT_NAME_NOT_FOUND` (0xC0000034)
    
- `STATUS_INVALID_PAGE_PROTECTION` (0xC0000045)
    

Por qué este dialecto importa tanto: en la capa nativa es tu única fuente de verdad. Cuando ejecutes syscalls directos, el status vuelve en el registro del procesador y lo evalúas con `NT_SUCCESS` — sin esa comprobación, un syscall fallido pasa desapercibido y tu código opera sobre memoria inexistente.

---

|Estilo API|Retorna|Check de fallo|Detalle|
|:--|:--|:--|:--|

|   |   |   |   |
|---|---|---|---|
|Win32|`BOOL`/`HANDLE`/puntero/`DWORD`|valor de fallo documentado|`GetLastError()` en caliente|
|COM|`HRESULT`|`FAILED()` / `SUCCEEDED()`|el propio valor (severidad/facility/code)|
|Native|`NTSTATUS`|`!NT_SUCCESS()`|el propio valor (2 bits de severidad)|

---