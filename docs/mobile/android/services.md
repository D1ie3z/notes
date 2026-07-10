---
title: Services
sidebar_position: 1
---

## ¿Qué es?
Un service es un componente que puede llevar a cabo operaciones que tomen mucho tiempo en segundo plano. No da una interfaz de usuario.

Un servicio puede continuar corriendo incluso si el usuario se va a otra aplicación. Adicionalmente, un componente puede bindearse a un servicio para interactuar con el, e incluso llevar a cabo comunicación entre procesos (IPC (Interprocess communication)).

Un ejemplo de esto puede ser cuando reproducimos musica, esto se hace mediante un service.

Estos se pueden identificar facilmente en el AndroidManifest.xml:

```java
<service android:name="io.example.services.MyService"
 android:enabled="true" android:exported="true">
    <intent-filter>
        <action android:name="io.example.START"/>
    </intent-filter>
</service>
```

## Iniciar un servicio

Iniciar un servicio es bastante facil, ya que únicamente se requiere crear un intent e iniciarlo con startService(intent), al ejecutarlo, este llevara a cabo la ejecución de onStartCommand():

```java
Intent intent = new Intent("io.example.START");
intent.setClassName("io.hextree.example",
                    "io.hextree.example.services.MyService");
startService(intent);
```

A partir de Android 11 (API 30), es necesario declarar la aplicación con la que interactuaremos para iniciar el servicio, esto se puede hacer agregando la tag `<queries>` al AndroidManifest.xml (Se coloca arriba de la primera tag application):

```java
<queries>
<package android:name="com.example.store" />
<package android:name="com.example.services" />
</queries>
```

## Funciones que se pueden sobreescribir en los services

- onCreate(): Se ejecuta una sola vez cuando se crea el servicio.
- onStartCommand(): Se ejecuta cada vez que se llama startService() con un intent.
- onBind(): Se ejecuta al bindear un servicio

## BINDABLE SERVICES:

Cuando un servicio es creado por otro componente y llama a bindService(), el cliente se puede comunicar con el servicio a traves de una interfaz IBinder (IBinder es un kernel driver). Esto quiere decir que se puede tener una comunicación bidireccional entre ambas partes.

## Messenger Handler (Bindable)

Es posible comunicarse con un Bindable Service de muchas maneras, una de ellas es utilizando el patron Messenger, el cual utiliza la funcion handleMessage, la cual es llamada cada que un cliente envia un Message a el servicio

El message puede tener (opcionalmente) un objecto parcelable en msg.obj, un bundle en msg.setData/msg.getData

Este patron se puede reconocer fácilmente mirando a onBind():

```java
public class MyMessageService extends Service {
    public static final int MSG_SUCCESS = 42;
    final Messenger messenger = new Messenger(new IncomingHandler(Looper.getMainLooper()));

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return this.messenger.getBinder();
    }

    class IncomingHandler extends Handler {

        IncomingHandler(Looper looper) {
            super(looper);
        }

        @Override // android.os.Handler
        public void handleMessage(Message message) {
            if (message.what == 42) {
                // ...
            } else {
                super.handleMessage(message);
            }
        }
    }
}
```

Para enviar un message es necesario crear un ServiceConnection el cual implementara dos metodos onServiceConnected() y onServiceDisconnected() (fuera del onCreate()), asi como tambien un Messenger y un metodo IncomingHandler para manejar los mensajes entrantes:

```java
public class ServicesHandlerBueno extends AppCompatActivity {

    private class IncomingHandler extends Handler {
        IncomingHandler() { super(Looper.getMainLooper());}

        @Override
        public void handleMessage(Message msg){
            TextView textoservices = findViewById(R.id.textoservices);
            String mensaje = msg.getData().getString("echo");
            textoservices.setText(mensaje);
        }
    }

    private final Messenger clientMessenger = new Messenger(new IncomingHandler());

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName componentName, IBinder service) {
            Messenger serviceMessenger = new Messenger(service);
            Message msg = Message.obtain(null,42);
            msg.replyTo = clientMessenger;
            try {
                serviceMessenger.send(msg); //enviar mensaje
            } catch (RemoteException e){
                throw new RuntimeException(e);
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {

        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_services_handler_bueno);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        Button boton = findViewById(R.id.botonservices);

        boton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent = new Intent("io.hextree.services.UNLOCK1");
                intent.setClassName("io.hextree.attacksurface",
                        "io.hextree.attacksurface.services.Flag26Service");
                bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
            }
        });

    }
}
```

