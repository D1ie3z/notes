---
title: PCI DSS - la norma del alcance
sidebar_position: 12
---

**Analogía para empezar**: PCI DSS es como el reglamento de bomberos de un edificio: no te dice cómo apagar todos los incendios posibles, te dice qué partes del edificio deben estar protegidas, qué se puede guardar y qué está prohibido tener. Y como todo reglamento, describe dónde cree la organización que están sus datos — el trabajo del auditor está en la brecha entre esa creencia y la realidad.

**Versiones**: v4.0.1 (junio 2024, vigente), v4.0 (marzo 2022, retirada el 31 dic 2024), v3.2.1 (retirada el 31 mar 2024). La 4.0.1 no renumeró nada; un número de una fuente 3.2.1 normalmente NO apunta al mismo requisito (el Requisito 3 se reorganizó). Cita con el número comprobado en tu copia vigente — el cliente lo va a verificar.

## El alcance es el único concepto que importa

CDE = sistemas que almacenan/procesan/transmiten datos de tarjetahabiente **+ los conectados a ellos + los que "could impact the security of cardholder data"**. La conectividad es una puerta; la influencia es otra. Ejemplos de la norma para la tercera: **resolución de nombres, servidores de redirección web, un CDN, un pipeline de compilación** — sistemas que nunca tocan un número y deciden a dónde lo manda un navegador.

> Primera pregunta de cualquier trabajo: "¿por qué crees que este sistema está fuera de alcance?", seguida de una prueba. La segmentación afirmada en un diagrama y la aplicada por una regla de firewall son cosas distintas; solo la segunda cuenta.

- **La segmentación NO es un requisito** ("strongly recommended"); sin ella, toda la red queda dentro ("flat network").
- Fuera de alcance solo si el componente está aislado "such that… could not impact the security of cardholder data, **even if that component was compromised**". Léele esa frase a un cliente que dibujó una línea.
- Formas de reducir alcance: restringir ubicaciones, eliminar datos que no necesitas, consolidar. Purgar por antigüedad arbitraria no es reducción: los sistemas que tuvieron el dato siguen dentro.

**12.5.2** (la lista de objetivos que puedes pedir el primer día): todos los flujos de datos por etapa (autorización, captura, liquidación, **contracargos, devoluciones** — las etapas que nadie prueba), todos los canales de aceptación, todas las ubicaciones de datos **incluidas las que están fuera del CDE y todos los respaldos**, los controles de segmentación con justificación, las conexiones de terceros. La confirmación anual de la entidad **no es** la validación de alcance del evaluador — si un cliente la ofrece como evidencia, es un hallazgo.

## Cifrar no saca del alcance

"Encryption alone is generally insufficient to render the cardholder data out of scope." Dentro del alcance: sistemas que cifran/descifran, gestión de llaves, datos cifrados **no aislados** de esos procesos, datos en el mismo sistema/entorno que la llave, y datos accesibles a una entidad con acceso a la llave. La rama fuera de alcance es estrecha: un TPSP que solo recibe datos cifrados por otro y no puede descifrarlos, con condiciones.

> Sigue la llave, no el texto cifrado. El host de gestión de llaves suele estar menos endurecido que la base de datos.

## Qué puedes almacenar y qué nunca

Datos de tarjetahabiente (CHD) = PAN, nombre, vencimiento, código de servicio. Datos sensibles de autenticación (SAD) = **datos completos de pista** ("or equivalent on a chip"), código de verificación de tarjeta, PIN y bloques de PIN. Datos de cuenta = la unión. **No son intercambiables.**

| Elemento | Tras la autorización | Regla |
|---|---|---|
| PAN | Puede guardarse, **ilegible** | 3.2 (mínimo) + 3.5 (ilegible) |
| Nombre, vencimiento, service code | Puede guardarse; no tiene que ser ilegible | 3.2 |
| Datos de pista completos | **Nunca, ni cifrados** | 3.3.1.1 |
| Código de verificación | **Nunca** | 3.3.1.2 |
| PIN y bloque de PIN | **Nunca** (volver a cifrarlo no autoriza) | 3.3.1.3 |

