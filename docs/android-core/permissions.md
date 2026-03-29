# Permissions in Android

Android divides permissions into conceptually different categories to protect user privacy and system integrity.

## Types of Permissions

### 1. Install-time Permissions (Normal Permissions)
Automatically granted at install time. These pose very little risk to user privacy.
- Examples: `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE`.
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 2. Runtime Permissions (Dangerous Permissions)
These permissions access private user data (camera, contacts, location, microphone). You must explicitly ask the user to grant them while the app is running.
- **Best Practice:** Ask for the permission *in-context*. Only request camera permission right when the user clicks the "Take Photo" button, not on app startup.
- If the user denies the permission, gracefully degrade the app experience. Check `shouldShowRequestPermissionRationale()` to explain *why* the app needs the feature.

### 3. Special Permissions
System-level settings like `SYSTEM_ALERT_WINDOW` (drawing over other apps) or `SCHEDULE_EXACT_ALARM`. These typically require redirecting the user deep into the OS Settings app.

## Permissions in Jetpack Compose
In modern Compose apps, the Accompanist Permissions library (or equivalent integrated API) provides declarative wrappers around runtime permissions.
```kotlin
val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

if (cameraPermissionState.status.isGranted) {
    CameraPreview()
} else {
    Button(onClick = { cameraPermissionState.launchPermissionRequest() }) {
        Text("Request permission")
    }
}
```

## Security Best Practices
- **Least Privilege:** Request the absolute minimum permissions needed. E.g., don't ask for `READ_EXTERNAL_STORAGE` if you can use the Photo Picker or Storage Access Framework to let the user pick a single file.
- **Location Precision:** Android 12+ lets users grant *approximate* location even when you ask for *precise* location. Your app must handle this gracefully.
- **Exported Components:** Only export (`android:exported="true"`) Activities, BroadcastReceivers, or Services in the manifest if absolutely necessary. Protect them with custom signature permissions if they are only meant for your suite of apps.

## Interview Questions

**Q: How does `ActivityResultContracts.RequestPermission` differ from the old `onRequestPermissionsResult`?**
*Answer:* The old method was an overridden Activity callback that required fragile request codes to match results. The modern `ActivityResultLauncher` API registers an explicit contract and lambda handler tightly coupled to the request, improving state management, decoupling logic from the Activity base class, and improving readability.

**Q: Explain Scoped Storage and its impact on permissions.**
*Answer:* Introduced in Android 10 (and mandatory in 11), Scoped Storage limits broad file access. Apps no longer need `READ_EXTERNAL_STORAGE` to write and read their own files in app-specific directories. They only need permissions if they need to access media shared by other apps.