Otro ejemplo de comunicacion bidireccional mediante messages:

```java
package com.example.hexcurso;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class ServicesHandlerBueno extends AppCompatActivity {

    public String password = "a";
    private class IncomingHandler extends Handler {
        IncomingHandler() { super(Looper.getMainLooper());}

        @Override
        public void handleMessage(Message msg){
            TextView textoservices = findViewById(R.id.textoservices);
            int i = msg.what;
            if (msg.getData().getString("password",null)!=null){
                String mensaje = msg.getData().getString("password",null);
                textoservices.setText(mensaje);
                password = mensaje;
            }

            Log.i("teste","Received msg.what=" + msg.what + " data=" + msg.getData() + " obj=" + msg.obj);
        }

    }

    private final Messenger clientMessenger = new Messenger(new IncomingHandler());

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName componentName, IBinder service) {
            Messenger serviceMessenger = new Messenger(service);
            Message msg = Message.obtain(null,2);
            Bundle bundle = new Bundle();
            bundle.putString("password","asdasdasd");
            msg.setData(bundle);
            msg.obj = bundle;
            msg.replyTo = clientMessenger;
            try {
                serviceMessenger.send(msg); //enviar mensaje
            } catch (RemoteException e){
                throw new RuntimeException(e);
            }

            msg = Message.obtain(null,1);
            Bundle bundle2 = new Bundle();
            bundle2.putString("echo","give flag");
            msg.setData(bundle2);
            msg.obj = bundle2;
            msg.replyTo = clientMessenger;
            try {
                serviceMessenger.send(msg); //enviar mensaje
            } catch (RemoteException e){
                throw new RuntimeException(e);
            }

            new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override
                public void run() {
                    Message msg = Message.obtain(null,3);
                    Bundle bundle3 = new Bundle();
                    bundle3.putString("password",password);
                    Log.i("test2",password);
                    msg.setData(bundle3);
                    msg.obj = bundle3;
                    msg.replyTo = clientMessenger;
                    try {
                        serviceMessenger.send(msg); //enviar mensaje
                    } catch (RemoteException e){
                        throw new RuntimeException(e);
                    }
                }
            }, 1000); // 500 ms

        }

        @Override
        public void onServiceDisconnected(ComponentName name) {

        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_services_handler_bueno);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        Button boton = findViewById(R.id.botonservices);

        boton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Intent intent = new Intent("io.hextree.services.UNLOCK1");
                intent.setClassName("io.hextree.attacksurface",
                        "io.hextree.attacksurface.services.Flag27Service");
                bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
            }
        });
    }
}
```

## AIDL Service (Bindable)

AIDL (Android Interface Definition Language), estos se pueden identificar al visualizar el codigo JAVA del servicio y ver .Stub(). Cuando se utiliza AIDL, el codigo estara dentro de un fichero .aidl, y utiliza un codigo muy similar a JAVA, dentro de este fichero AIDL existira una interface.

Algo importante es que durante la compilación el SDK de Android creara una interface class de JAVA utilizando el codigo del fichero .aidl

Cuando tenemos un servicio AIDL, lo mejor es intentar reversear el codigo .aidl original. Para esto es posible mirar dentro del codigo generado para la interface por el servicio:

1. Primero mirar en la variable  `DESCRIPTOR` , ya que esta contendra el path original del package y el nombre del fichero .aidl
2. Los metodos AIDL se pueden deribar de los metodos de la interface con el  `throws RemoteException`
3. El orden original de los metodos se muestra por los  `TRANSACTION_` integers

Por ejemplo, en este codigo:

