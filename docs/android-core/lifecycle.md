# Android Lifecycle

Understanding lifecycles is crucial for avoiding memory leaks, crashes, and unpredictable behavior. Both `Activity` and `Fragment` have structured lifecycles.

## Activity Lifecycle
1. `onCreate()`: Called when the activity is first created. Setup UI, initialize ViewModels, bind data.
2. `onStart()`: Activity becomes visible to the user.
3. `onResume()`: Activity comes to the foreground and becomes interactive.
4. `onPause()`: Activity loses focus but might still be partially visible (e.g., dialer popup). Pause animations, camera previews.
5. `onStop()`: Activity is no longer visible. Save state, release heavy resources.
6. `onDestroy()`: Activity is destroyed. Release all references.

## Fragment Lifecycle
Fragments have two distinct lifecycles: the Fragment instance lifecycle and the View lifecycle.
1. `onAttach()`: Attached to the host Activity.
2. `onCreate()`: Fragment instance is created.
3. `onCreateView()`: Inflate the UI view.
4. `onViewCreated()`: Safe to start manipulating views (e.g., `findViewById`, ViewBinding).
5. `onStart()` / `onResume()`: Mirrored from Activity.
6. `onPause()` / `onStop()`: Mirrored from Activity.
7. `onDestroyView()`: The view is destroyed. Null out ViewBindings here to prevent memory leaks!
8. `onDestroy()` / `onDetach()`: The instance is destroyed and detached.

## ViewModel Lifecycle
`ViewModel` survives configuration changes (like screen rotations).
- Created when the Activity/Fragment is first created.
- Lives throughout rotations.
- `onCleared()` is called when the Activity is genuinely finished or the Fragment is permanently removed. This is where you should cancel Coroutines/RxJava streams.

## Saving UI State
Apps might be killed by the system to free up resources.
- **ViewModel:** Handles rotation but not system process death.
- **SavedStateHandle:** Integrated inside ViewModel to save and restore data across system process death.
- **onSaveInstanceState()**: Legacy way in Activities/Fragments to store lightweight UI data (e.g., scroll position, entered text) in a specific `Bundle`.

## Interview Questions

**Q: Why do we null out ViewBinding in Fragment's `onDestroyView`?**
*Answer:* A Fragment's instance might outlive its view (e.g., when it is in the back stack but not visible). If you keep a reference to the ViewBinding variable, the Views cannot be garbage collected, leading to a memory leak.

**Q: What is the lifecycle order when navigating from Activity A to Activity B?**
*Answer:* A.onPause() -> B.onCreate() -> B.onStart() -> B.onResume() -> A.onStop(). Activity A only drops to `onStop()` *after* B has completed its layout and rendered its first frame.
