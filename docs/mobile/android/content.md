---
title: Content / File Provider
sidebar_position: 1
---

## ¿Qué es?
Los Content Providers se identifican y accesan con el siguiente URI: `content://` . Usando el metodo `getContentResolver().query()`) se puede hacer una query a la URI. Los datos que se retornan es la estructura de la tabla que puede ser explorada usando el objeto `Cursor` :

```java
Cursor cursor = getContentResolver().query(ContactsContract.RawContacts.CONTENT_URI,
                null, null,
                null, null);
```

Dumpear un content provider:

```java
public void dump(Uri uri) {
    Cursor cursor = getContentResolver().query(uri, null, null, null, null);
    if (cursor.moveToFirst()) {
        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < cursor.getColumnCount(); i++) {
                if (sb.length() > 0) {
                    sb.append(", ");
                }
                sb.append(cursor.getColumnName(i) + " = " + cursor.getString(i));
            }
            Log.d("evil", sb.toString());
        } while (cursor.moveToNext());
    }
}
```

Los content providers de igual forma estan implementados internamente con un Binder.