```java
public interface IFlag29Interface extends IInterface {
    public static final String DESCRIPTOR = "io.hextree.attacksurface.services.IFlag29Interface";

    /* loaded from: classes.dex */
    public static class Default implements IFlag29Interface {
        @Override // android.os.IInterface
        public IBinder asBinder() {
            return null;
        }

        @Override // io.hextree.attacksurface.services.IFlag29Interface
        public void authenticate(String str) throws RemoteException {
        }

        @Override // io.hextree.attacksurface.services.IFlag29Interface
        public String init() throws RemoteException {
            return null;
        }

        @Override // io.hextree.attacksurface.services.IFlag29Interface
        public void success() throws RemoteException {
        }
    }

    void authenticate(String str) throws RemoteException;

    String init() throws RemoteException;

    void success() throws RemoteException;

    /* loaded from: classes.dex */
    public static abstract class Stub extends Binder implements IFlag29Interface {
        static final int TRANSACTION_authenticate = 2;
        static final int TRANSACTION_init = 1;
        static final int TRANSACTION_success = 3;
...
```

El código original sería el siguiente:

```java
package io.hextree.attacksurface.services;

interface IFlag29Interface {
	String init();
	void authenticate(String str);
	void success();
}
```

Ya que tenemos la logica del codigo, solo faltaria determinar que hacen las funciones, esto se puede determinar facilmente observando la clase Stub() que se genera en el codigo del servicio (El servicio no el .aidl), regularmente jadx le colca un @override en los comentarios a las funciones exportadas.

Para llevar a cabo la creacion de una app que se comunique mediante aidl a una app vulnerable es necesario colocar la flag aidl a true en el fichero build.gradle.kts (Module :app)

```java
    buildFeatures {
        viewBinding = true
        aidl = true
    }
```

Posterior a eso, ya es posible crear la aidl file: Clic derecho > new > aidl > aidl file:

En el nombre es necesario colocar el nombre de la interface que obtuvimos del reversing, por ejemplo IFlag29Interface, posteriormente colocaremos dentro del aidl generado, el codigo que habiamos obtenido previamente del proceso de reversing

```java
interface IFlag29Interface {
	String init();
	void authenticate(String str);
	void success();
}
```

De igual forma, es necesario que el package coincida, por lo que se necesita crear un nuevo package (Click derecho dentro de la carpeta aidl>new package) y en el nombre colocar el nombre completo que se habia obtenido previamente (io.hextree.attacksurface.services). Con la carpeta creada, procederemos a dar click derecho en nuestro aidl > refactor >move. Y lo moveremos a el nuevo package (no olvidar cambiar el package en el codigo aidl tambien):

```java
package io.hextree.attacksurface.services;

interface IFlag29Interface {
	String init();
	void authenticate(String str);
	void success();
}
```

Finalmente solo quedaria llamarlo desde nuestra activity(Es necesario compilar primero con el aidl para que se genere el java y podamos llamarlo desde nuestro codigo):

```java
                //TextView textohijacker = findViewById(R.id.textView213);
                Intent intent = new Intent();
                intent.setClassName("io.hextree.attacksurface",
                        "io.hextree.attacksurface.services.Flag29Service");
                ServiceConnection mConnection2 = new ServiceConnection() {
                    @Override
                    public void onServiceConnected(ComponentName name, IBinder service) {
                        IFlag29Interface remoteService = IFlag29Interface.Stub.asInterface(service);
                        try {
                            String auth;
                            auth = remoteService.init();
                            remoteService.authenticate(auth);
                            remoteService.success();
                        } catch (RemoteException e) {
                            throw new RuntimeException(e);
                        }
                    }

                    @Override
                    public void onServiceDisconnected(ComponentName componentName) {

                    }
                };
                bindService(intent,mConnection2, Context.BIND_AUTO_CREATE);

```

De igual forma, hay un segundo metodo de cargar los aidl, si no queremos crear un fichero aidl en nuestra app. Esto se hace cargando la clase directamente desde la app objetivo, e invocando las funciones. A continuacion se muestra un ejemplo para realizar esto:

