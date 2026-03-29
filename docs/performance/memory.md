# Memory Management

Android devices operate in heavily constrained memory environments. Poor memory management leads to high OutOfMemoryError (OOM) crashes, sluggish app performance, and the app being killed aggressively when in the background.

## Understanding Garbage Collection (GC)
The Android Runtime (ART) features an advanced Garbage Collector. When an object is no longer referenced by a "GC Root" (like an active thread, local variable, or static variable), it becomes eligible for collection.
- **Minor GC:** Frees small objects. Happens incredibly fast, concurrently.
- **Major GC:** Frees larger objects or old generation spaces. If an app allocates memory continuously, heavy GC pauses will drop UI frames ("GC Churn").

## Causes of Memory Leaks

A memory leak occurs when an object is no longer needed but is still referenced by a GC Root, preventing garbage collection.

### 1. Context Leaks
Passing an `Activity` context to a long-lived object (like a Singleton, ViewModel, or Coroutine).
- **Fix:** If a Singleton or Repository needs a context for Room or SharedPreferences, *only* pass the Application Context (`context.applicationContext`).

### 2. Static Views
Never hold `View`, `Activity`, or `Fragment` references in `object` singletons or `companion objects`.

### 3. Inner Classes and Callbacks
Anonymous inner classes (like traditional Java `Runnable` or `Retrofit Callback`) hold an implicit reference to their outer class.
- **Fix:** Use static inner classes, or modern Kotlin standard Coroutines, which cancel securely using CoroutineScope.

### 4. Unregistered Listeners
If you register a listener (e.g., `LocationManager`, `SensorManager`, `BroadcastReceiver`) in `onCreate()` or `onStart()`, you *must* unregister it in the symmetrical teardown method (`onDestroy()` or `onStop()`).

## Detecting Memory Leaks

### LeakCanary
The gold standard tool developed by Square. Add it as a `debugImplementation`. It automatically tracks Activity/Fragment destruction. If an Activity isn't GC'd after standard teardown time, LeakCanary forcefully dumps the heap and extracts the shortest reference path causing the leak.

### Android Studio Profiler
Capturing a Heap Dump (.hprof) allows deep visual inspection of memory. Look for Activity instances that exist in memory but have already passed their `onDestroy()` lifecycle.

## Bitmaps
Bitmaps are enormous. A single 12MP photo can consume 48MB of raw RAM if loaded uncompressed.
- **Glide or Coil:** Always use an image loading library. They automatically downscale images to match the exact physical size of your ImageView and cache heavily.

## Interview Questions

**Q: Explain why `LeakCanary` only runs in Debug builds.**
*Answer:* `LeakCanary` intentionally induces Garbage Collection and performs Heap Dumps. A Heap Dump literally pauses the entire application thread for several seconds while it copies active memory to disk. This ruins the user experience and represents a massive security flaw, so it must rigorously be kept out of `release` builds.

**Q: How does a closure handle external references in a Coroutine?**
*Answer:* A lambda sent into a coroutine captures its surrounding environment. If you reference `this` inside a View or Activity scope, the Coroutine holds the Activity alive. This is why you must explicitly tie coroutines to `viewModelScope` or `lifecycleScope` so they cancel automatically when the host dies, breaking the reference chain.
