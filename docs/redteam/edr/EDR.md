---
title: EDR
sidebar_position: 1
---

## ¿Qué es esto?

Y bien, acá pongo mis notas sobre lo que vea de EDR's. Siguiendo la fucking filosofía que tengo...

> Entiende cómo funciona, cómo se protege, cómo se configura ¿Qué es lo que ve? Y ¿Por? Para saber cómo darle la vuelta ;)

## ¿Qué es un EDR?

Un **Endpoint Detection and Response** monitorea endpoints continuamente buscando actividad maliciosa y puede actuar automáticamente para mitigarla. Endpoint = cualquier dispositivo en red: desktops, laptops, VMs, IoT.


## Cimientos: cómo está organizado Windows por dentro

### User mode vs kernel mode

Windows divide todo el software en dos pisos de un edificio:

- **User mode (los inquilinos)**: corren tus programas: Chrome, Word, tu malware. Cada uno vive aislado en su propio departamento: no leen la memoria de los demás, no tocan hardware directamente, no ven qué hace el SO. Si un programa crashea, muere solo sin tumbar el edificio.

- **Kernel mode (el sótano de las máquinas)**: vive el núcleo de Windows y los **drivers**. Aquí el código tiene poder total: lee toda la memoria de todos los procesos, ve cada archivo, cada conexión, cada proceso que nace. Si algo crashea aquí → **BSOD**, se cae todo el edificio.

**Analogía**: user mode es el comedor del restaurante, los clientes piden a los meseros (llamadas API) y nunca entran a la cocina. Kernel mode es la cocina: quien está ahí ve y toca todo.

**Por qué importa**: un EDR necesita ver TODO, todos los procesos, archivos, red. Desde user mode eso es imposible (las paredes lo ciegan). Por eso todo EDR instala **drivers** en kernel mode: ven el edificio entero desde el sótano.

### ¿Qué es un driver?

Un programa que corre en kernel mode para hablar con hardware o con el propio Windows. Sin ventana, sin barra de tareas. Se instala como servicio y Windows lo carga al arrancar. Como tiene poder total, Windows exige que esté **firmado digitalmente**, un certificado confiable que diga "esto lo hizo X y no fue modificado". Un driver sin firma no carga. (Las técnicas como BYOVD usan drivers legítimos pero vulnerables para evadir esto — llegará en la Unidad 7.)

### ¿Qué es telemetría?

"Los datos que reporta el sistema". Cuando nace un proceso, se carga una DLL, se abre un archivo, un proceso escribe en la memoria de otro, Windows puede **avisar** a quien esté escuchando. El EDR recolecta ese flujo constante de eventos.

**Analogía**: es el tablero de vuelo del avión. Cada sensor reporta algo (velocidad, altitud, temperatura). El piloto (backend del EDR) no puede mirar 500 indicadores cada microsegundo, revisa lotes y prioriza. Un atacante que sabe qué sensores existen, qué revisa el piloto y cada cuánto, sabe qué maniobras no dejan rastro. **Ese gap entre "todo lo que pasa" y "lo que el EDR procesa" es donde vive la evasión.**

### ¿Qué es un callback?

Mecanismo de Windows para decirle a un driver: *"cuando pase tal evento, te aviso y te dejo mirarlo o cancelarlo"*. Es una suscripción a notificaciones:

| Suscripción | Evento que reporta |
|---|---|
| `PsSetCreateProcessNotifyRoutine` | Se creó un proceso |
| `PsSetCreateThreadNotifyRoutine` | Se creó un hilo |
| `PsSetLoadImageNotifyRoutine` | Se cargó una imagen/DLL |
| `ObRegisterCallbacks` | Alguien abrió/duplicó un handle a un objeto |
| `CmRegisterCallback` | Alguien tocó el registry |

El driver del EDR se suscribe a todos; el kernel lo llama cada vez que pasa algo; el driver anota y reenvía. **Esa es la fuente principal de visibilidad de un EDR moderno**: no magia, suscripciones a eventos del kernel.

### ¿Qué es IPC?

**Inter-Process Communication**: cómo se hablan dos procesos. La DLL espía que vive dentro de Chrome necesita mandar datos al servicio del EDR que vive en otro proceso → usan un canal IPC (named pipes, sockets locales, memoria compartida). "Manda telemetría por IPC al servicio" = mensajería entre procesos.

### ¿Qué es PPL (Process Protection Light)?