```java
//TextView textohijacker = findViewById(R.id.textView213);
                Intent intent = new Intent();
                intent.setClassName("io.hextree.attacksurface",
                        "io.hextree.attacksurface.services.Flag28Service");
                ServiceConnection mConnection = new ServiceConnection() {
                    @Override
                    public void onServiceConnected(ComponentName name, IBinder service) {
                        // Load the class dynamically
                        ClassLoader classLoader = null;
                        try {
                            classLoader = launchHextreetest.this.createPackageContext("io.hextree.attacksurface", Context.CONTEXT_INCLUDE_CODE | Context.CONTEXT_IGNORE_SECURITY).getClassLoader();
                        } catch (PackageManager.NameNotFoundException e) {
                            throw new RuntimeException(e);
                        }
                        Class<?> iRemoteServiceClass = null;
                        try {
                            iRemoteServiceClass = classLoader.loadClass("io.hextree.attacksurface.services.IFlag28Interface");
                        } catch (ClassNotFoundException e) {
                            throw new RuntimeException(e);
                        }

                        Class<?> stubClass = null;
                        for (Class<?> innerClass : iRemoteServiceClass.getDeclaredClasses()) {
                            if (innerClass.getSimpleName().equals("Stub")) {
                                stubClass = innerClass;
                                break;
                            }
                        }

                        // Get the asInterface method
                        Method asInterfaceMethod = null;
                        try {
                            asInterfaceMethod = stubClass.getDeclaredMethod("asInterface", IBinder.class);
                        } catch (NoSuchMethodException e) {
                            throw new RuntimeException(e);
                        }

                        // Invoke the asInterface method to get the instance of IRemoteService
                        Object iRemoteService = null;
                        try {
                            iRemoteService = asInterfaceMethod.invoke(null, service);
                        } catch (IllegalAccessException e) {
                            throw new RuntimeException(e);
                        } catch (InvocationTargetException e) {
                            throw new RuntimeException(e);
                        }

                        // Call the init method and get the returned string
                        Method openFlagMethod = null;
                        try {
                            openFlagMethod = iRemoteServiceClass.getDeclaredMethod("openFlag");
                        } catch (NoSuchMethodException e) {
                            throw new RuntimeException(e);
                        }
                        try {
                            boolean initResult = (boolean) openFlagMethod.invoke(iRemoteService);
                        } catch (IllegalAccessException e) {
                            throw new RuntimeException(e);
                        } catch (InvocationTargetException e) {
                            throw new RuntimeException(e);
                        }
                    }

                    @Override
                    public void onServiceDisconnected(ComponentName componentName) {

                    }
                };
                bindService(intent,mConnection, Context.BIND_AUTO_CREATE);
```

## Non-Bindable Services

Los non-bindable services, son servicios que pueden iniciarse y ejecutar codigo en segundo plano. Similar a los broadcast receivers. Sin embargo los servicios estan diseñados para ejecutar codigo por un tiempo mas elevado. Estos se pueden observar en el AndroidManifest.xml de la siguiente forma:

```xml
<service android:name="com.example.Service" android:exported="true"/>
```

Cuando un servicio retorna un error o directamente nada cuando se llama al metodo onBind(), significa que es un servicio non-bindable (No podemos bindearnos a este servicio, solo iniciarlo):

```java
@Override // android.app.Service
public IBinder onBind(Intent intent) {
    throw new UnsupportedOperationException("Not yet implemented");
}
```

De igual forma existe un segundo caso, y este es cuando el servicio retorna un objeto LocalBinder() en la funcion onBind. Esto significa que el servicio solo puede ser bindeado desde dentro de la misma app. (Desde la perspectiva de un atacante, no podemos bindearnos a este servicio)

Este nombre es solo una convencion, pero puede llamarse de otra forma, lo realmente importante es que hace la funcion (Reotrnar la misma instancia del servicio mediante nombreservicio.this).

```java
Clase>RunCommandService

private final IBinder mBinder = new LocalBinder();

class LocalBinder extends Binder {
	public final RunCommandService service;
	
	LocalBinder(){
		this.service = RuncommandService.this
	}
}

public IBinder onBind(intent intent) {
	return this.mBinder;
}
```

## Job Service

Un servicio muy comun es el Job Scheduler de Android. Sin embargo, a pesar de que esta exportado, se requiere el permiso  `android.permission.BIND_JOB_SERVICE` , dicho permiso es unicamente accesible por el sistema Android:

```xml
<service android:name=".MyJobService"
android:permission="android.permission.BIND_JOB_SERVICE"
android:exported="true"></service>
```