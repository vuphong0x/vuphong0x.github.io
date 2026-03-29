# Default DataStore

Jetpack DataStore is a data storage solution that allows you to store key-value pairs or typed objects with protocol buffers. It is the modern, robust replacement for `SharedPreferences`.

## Why Replace SharedPreferences?
`SharedPreferences` had several critical flaws:
- Synchronous reads block the UI thread (it reads the XML file entirely into memory at startup).
- `apply()` runs synchronously on `fsync()`, which can cause ANRs during Activity pauses.
- No type-safety (you can cast an Int to a String and crash).
- No reliable way to signal errors or detect data changes flawlessly.

## Types of DataStore

### 1. Preferences DataStore
Stores and accesses data using keys. It does not require a predefined schema or object.
- Replaces standard `SharedPreferences`.
- Type-safe keys.

```kotlin
// Creating DataStore
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

// Keys
val USER_AGE_KEY = intPreferencesKey("user_age")

// Writing
suspend fun saveAge(age: Int) {
    context.dataStore.edit { settings ->
        settings[USER_AGE_KEY] = age
    }
}

// Reading (Flow)
val userAgeFlow: Flow<Int> = context.dataStore.data
    .map { preferences ->
        preferences[USER_AGE_KEY] ?: 0
    }
```

### 2. Proto DataStore
Stores data as instances of a custom data type. Requires Protocol Buffers (Protobuf).
- Replaces highly complex `SharedPreferences` usage where JSON strings were saved.
- Requires defining a schema (`.proto` file) and generating Kotlin classes.
- Provides robust, absolute type safety out of the box.

## Best Practices

1. **Dependency Injection:** Don't initialize DataStore multiple times. Create it once as a Singleton via Hilt or Koin, and inject the `DataStore` interface into your Repositories.
2. **Handle IOExceptions:** Reading from disk can fail. Always wrap the `.data` stream in a `catch` block.
   ```kotlin
   context.dataStore.data.catch { exception ->
       if (exception is IOException) { emit(emptyPreferences()) } 
       else { throw exception }
   }
   ```
3. **Synchronous Reads:** Avoid them. DataStore forces you to use `Flow`. If you absolutely must read a value synchronously from a background thread worker, use `runBlocking { dataStore.data.first() }`.

## Interview Questions

**Q: Which DataStore should I use for a complex User session object?**
*Answer:* **Proto DataStore**. It ensures type-safety and removes the overhead of manually serializing and deserializing JSON strings like we did in SharedPreferences.

**Q: Is DataStore safe to call from the UI (Main) thread?**
*Answer:* Yes! DataStore uses Coroutines and Flows entirely under the hood safely shifting disk I/O operations to `Dispatchers.IO`. Unlike SharedPreferences, it does not block the Main thread when writing or reading.
