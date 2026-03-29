# General Android Interview Questions

These questions test the baseline foundational knowledge expected of intermediate to senior Android developers.

### 1. Context and Memory

**Q: What is a `Context`? What is the difference between Application Context and Activity Context?**
- **Answer:** `Context` provides access to application-specific resources and classes, as well as up-calls for application-level operations (launching activities, broadcasting, receiving intents).
- You use **Activity Context** when dealing with UI operations (e.g., creating a View, inflating layouts, showing Dialogs) because it contains the theme and style of the current screen.
- You use **Application Context** when a singleton or background service needs a context (e.g., initiating a Room database instance), because it is tied to the lifecycle of the entire app process, thus preventing memory leaks.

**Q: How do you identify and fix a Memory Leak in Android?**
- **Answer:** A memory leak occurs when the Garbage Collector cannot free an object holding onto memory because there is an active reference pointing to it (often an Activity or View).
- **Tools:** Use LeakCanary during development. Use Android Studio Memory Profiler to take a Heap Dump and trace the offending GC Root.
- **Fix:** Clear references in `onDestroy()` using nullification. Avoid placing `Context` in companion objects. Make sure inner classes containing callbacks are static, or utilize coroutine scopes correctly (`viewModelScope`) so long-running async tasks are automatically cancelled before the host Activity dies.

### 2. Lifecycles and state

**Q: If an Activity is destroyed and recreated on screen rotation, how can you save UI state?**
- **Answer:**
  1. `ViewModel`: Perfect for retaining heavy, complex domain objects during simple configuration changes.
  2. `SavedStateHandle`: Used inside the ViewModel to serialize simple parameters (String, Int, IDs) into an OS bundle. It survives both configuration changes AND System-Initiated Process Death (when the OS kills apps in the background to save battery/RAM).
  3. `onSaveInstanceState()`: Legacy method if not using ViewModel.

### 3. Concurrency and Background Tasks

**Q: Explain the difference between `WorkManager`, `Services`, and `Coroutines`.**
- **Answer:**
  - **Coroutines:** Best for executing immediate asynchronous work tied to a screen or user session perfectly synchronized with lifecycles. If the app kills the screen/process, the background work is terminated.
  - **Foreground Service:** Best for tasks where the user is actively aware the app is doing work in the background (playing music, tracking a workout via GPS) and expects it not to be killed aggressively. Must show an ongoing notification.
  - **WorkManager:** Best for deferrable, guaranteed background work. E.g., uploading analytics logs or syncing the database offline. WorkManager guarantees execution regardless of app reboots or sudden kills, while also respecting battery conditions (e.g., "only run on unmetered Wi-Fi while charging").

### 4. Application Architecture

**Q: Explain how clean Unidirectional Data Flow (UDF) works in Compose and MVVM.**
- **Answer:** UDF requires State to flow strictly downwards, and Events to flow strictly upwards.
  - The UI Screen (Composable/Fragment) triggers an intent/event: e.g., "Login Button Clicked".
  - The UI passes the event *up* to the ViewModel.
  - The ViewModel processes the login via the repository on a background thread.
  - The ViewModel mutates the single source of truth (`StateFlow<UiState>`).
  - The UI Screen observes this StateFlow and instantly reacts to it *downward*, re-rendering itself to show the "Loading spinner" or "Success screen".

### 5. Advanced / Misc

**Q: What is a custom `View` and how do you create one?**
- **Answer:** When standard widgets (`TextView`, `Button`) don’t fit your needs, you can extend the `View` class. You override `onMeasure()` to dictate exactly what width and height the view demands, and `onDraw(canvas)` to manually paint bitmaps, paths, circles, and text using `Paint` objects onto the screen frame.