El problema obvio: si el EDR corre como programa normal, el malware puede matarlo (`OpenProcess` + `TerminateProcess`) y dejarlo ciego. Respuesta de Windows: **niveles de protección de proceso**. Un proceso PPL `Light (Antimalware)` solo puede ser abierto/terminado/inyectado por procesos con **igual o mayor nivel** y firma anti-malware. Tu malware corre sin protección → no puede tocar al servicio del EDR.

**Analogía**: un guardia sin uniforme cualquiera lo puede golpear; un guardia con placa solo lo toca alguien de su misma fuerza o superior.

### ¿Qué es WHQL y el certificado ELAM?

Microsoft firma drivers validados por **WHQL** (Windows Hardware Quality Labs). Para ser ELAM, además necesita un EKU específico (`1.3.6.1.4.1.311.61.4.1`) que lo autoriza a arrancar antes que todos los demás drivers. El ELAM driver también lleva un recurso embebido que dice **qué certificados firman los binarios del servicio anti-malware** — esa es la cadena que permite al servicio correr como PPL.

---

## Modelo general de operación

1. El **agent** se instala en el endpoint → el sistema pasa a ser un "managed device".
2. El agent instala **sensors** (componentes software) que capturan telemetría de fuentes distintas.
3. A intervalos, el agent envía telemetría al **backend** (casi siempre cloud).
4. El backend analiza y correlaciona eventos para identificar IoCs: queries a BD, ML, etc.
5. El backend puede mandar comandos de vuelta: matar un proceso, aislar el endpoint.

## La restricción que define todo: recursos

- Analizar todo en tiempo real, en todos los endpoints, no escala: CPU en el endpoint, ancho de banda, capacidad del backend (miles de endpoints).
- Por eso los EDRs **hacen batch, priorizan y procesan selectivamente**.
- Consecuencia: **el agente no puede instrumentar ni analizar cada evento posible**. Hay señales que no mira, momentos en que no mira, y datos que llegan a la nube con delay.

---

## Métodos de detección

### 1. Static (sin ejecutar el archivo)

- Hash vs bases de datos de malware conocido.
- Scan de patrones conocidos.
- Clasificación por modelo ML entrenado con millones de muestras.
- Aplica también a **memoria**: el agente puede subir dumps de proceso al cloud.
- Archivo con características "de malware" (PE sin firma, sin imports, tamaño diminuto) → clasificado malicioso aunque nunca haya corrido. Es lo que atacan la reducción de entropía y el file bloating.

### 2. Heuristic (rasgos que correlacionan, sin match exacto)

- Entropía alta → sospecha de packing/encriptación.
- Combinación de imports sospechosos: `VirtualAllocEx + WriteProcessMemory + CreateRemoteThread`.
- Falta de firma digital en exe en ubicación inusual.
- Implementado como **detection rules**: queries sobre los logs.

### 3. Behavioural (baseline + anomalías)

- Modela lo normal del endpoint (logons, procesos, horarios) y flaggea desviaciones.
- Ejemplo: endpoint hablando con dominio desconocido por HTTP a horas raras.
- ML pesado para el modelo de "normal".

---

## Detection Rules el corazón del asunto

Una regla = **un patrón en log data que indica un posible IoC**, implementado como query en lenguaje propietario:

- CrowdStrike → **CQL** (CrowdStrike Query Language)
- Elastic → **EQL** (Event Query Language)
- Casi todos permiten reglas custom del cliente.

### Ejemplo 1: Mimikatz por command line (EQL)

Lectura línea por línea: _"en los eventos de tipo `process`, cuando un proceso arranca (`event.action == "start"`), si sus argumentos contienen alguno de estos comandos conocidos de Mimikatz → match"_.

Partes de la regla:

- **query** → la lógica. Lo más importante: mal escrita genera falsos positivos (flaggea benigno) o falsos negativos (deja pasar malicia). 
- **actions** → respuesta: `kill_process` sobre el proceso que matcheó.
- metadata: `id`, `name`, `version`, `min_endpoint_version` (agent mínimo que soporta la regla), `os_list`, `reference`.
- 

### Ejemplo 2: DLL sideloading por proceso SYSTEM (EQL)

Correlación más rica. Lectura: _"en eventos de tipo `library` (carga de DLL), cuando un proceso firmado por Microsoft que corre como SYSTEM carga una DLL que fue creada hace menos de 500 segundos, no tiene firma confiable, no está en un path conocido, no es un proceso de la lista de excluidos, y no es un hash benigno conocido → match"_.

Condiciones que forman el patrón:

- `process.code_signature.subject_name : "Microsoft *"` — el proceso anfitrión es legítimo de Microsoft.

- `user.id : ("S-1-5-18", "S-1-5-19", "S-1-5-20")` — corre como SYSTEM/SERVICIOS/NETWORK SERVICE (SIDs bien conocidas).
   
- `not dll.code_signature.status : "trusted"` — la DLL cargada **no** tiene firma válida.
  
- `dll.Ext.relative_file_creation_time <= 500` — la DLL fue creada hace menos de ~8 minutos (recién soltada en disco).  

- Exclusiones para reducir falsos positivos: procesos legítimos que cargan DLLs de forma normal (`rundll32`, `powershell`, `msiexec`...), paths de sistema legítimos (`WinSxS`, `SoftwareDistribution`...), y hashes explícitos de DLLs benignas.

> **Lección ofensiva**: las reglas buenas no solo detectan  **excluyen lo normal**. Si tu técnica imita lo excluido (DLL vieja, path legítimo, proceso fuera de la lista), la regla pasa de largo. Leer reglas open source de Elastic es leer el manual de qué NO hacer.

---

### Alertas y retención

- Match → alerta en el dashboard del portal cloud: endpoint afectado, acciones, severidad.
- **Retención típica: ~90 días por default** (ampliable según licencia).
- DFIR (Digital Forensics and Incident Response): si la ventana es corta, la evidencia de intrusiones largas ya no existe. El hunting retrospectivo muere con la retención.
- Dato ofensivo: comprometer un endpoint hace 6 meses puede estar fuera de ventana si el DFIR llega tarde.

---

### Anti-malware Service (PPL)

El cerebro del agente, corriendo en **user mode** a propósito (el kernel es peligroso — un bug = BSOD — y aquí es más fácil hablar red/backend). Sus trabajos:

- Coordinar a los demás componentes.
- Recibir telemetría de los sensors vía IPC.
- Enviar lotes de telemetría al backend cloud.
- **Memory scanning**: pedir dumps de procesos y pasarles reglas **YARA** (lenguaje de patrones: "si la memoria contiene estos bytes/cadenas → sospechoso"). Reglas locales en disco + reglas que bajan del cloud.
- Ejecutar acciones remotas: `kill_process`.

Corre como PPL precisamente para que el malware no pueda matarlo, y puede ser PPL gracias al recurso embebido en su ELAM driver que valida sus certificados.

### ELAM Driver

- Driver kernel inicializado **antes que los demás boot-start drivers** → identifica drivers maliciosos antes de que cargue el resto del boot chain.
- Firma obligatoria: Microsoft WHQL + EKU `1.3.6.1.4.1.311.61.4.1`.
- Puede influir en la inicialización de otros drivers según su nivel de confianza.  
- Cuando todo el boot termina, se descarga — hizo su trabajo de frontera.  

**Analogía**: el control de pasaportes antes de abordar el vuelo. Revisa a todos los pasajeros (boot drivers); despegado el sistema, el control ya cerró.

### User-Mode DLL

Hay información que el kernel **no ve**: qué hace un proceso dentro de su propia memoria, qué strings tiene cargados — detalles que solo existen desde adentro. Solución: el agent **inyecta esta DLL en casi todos los procesos user** (excepto críticos del sistema). La DLL:

- Observa desde dentro del proceso anfitrión.
- Manda lo que ve por IPC al anti-malware service.

> **El punto ofensivo clave**: esa DLL vive _dentro de tu proceso_, y tu proceso controla su propia memoria. Modificar lo que reporta (o desinstalarla de tu proceso) deja al EDR ciego **solo en ese proceso** — sin matar nada, sin PPL que lo impida. Eso es exactamente el **unhooking / patching de telemetría** de las Unidades 4-5. La cámara más útil del EDR es también la más vulnerable: la que pusiste dentro de la casa del ladrón.

### General-Purpose Driver

Driver kernel para telemetría exclusiva de kernel-mode. Se suscribe a los **callbacks** del kernel (procesos, hilos, imágenes cargadas, handles) y típicamente es quien **carga la user-mode DLL** en cada proceso nuevo (es él quien decide "nació un proceso, inyéctale nuestro espía").

### Minifilter Driver

Un **minifiltro** (_minifilter driver_) es un tipo especial de **controlador de modo núcleo** en Windows que se integra en la pila del sistema de archivos para **supervisar, interceptar, modificar o bloquear** las operaciones de entrada/salida (E/S) de los archivos

