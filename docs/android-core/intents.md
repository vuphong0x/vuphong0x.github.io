# Intents

An `Intent` is a messaging object used to request an action from another app component (Activity, Service, BroadcastReceiver). They facilitate communication between different parts of your app or even between different apps entirely.

## Types of Intents

### 1. Explicit Intents
Used to start a specific component within your own application. You provide the exact class name.
```kotlin
val intent = Intent(this, DetailActivity::class.java)
intent.putExtra("ITEM_ID", 123)
startActivity(intent)
```

### 2. Implicit Intents
Used to ask the system to find an app that can handle a generic action (like taking a photo, opening a URL, or sharing text). You do not specify the exact component name.
```kotlin
val intent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_TEXT, "Check out this app!")
}
startActivity(Intent.createChooser(intent, "Share via..."))
```

## Intent Filters
For your app to respond to implicit intents from other apps, you declare `<intent-filter>` elements within the component's declaration in the `AndroidManifest.xml`.
```xml
<activity android:name=".ShareActivity" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
</activity>
```
*Note:* The `android:exported="true"` flag is required in modern Android (API 31+) if an intent filter is present.

## PendingIntent
A `PendingIntent` is a wrapper around a regular intent that grants another application (like the NotificationManager, AlarmManager, or a Home Screen Widget) the right to execute the wrapped intent as if it were executed by your own app, with your app's permissions.

## Interview Questions

**Q: What are the primary uses of `PendingIntent`?**
*Answer:* `PendingIntent` is primarily used for handling taps on Notifications, scheduling alarms via AlarmManager, or interacting with App Widgets. It allows external applications to execute predefined actions on behalf of your app.

**Q: Explain Intent Flags.**
*Answer:* Flags dynamically alter the behavior of how an intent is handled or which task an Activity belongs to. For example, `FLAG_ACTIVITY_CLEAR_TOP` clears all activities on top of the target activity if it is already in the back stack. `FLAG_ACTIVITY_NEW_TASK` starts a new task stack (often needed when starting an Activity from outside a standard Activity context, like from a Service).
