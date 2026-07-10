---
title: frida
sidebar_position: 1
---

## ¿Qué es?
Al analizar el apk, probablemente querramos modificar algo del aplicativo durante el runtime o hacer que otros flujos se ejecuten. Para esto podemos usar FRIDA


Frida se encuentra dentro de pip, por lo que podemos instalarla de la siguiente forma:

```bash
pip3 install frida-tools
```

Para ver que version de frida se tiene, basta con ejecutar

```bash
frida --version
```

De igual forma objection se puede instalar con pip

```bash
pip3 install objection
```

# Correr FRIDA

### Objection

Hay multiples formas de correr frida en el dispositivo, una de ellas es inyectar frida directamente en el apk. Esto lo podemos hacer con objection:

```c
objection patchapk -s apk_name.apk
```

Objection extraerá, parcheará, volverá a empaquetar, alineará y firmará la aplicación, por lo que es una forma muy rápida y sencilla de ejecutar Frida.

Algo importante es que la aplicación esperará a que Frida se conecte a ella cuando se inicie, por lo que para iniciar la aplicación se tiene que ejecutar:

```c
frida -U FridaTarget
```

(La flag -U indica que nos conectaremos por USB)

### Patching Manual

Si objection falla, es posible patchear el APK manualmente:

Primeramente, decompilamos el apk con apktool

```c
apktool d FridaTarget.apk -o frida_target
```

Posterior a ello, se tiene que buscar la main activity:

```xml
<activity android:exported="true" android:label="@string/app_name" android:name="io.hextree.fridatarget.MainActivity" android:theme="@style/Theme.FridaTarget.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
```

Con el nombre de la clase, se debe buscar en las clases smali.

De igual forma se requiere el frida-gadget (https://github.com/frida/frida/releases). Hay que verificar la arquitectura del dispositivo donde se instalara la app, en este caso arm64.

Hay que colocar dicho frida-gadget.so dentro de lib/arm64-v8a.

Posterior a ello, se requiere editar el AndroidManifest.xml editando extractNativeLibs en true. Esto hara que el android package manager descomprima las librerias nativas en el caso de que se encuentren comprimidas. Si no se activa, fallara la app.

Finalmente lo que se hace es llamar a la libreria nativa cuando se inicia la app.  Esto se hace facilmente copiando las siguientes lineas y pegandolas despues de onCreate dentro del apk:

```java
const-string v0, "frida-gadget"

invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V
```

Ejemplo de patching:

```java
.method protected onCreate(Landroid/os/Bundle;)V
    .locals 9
    .param p1, "savedInstanceState"    # Landroid/os/Bundle;

    .line 26
    invoke-super {p0, p1}, Landroidx/appcompat/app/AppCompatActivity;->onCreate(Landroid/os/Bundle;)V

    # Injected Gadget here
    const-string v0, "frida-gadget"

    invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V

    .line 28
    invoke-virtual {p0}, Lio/hextree/fridatarget/MainActivity;->getLayoutInflater()Landroid/view/LayoutInflater;

    move-result-object v0
...
```

Ya que se haya llevado a cabo el patching, se debe volver a construir el apk:

```bash
apktool b frida_target -o FridaTargetPatched.apk
```

Posteriormente llevar a cabo la alineación:

```bash
zipalign -p 4 FridaTargetPatched.apk FridaTargetAligned.apk
```

Y finalmente llevar a cabo el firmado con la keystore

```bash
keytool -genkey -v -keystore HEXTREE.keystore -alias HEXTREE -keyalg RSA -keysize 2048 -validity 10000

apksigner sign -v --ks ./HEXTREE.keystore --ks-key-alias HEXTREE --v2-signing-enabled true FridaTargetAligned.apk
```