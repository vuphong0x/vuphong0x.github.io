# App Startup Performance

Users form their first impression of an app during startup. A slow app startup leads to abandonment and uninstalls. Google measures this strictly in Vitals (Cold start < 5s, Warm start < 2s, Hot start < 1.5s).

## Types of Startup

1. **Cold Start:** App is completely dead. OS must create the process, instantiate the `Application` class, load themes, and launch the `MainActivity`.
2. **Warm Start:** The process is alive, but the Activity must be completely recreated (e.g., user hits Back, then re-launches the app).
3. **Hot Start:** App process is alive AND Activity is in memory; it just needs to be brought to the foreground.

## Common Startup Bottlenecks

### 1. Massive `Application.onCreate()`
Developers often initialize dozens of third-party SDKs (Crashlytics, Analytics, Push Notifications, Database initializations) directly in `Application.onCreate()`. This blocks the main thread.
- **Fix:** Defer non-critical initializations. Run them asynchronously using Coroutines, or delay them until the user actually reaches the screen that requires them.

### 2. View Inflation
Inflating deeply nested, complex XML layouts heavily impacts Activity creation time.
- **Fix:** Flatten layouts. Use Compose, which compiles differently, or use `ViewStub` to load hidden views lazily.

### 3. Splash Screens
Avoid implementing fake Splash Screens that pause the UI (e.g., waiting 3 seconds for an API call).
- **Fix:** Use the official `SplashScreen` API. It uses the app theme window background (loaded instantly by the OS *before* the app process starts) to show the logo.

## AndroidX App Startup Library

Provides a straightforward, performant way to initialize components at application startup via a single `ContentProvider` instead of multiple `ContentProviders`.
- Every third-party SDK added to the manifest with its own `<provider>` increases startup overhead individually.
- App Startup coalesces these into a single initializer engine.

```kotlin
// Example Initializer
class WorkManagerInitializer : Initializer<WorkManager> {
    override fun create(context: Context): WorkManager {
        WorkManager.initialize(context, Configuration.Builder().build())
        return WorkManager.getInstance(context)
    }
    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
```

## Baseline Profiles

Historically, apps were compiled Just-In-Time (JIT) meaning first runs were slow while the OS figured out what methods to optimize (AOT compile).
- **Baseline Profiles** allow developers to ship a predefined profile containing the critical paths the app follows on startup.
- The OS reads this profile upon installation via Google Play and AOT compiles the startup methods *before the user even opens the app*.
- This grants up to 30%-40% faster startup speeds on Android 7.0+. Use the `Macrobenchmark` library to generate them.

## Interview Questions

**Q: Why shouldn't you do networking or database checks straight in the Activity's `onCreate()` synchronously?**
*Answer:* The OS won't render the first visual frame (meaning the app remains a blank white screen window) until `onCreate()`, `onStart()`, and `onResume()` complete their execution and yield back to the Choreographer. Synchronous heavy lifting will result in massive UI freezing.

**Q: Explain how Baseline Profiles differ from R8 Proguard rules.**
*Answer:* R8/Proguard rules dictate code shrinking and obfuscation. They tell the compiler *what* to keep in the final APK. Baseline Profiles dictate *how* the Android Runtime on the user's phone should translate the bytecode into Machine Code ahead of time.
