# Profiling and Benchmarking

Blindly guessing what is slowing down your app is dangerous. You must measure objectively.

## Android Studio Profiler

The central built-in suite for debugging performance.

### 1. CPU Profiler
- Tracks method execution. If your app stutters when scrolling, record a trace.
- **Flame Charts:** Show the exact hierarchy of method calls and width represents time consumed by that method.
- Use this to identify JSON parsing running heavily on the Main thread.

### 2. Memory Profiler
- Tracks memory allocations over time.
- Allows capturing a **Heap Dump**.
- Captures Allocation Tracking (identifies code loops that allocate hundreds of temporary String objects repetitively—GC Churn).

### 3. Network Profiler
- Validates that image loading libraries are actually caching (ensure subsequent identical requests don't show network spikes).

## UI Jank and Frames

A device screen refreshes continuously (60Hz = 16.6ms per frame; 120Hz = 8.3ms per frame).
If your Main thread takes 30ms to parse data or layout a complex View, the screen skips rendering a frame. This is **Jank**.

### Detecting Jank
- **StrictMode:** Enable StrictMode in debug builds. It intentionally crashes or flashes the screen if you accidentally do Network or Disk I/O on the Main thread.
- **Systrace / Perfetto:** Highly advanced system-wide profiling tools tracing exactly how your app interacts with OS surface flinger hardware layers.

## Jetpack Macrobenchmark
Allows you to write JUnit-style tests that evaluate app performance (Startup, Scrolling Jank) on physical devices (not emulators!).

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun startup() = benchmarkRule.measureRepeated(
        packageName = "com.myapp.pkg",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait()
    }
}
```

## Compose Recomposition Performance

Compose layout boundaries are important. 
- Use the **Layout Inspector** to check Recomposition Counts.
- If a Composable recomposes 500 times during an animation, but its internal components haven't actually changed their text, you have passed an unstable type, resulting in useless CPU churn.
- **Fix:** Annotate data classes with `@Stable` and prefer standard primitive arrays or Kotlin Immutable collections over standard `List` interfaces.

## Interview Questions

**Q: What is `StrictMode` and how do you use it?**
*Answer:* `StrictMode` is a developer tool that detects things you might be doing by accident on the main thread (Disk Reads/Writes, Network operations, slow SQLite access) and brings them to your attention via Logcat, crashing the app, or flashing a red rectangle on the screen. It is initiated inside `Application.onCreate`.

**Q: In Profiling, what is the difference between Wall Clock time and Thread time?**
*Answer:* Thread Time is the exact CPU time the thread actively spent executing that specific method. Wall Clock time is the real-world time that passed between the method starting and finishing. If Wall Clock is 10 seconds, but Thread Time is 0.5s, it indicates that your thread was parked or suspended (perhaps waiting on an I/O read or Coroutine suspend) for 9.5 seconds.
