# Jetpack Navigation Component

The Jetpack Navigation Component simplifies navigating between destinations in an Android app, whether they are Fragments, Activities, or Composables. It handles back stack management, deep linking, and argument passing safely.

## Key Concepts

### 1. Navigation Graph
An XML resource (in traditional Android) or a DSL build block (in Compose) that maps out all possible screens (destinations) and the connections (actions) between them.

### 2. NavHost
An empty container that displays destinations from the graph as users navigate through your app.
- For Fragments: `NavHostFragment` in XML.
- For Compose: `NavHost` composable.

### 3. NavController
The object that manages app navigation within a `NavHost`. You call `navigate()` on this object.

## Passing Data (Type Safety)

### Safe Args (XML/Fragments)
Generates simple object and builder classes for type-safe navigation and access to any associated arguments.
```kotlin
// Sending
val action = HomeFragmentDirections.actionHomeToDetail(itemId = 123)
findNavController().navigate(action)

// Receiving
val args: DetailFragmentArgs by navArgs()
val item = args.itemId
```

### Type-Safe Routing (Compose Navigation in Android 14+)
Modern Compose Navigation uses Kotlin Serialization. You define routes as Data Objects or Data Classes.
```kotlin
@Serializable object Home
@Serializable data class UserProfile(val userId: String)

// Navigating
navController.navigate(UserProfile(userId = "123"))

// Receiving in NavHost graph builder
composable<UserProfile> { backStackEntry ->
    val profile: UserProfile = backStackEntry.toRoute()
    ProfileScreen(userId = profile.userId)
}
```

## Deep Linking
Navigation component allows seamless integration of Deep Links.
- Explicit Deep Links (often from notifications).
- Implicit Deep Links (triggered by URLs).
You simply define `<deepLink>` tags in XML or `deepLink = listOf(...)` in Compose routing.

## Best Practices
1. **Never pass large objects:** Don't pass full data classes through navigation arguments (they have size limits and cause crashes). Pass an ID, and let the destination screen's ViewModel fetch the object from the database or repository.
2. **Single source of truth for NavController:** Keep the `NavController` hoisted near the top of your composable hierarchy to easily pass navigation testing logic.

## Interview Questions

**Q: How does Jetpack Navigation handle the Back Stack?**
*Answer:* By default, the `NavController` maintains a robust back stack. `navigate()` pushes a destination onto the stack. When the user hits the system back button, `popBackStack()` is called automatically. You can also manipulate the stack directly, like using `popUpTo` (to clear intermediate screens, e.g., clearing checkout flows after purchase confirmation) and `inclusive = true`.

**Q: What happens if you try to pass a large Bitmap or List of objects via Safe Args or standard Intents?**
*Answer:* You will trigger a `TransactionTooLargeException`. The Android IPC maximum buffer size is slightly under 1MB, shared across all active transactions. You should only pass identifiers (like database IDs) and query the data locally.