> Los 3.3.1.x **no son elegibles para el enfoque personalizado**: la norma ya cerró la puerta a controles equivalentes. Excepción: emisores con necesidad documentada (3.3.3). Y antes de la autorización, la ventana existe pero está regulada: 3.3.2 exige SAD cifrado con criptografía fuerte.

**La línea sobre los bytes (tag 57)**: PAN por sí solo = CHD; PAN + vencimiento + service code + discrecional reensamblados = **track data completa = SAD**. Los discrecionales (donde vive el CVV) NO están en la lista de 4 elementos que pueden conservarse — por eso un sanitizador los aleatoriza.

> Un PAN en una fila de base de datos y un PAN dentro de un registro de pista son los mismos dígitos y dos categorías distintas de error: falla de control vs prohibición (ni siquiera admite enfoque personalizado). Si les das la misma severidad, el hallazgo de pista termina detrás de una política de contraseñas.

## Hacer ilegible (3.5.1) y la trampa

"Rendered unreadable anywhere it is stored", incluido almacenamiento no primario (backups, logs de auditoría, excepción, troubleshooting). Cuatro enfoques: hash de un solo sentido **"of the entire PAN"** (cifrado con llave, 3.5.1.1), truncamiento (**"hashing cannot be used to replace the truncated segment"**), tokens de índice, criptografía fuerte **+ gestión de llaves** (donde suele fallar, y es organizativo).

> "Es trivial reconstruir un PAN si tienes el truncado y el hash juntos" (guía de la norma). Un sistema que trunca el medio y guarda al lado un hash del completo no cumple ninguno de los dos controles.

**Masking (3.4.1) ≠ truncamiento**: "there is no 'un-truncation' without recreating the PAN from another source". En pantalla: BIN + últimos 4 máximo; el centro enmascarado es todo el control.

## Qué maneja la integración

Chase Paymentech OPFS (formato de adquirente de registros de ancho fijo): el registro retail lleva **Swipe Data** = "Actual data from the card magnetic stripe" (76 bytes Track 1 / 39 Track 2) con instrucción "DO NOT MANIPULATE or alter swipe data in any way". El campo del valor de seguridad dice literalmente: **"It is against regulations to store this value"**. El registro de débito lleva Encrypted PIN Number + PIN Key Sequence Number como campos normales.

> La pregunta más rentable: ¿algo guarda en un log el registro de petición saliente? El logging de peticiones/respuestas es lo predeterminado en clientes HTTP, frameworks y runbooks. La guía del 3.3.1.x nombra las fuentes: logs de transacción/histórico/debug/error, archivos de traza, esquemas de BD, dumps de memoria/crash. **La norma espera encontrar los datos en los residuos, no en el almacén.**

## Cuándo termina la autorización

"Completes when a merchant receives a transaction response (for example, an approval or decline)". Antes de liquidar el lote, cerrar el día o archivar. Antes: 3.3.2 cifra. Después: 3.3.1 **"rendered unrecoverable"** — verbo más fuerte que "borrado": el 3.3.1.b pide observar los procesos de borrado seguro. "It is not permissible to store SAD in persistent memory."

**Accidentalmente recibido por un canal no intencionado**: incorporar el canal al CDE, o borrar con seguridad + impedir el canal. No hay tercera opción.

## La sanitización, en la práctica

Las capturas se sanitizan **antes de escribir el archivo** (el sanitizador, el .gitignore y las capturas entran juntos; el historial no muestra versión sucia). Los certificados (90/9F46) se aleatorizan porque, recuperados, contienen el PAN y las llaves raíz están publicadas. Por qué falla la versión ingenua: un escaneo que marque todo lo que pasa Luhn se ahoga en falsos positivos ("VISA CREDIT" empaquetado en ASCII hex = 19 dígitos que pasan Luhn); buscar en todo el campo encuentra secuencias que cruzan campos; "reemplazar el PAN y parar" olvida el certificado; derivar el reemplazo del original cae por fuerza bruta (~1e9 candidatos).

> Ante cada bloque opaco que te pidan tachar: ¿quién tiene la llave? ¿Está publicada? El dato estaba oculto por parecer otra cosa, no por el cifrado.

