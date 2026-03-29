# Analytics and Crashlytics

You cannot fix bugs you don't know about, and you cannot improve features without knowing if users are actually clicking them. Analytics and crash reporters are mandatory for production Android apps.

## 1. Firebase Crashlytics

Crashlytics is the absolute industry standard for tracking app crashes.

### Non-Fatal Exceptions
Crashlytics automatically logs actual crashes (when the app suddenly closes via an unhandled Exception). However, if your app catches an exception via a try/catch block, you *still* want to know about it.
- **Best Practice:** Log handled exceptions explicitly.
```kotlin
try {
    val decoded = gson.fromJson(jsonString, User::class.java)
} catch (e: Exception) {
    Firebase.crashlytics.recordException(e) // Logs non-fatals silently
}
```

### Custom Keys and Logs
If a user hits a bizarre crash inside a sprawling `ViewModel`, the stack trace might not be enough. You need to know the state of the ViewModel.
```kotlin
Firebase.crashlytics.setCustomKey("last_screen_loaded", "CheckoutFragment")
Firebase.crashlytics.setCustomKey("cart_item_count", 5)

// Leaves breadcrumbs that appear leading up to the crash in the dashboard
Firebase.crashlytics.log("User tapped the complex Pay button.")
```

## 2. Event Analytics (Firebase / Mixpanel / Amplitude)

Analytics allow product managers and developers to gather data on how the app is used.

### The Wrapper Pattern
**NEVER** directly call Firebase Analytics deep within your UI, ViewModels, or Repositories. It tightly couples your entire codebase to a third-party framework.
- If the company decides to switch from Firebase to Mixpanel, you would have to refactor 500 files.

**Solution:** Create an abstract `AnalyticsTracker` interface.
```kotlin
interface AnalyticsTracker {
    fun logEvent(eventName: String, params: Map<String, Any> = emptyMap())
    fun setUserProperty(key: String, value: String)
}

// Implement it:
class FirebaseTracker @Inject constructor(
    private val firebaseAnalytics: FirebaseAnalytics
) : AnalyticsTracker {
    override fun logEvent(eventName: String, params: Map<String, Any>) {
        // Maps map to Bundle and fires to Firebase
    }
}
```
Inject `AnalyticsTracker` into your ViewModels. Now the ViewModel doesn't know *how* the event is tracked, just that it happened.

## 3. Performance Monitoring

Firebase Performance Monitoring helps you track inherently slow operations in the wild.
- It automatically tracks network call duration, app startup times, and heavy screen renders.
- You can manually track specific block durations (Custom Traces).
```kotlin
val trace = Firebase.performance.newTrace("process_complex_video_filter")
trace.start()
// Heavy video processing
trace.stop()
```