Windows da a los drivers una forma estandarizada de colgarse del filesystem: los **minifilters**. Este driver ve (y puede **bloquear**) cada operación de archivos: crear, leer, modificar, borrar. Dos usos:

- Telemetría: "tal proceso escribió tal archivo".
- **Anti-tampering**: si alguien intenta modificar/borrar los binarios del propio EDR, el minifilter lo bloquea. El cerrojo que impide desconectar las cámaras.

---

### Cómo se conecta todo en un ataque real

1. Nace tu proceso → el **general-purpose driver** lo ve por callback → el EDR ya sabe que existe.
2. El EDR inyecta su **user-mode DLL** en tu proceso → observado desde dentro.
3. Tu implant llama `VirtualAllocEx` + `WriteProcessMemory` en otro proceso → el callback de imagen/handle lo registra; la combinación de APIs matchea una **heuristic rule**; la DLL espía también lo reporta si sigue viva.
4. El anti-malware service junta todo → **backend** → una **EQL rule** corre sobre los logs → alerta.
5. El backend ordena `kill_process` → tu implant muere.


### Analogía global

El endpoint es un edificio y el EDR su sistema de seguridad:

|                                        |                                                                                 |                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sensors**                            | **Las Cámaras del C5, los "Viene-Viene" y los Sensores del Arco Vial**          | El sensor de piso es el acomodador de coches que nota si un camión viene muy pesado; la cámara del poste ve las placas; el micrófono del "botón de pánico" escucha el ruido de los motores. Cada quien cacha un pedazo del chisme.                                                                                                                                                                               |
| **Agent**                              | **El "Poli" de la Caseta de Monitoreo Local**                                   | El oficial de guardia en el cuartito del Edificio B. No tiene poder para arrestar a nadie a nivel macro, pero se la pasa juntando los reportes de su bitácora y subiendo los videos al sistema central por el internet (que a veces se le va).                                                                                                                                                                   |
| **Backend**                            | **El Centro de Comando C5 Central (Que vigila 32 estados)**                     | Una sala llena de pantallas gigantes en la CDMX que monitorea mil complejos en el país. Como los operadores humanos se cansan y el sistema se satura, el software les avisa por "lotes" de alertas cada hora. El delincuente mañoso sabe que a la hora del cambio de turno (el _batching_) o en las zonas donde las cámaras son de plástico (puras carcasas para espantar), puede meter el contrabando "gratis". |
| **PPL** _(Protected Process Light)_    | **El Agente de la Guardia Nacional (con la Conducción del Ministerio Público)** | Un oficial con charola federal y fuero. Los delincuentes comunes o los vigilantes locales no le pueden dar órdenes ni desarmarlo porque viene protegido "desde arriba" por la ley constitucional.                                                                                                                                                                                                                |
| **ELAM** _(Early Launch Anti-Malware)_ | **El Retén Militar de la Sedena en la Entrada del Estado**                      | La primera línea de defensa en la carretera antes de entrar a la zona urbana. Revisan el primer convoy de camiones a las 4:00 AM, antes de que abran las rejas de la ciudad y comience el tráfico pesado, asegurando que no entren armas desde el inicio.                                                                                                                                                        |
| **Detection Rules**                    | **La Ficha de Alerta del "Cártel del Retrovisor" (El boletín con foto)**        | La circular que pegan en el tablero: _"Ojo con sujeto de playera del América, gorra de los Yankees al revés, que maneja un Tsuru blanco con el faro izquierdo fundido"_. Si el sospechoso se pone una playera de las Chivas y se sube a un Aveo gris, pasa frente al guardia y ni le da un bajón de adrenalina.                                                                                                  |
| **Minifilter**                         | **La Caja de Acero con Candado Alto Impacto que cubre los cables del módem**    | Ese cerrojo blindado y soldado al poste que impide que el típico pillo use un palo de escoba para desconectar los cables de la luz o el internet de las cámaras. Intercepta cualquier intento físico de apagar el sistem                                                                                                                                                                                         |


### **Lo esencial, en corto:**

- El EDR es un problema de recursos: no ve todo ni en tiempo real. Batch + priorización = tu espacio de maniobra.
- Las detection rules son queries sobre logs, no magia. Las de Elastic son open source — leerlas es leer el manual de qué patrón evitar.
- PPL/ELAM existe porque el EDR también debe defenderse; BYOVD es la respuesta ofensiva.
- La user-mode DLL es la cámara más détil: vive dentro de tu proceso y tu proceso la controla → unhooking.