> Sanitización manual parcial aguas arriba rompió la automática (le dio a una Mastercard un reemplazo de rango Visa). Si heredas datos "ya limpiados", trata la limpieza como un daño que sortear, no como trabajo hecho — y dilo en el reporte.

## P2PE

Cifra dentro del lector con llaves que el comercio nunca posee; descifra solo en un proveedor validado. Reduce requisitos: **no elimina la aplicabilidad** ("does not completely remove the applicability of PCI DSS in the merchant environment"). Y debe ser una solución **listada por PCI** ("ciframos cosas" no es P2PE) — si no está en la lista, la reducción de alcance alegada no existe y todo lo que dejaron de evaluar está dentro del alcance sin probar.

## Qué puede y qué no puede hacer quien prueba

**11.4.1** exige que la metodología de la entidad incluya: cobertura de todo el perímetro del CDE y sistemas críticos; **pruebas desde dentro y desde fuera** (una solo externa no cumple); **validar segmentación y controles de reducción de alcance**; revisar amenazas/vulnerabilidades de los últimos 12 meses (insumo que tienes derecho a pedir); conservar resultados 12 meses. **11.4.5**: pruebas de segmentación cada 12 meses y tras cambios, por un recurso con independencia organizacional (no hace falta ser QSA/ASV; los proveedores tienen cadencia más corta).

> Nada de esto te autoriza a probar nada: el 11.4 obliga a la entidad, no te concede permiso. Prueba solo lo que te pertenece o tienes autorización escrita. La ley aplicable es local; esto no es asesoría legal.

Los documentos de postura (reporte, diagramas de red y de flujo, configuraciones, métodos de llaves) son sensibles: una charla de conferencia construida sobre el data flow diagram de un cliente traiciona esa expectativa aunque no incumpla contrato.

## Qué cambió la 4.0 (best practices que ya son obligatorias desde el 31 mar 2025)

- **8.4.2**: MFA para todo acceso no consola al CDE (hacia dentro, no solo admin remoto).
- **6.4.3**: cada script de la página de pago autorizado, con integridad garantizada e inventariado "with written business or technical justification" — aplica a terceros/cuartas partes; la columna de justificación es donde aparece "lo pidió marketing".
- **11.6.1**: detección de cambios en encabezados HTTP y scripts **"as received by the consumer browser"** — un checksum de lo que guarda el servidor no lo cumple. Respuesta directa al skimming que nunca toca los servidores (iframe del procesador: los scripts del marco son del procesador; los de la página que lo contiene, del comercio).
- **12.3.1**: frecuencias fijadas por la entidad → análisis de riesgos específico (activo, amenaza, probabilidad, justificación). Lee el análisis, no la frecuencia.

**Enfoque personalizado**: "there are no defined testing procedures"; para entidades "risk-mature"; no para SAQ; sin controles compensatorios al lado. El evaluador escribe su propio procedimiento — ese documento es el que hay que pedir.

## Dos cosas que no son ciertas

1. **Pasar a chip no exime**: ninguna proporción de EMV elimina la obligación. EMV reduce falsificación; la norma protege datos almacenados. Problemas distintos, misma tarjeta.
2. **Delegar en un tercero no termina tu obligación**: "remain responsible for ensuring that the account data is protected by the third party per applicable PCI DSS requirements". Cambia lo que demuestras, no si tienes que hacerlo.

Y la tercera: "no hay PAN en el entorno" ≠ sin requisitos — SAD guardado = Requisito 3; TPSP = Requisito 12; un servidor web que controla la generación del formulario de pago también; incidentes aplican a todos.

## Cómo redactarlo

- Nombra el elemento y el requisito: datos de pista, CVV y bloque de PIN son tres conversaciones distintas.
- "El sistema no cumple PCI" no es tu conclusión: reporta el control que falló; el cumplimiento lo determina una evaluación.
- Nada de datos reales en el reporte, ni capturas con recuadro negro (reversible); números de prueba publicados.
- Comprueba el número de requisito en tu copia vigente antes de entregar.

> El cumplimiento es un piso. Un entorno conforme alcanzó una línea base que a casi todo el fraude le da igual: muchos ataques funcionan en entornos plenamente conformes. Un reporte que sostiene ambas cosas vale más que uno que trate cualquiera como la historia completa.