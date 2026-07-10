---
title: storage
sidebar_position: 1
---

## ¿Qué es?

Existen distintos tipos de almacenamiento dentro de Android, pero principalmente se divide en 3:


## Internal Storage
Este tipo de almacenamiento se encuentra dentro de la memoria flash del dispositivo, aqui se encuentran los datos de la app. 

El path suele ser el siguiente:

```python
/data/data/apk-path/cache
		.../files
		.../databases
		.../shared_prefs
```

Este directorio es privado y unicamente accesible por la aplicación a la que le pertenece, por lo que otra app no podria ver los datos que se encuentran dentro de este directorio.

La unica forma de ver dichos datos es con un dispositivo rooteado.

```python
# no root permissions
emu64a:/ $ ls -lah /data/data/
ls: /data/data/: Permission denied

# with root permissions
emu64a:/ $ su root
emu64a:/ # ls -lah /data/data/
total 1.3M
drwxrwx--x 178 system         system          12K 2024-08-11 17:52 .
drwxrwx--x  50 system         system         4.0K 2024-08-09 02:09 ..
drwx------   4 system         system         4.0K 2024-08-08 01:05 android
drwx------   4 u0_a53         u0_a53         4.0K 2024-08-08 01:05 android.auto_generated_rro_vendor__
drwx------   5 u0_a130        u0_a130        4.0K 2024-08-08 01:06 android.ext.services
drwx------   4 u0_a85         u0_a85         4.0K 2024-08-08 01:05 android.ext.shared
drwx------   4 u0_a131        u0_a131        4.0K 2024-08-08 01:05 com.android.adservices.api
drwx------   4 u0_a64         u0_a64         4.0K 2024-08-08 01:05 com.android.apps.tag
drwx------   4 u0_a57         u0_a57         4.0K 2024-08-08 01:05 com.android.backupconfirm
...
```

En el caso de tener un dispositivo con múltiples usuarios, se crearán múltiples carpetas /data (Una para cada app de cada usuario)

Dentro del almacenamiento interno se incluyen distintos directorios, los cuales son:

### Shared Preferences

Las aplicaciones usan las shared preferences para almacenar algunos valores pesistentes. Una especie de base de datos pequeña de cada aplicación.

Como su nombre lo indica, este directorio principalmente esta se utiliza para almacenar preferencias de usuario, asi como tambien valores pequeños como las configuraciones del usuario.

Estos datos se almacenan en un fichero XML dentro de ./shared_prefs en el almacenamiento interno.

Aqui es comun que se almacenen access tokens u otro tipo de secretos (Lo cual no es un issue perse), pero vuelve un target bastante interesante este fichero.

Es importante recordar que este fichero es privado y únicamente accesible por la aplicación dueña.

El siguiente codigo se encarga de obtener las shared preferences, y registrar un nuevo valor:

```java
SharedPreferences sharedPreferences =
					getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
					
SharedPreferences.Editor editor = sharedPreferences.edit();
editor.putString("example_key","Hello, Shared Preferences!");
editor.apply();
```

### Databases
Muchas aplicaciones utilizan SQLite3 para almacenar estructuras de datos un poco más complejas en el almacenamiento interno.

Android ya tiene instalada por defecto la herramienta sqlite3 para interactuar con los ficheros de la base de datos directamente:

```java
emu64a:/data/data/io.hextree.storagedemo $ sqlite3 databases/example.db
sqlite> .tables
android_metadata  example_table
sqlite> select * from example_table;
1|Hello, Database!
sqlite> PRAGMA table_info(example_table;
0|id|INTEGER|0||1
1|id|INTEGER|0||0
```

El siguiente codigo muestra como crear una tabla e interactuar con ella:

```java
SQLiteDatabase db = openOrCreateDatabase("example.db",Context.MODE_PRIVATE, null);

db.execSQL("CREATE TABLE IF NOT EXISTS example_table (id INTEGER PRIMARY KEY, text TEXT);");

db.execSQL("INSERT INTO example_table (text) VALUES ('Hello, Database!');");
```

