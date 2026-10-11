---
title: Selección de Lenguaje para Tooling Ofensivo
sidebar_position: 1
---

# ¿Qué lenguaje usar para desarrollo de malware?

No existe un lenguaje "correcto" universal. La elección depende de cuatro variables: **objetivo**, **runtime disponible en el target**, **nivel de interacción con el SO** y **controles defensivos presentes**.

## Factores de decisión

- **Dependencias de runtime**: un lenguaje interpretado (Python, PowerShell) requiere que el intérprete/framework exista en el target, o empaquetarlo — lo cual cambia el artefacto y su firma.
- **Acceso al SO**: C/C++ hablan directo con Win32/NTAPI, gestión de memoria, primitivas de procesos/hilos. Los lenguajes de alto nivel acceden a eso a través de capas intermedias.
- **Características del artefacto**: cada lenguaje produce binarios con tamaños, metadata, imports, comportamiento de runtime y patrones de memoria distintos → son señales estáticas para el defensor.
- **Costo de reversing**: binarios compilados en C/C++/Rust son más caros de analizar que scripts, pero **ningún lenguaje es inmune** al reversing.
- **Visibilidad defensiva**: el lenguaje importa menos que el **comportamiento**. Lo que vigila un EDR maduro: APIs usadas, relaciones padre-hijo, permisos de memoria (RWX), red, actividad de filesystem, firma de código, reputación, contexto de ejecución.

## Tabla de lenguajes comunes

| Lenguaje | Uso típico en research |
|---|---|
| C / C++ | Windows internals, Win32/NTAPI, memoria, inyección, loaders, tooling nativo |
| C# / .NET | Tradecraft Windows, AD, dev rápido → **muy monitoreado** en entornos maduros (AMSI) |
| PowerShell | Admin/automatización, tradecraft → altísima visibilidad |
| Python | Labs, builders, parsers, PoC — no payloads dependency-free |
| Go / Rust | Tooling standalone, cross-platform → tradeoffs en tamaño, runtime, detección |
| Assembly | Entender shellcode, calling conventions, stack, reversing. Skill de soporte, no lenguaje primario |

## Alto nivel vs bajo nivel

Es un espectro, no una frontera binaria:

- **Alto nivel** (Python, PowerShell, C#): más abstracción, prototipado rápido, pero arrastran intérprete/runtime/framework que suma visibilidad defensiva.
- **Bajo nivel** (C, C++): control directo de memoria, estructuras, calling conventions y salida del compilador. Es por eso que históricamente dominan el malware Windows: **hablan con el SO sin traductor**.

### Conclusión

Elegir lenguaje es elegir el vehículo del trabajo:

- **PowerShell/C# en un entorno maduro** = ir en bus público: barato y rápido, pero hay cámaras, horarios registrados y todos los pasajeros (telemetría) te ven.
- **C compilado** = construir tu propio vehículo pieza por pieza: decides cada tornillo (imports, secciones PE, CRT), no dependes de que el target tenga estación de servicio (runtime), y el resultado no se parece a nada de catálogo (menos firmas genéricas).
- **Python** = furgoneta de producción: perfecta para mover el equipo (builders, ofuscadores, C2 infra), pero nunca la usas en la escena del crimen (el endpoint).