### Cache Files

Este directorio lo utilizan las apps para almacenar archivos temporales, por ejemplo, descargas temporales que no son necesarias de manera persistente por el aplicativo o que pueden ser redescargadas bajo demanda.

El directorio Cache puede ser limpiado automaticamente por el sistema (Por ejemplo cuando se tenga poco almacenamiento) o incluso por el usuario.

Ejemplo de almacenamiento en cache:

```java
File cacheFile = new File(getCacheDir(), FILE_NAME);
fos = new FileOutputStream(cacheFile);
fos.write("Hello, Cache Storage!".getBytes());
```

En el codigo anterior se puede observar como se usa la función getCacheDir() para obtener el directorio del cache. Muy muy muy rara vez se utilizan las rutas directas (Prácticamente nunca), en su lugar se usan este tipo de funciones.

----

De igual forma se incluye el directorio “/files”, el cual no tiene nada de especial, es simplemente un directorio en el que se almacenan los datos del aplicativo. Es un directorio de uso general.

Para guardar un dato en dicho directorio se puede utilizar el siguiente codigo:

```java
File filesFile = new File(getFilesDir(), FILE_NAME);
fos = new FileOutputStream(filesFile);
fos.write("Hello, File Storage!".getBytes());
```

## External Storage

El external storage anteriormente era la tarjeta SD. Sin embargo actualmente cada vez se ven menos las tarjetas SD por lo que actualmente el almacenamiento externo tambien se encuentra dentro de la memoria flash interna (Por ejemplo almacenar fotografias). Asi que basicamente ahora solo es un directorio mas.

Este directorio contiene directorios privados de las aplicaciones, pero tambien almacenamiento que se puede compartir (Por ejemplo fotos que toma la camara).

Este directorio esta montado sobre:

```java
/sdcard
```

Dentro de ese punto de montaje, se encuentran carpetas como Download, DCIM,  Music, etc…

/sdcard en realidad es un link hacia /storage/emulated/0

Dentro de Storage existen dos directorios “emulated” y “self”. Dentro de emulated se tiene el directorio “0”, quedando /emulated/0/, siendo 0 el usuario.

De igual forma para self, se tiene el directory primary, el cual es un symlink hacia /mnt/user/0/primary

Es normal que existan muchos symlinks debido a compatibilidad de apps, ya que esto fue cambiando version a version. Por lo que si un exploit no funciona en versiones nuevas, conviene probar en versiones antiguas.

### Scoped Storage

Desde Android 10 y en especial Android 11. El scoped storage basicamente transforma el external storage en un almacenamiento bien protegido, algo muy similar al “internal storage”.

Dentro de /sdcard existen dos directorios:

/obb: Opaque Binary Blob y este basicamente se encarga de almacenar ficheros de tamaño muy grande, como lo son grandes texturas de videojuegos.

/data: Este directorio se encarga de almacenar distintos directorios privados de las aplicaciones dentro del almacenamiento externo. (Y el acceso a estos directorios se basa en el Scoped Storage)

En versiones antiguas de Android, cualquier aplicativo con acceso a la tarjeta SD podía acceder a absolutamente todos los datos dentro de la SD (Incluso los de otras aplicaciones).

El Scope Storage se encarga de evitar esto, permitiendo que unicamente una app pueda acceder a sus propios directorios.

Aunque las aplicaciones pueden seguir utilizando el permiso MANAGE_EXTERNAL_STORAGE en Android 13+ para solicitar acceso a todos los archivos del almacenamiento externo, además se debe dirigir al usuario a una página de configuración especial en la que debe habilitar “Permitir acceso para gestionar todos los archivos”. (Este permiso es la unica excepcion en la cual una app podria acceder a todos los datos de la SDcard)

## Keychain 

Es un tipo de almacenamiento que guarda llaves criptograficas (claves privadas por ejemplo).

Este suele estar protegido mediante hardware utilizando chips de seguridad o partes del procesador

Es importante mencionar que no almacena contraseñas, unicamente llaves