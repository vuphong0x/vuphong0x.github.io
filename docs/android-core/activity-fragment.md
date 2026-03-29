# Activity and Fragment

Activities and Fragments are the primary UI building blocks in older standard Android development (before Jetpack Compose). They manage user interactions, lifecycles, and window composition.

## Activity
An `Activity` represents a single screen with a user interface. It serves as an entry point for interacting with the user.

- **Responsibilities**:
  - Hosting UI components (via `setContentView`).
  - Handling Window-level events.
  - Interacting with the system back stack and saving instance state.
- **When to use**: Generally, an app should have one main Activity (Single-Activity Architecture) or a few core Activities that host various Fragments.

## Fragment
A `Fragment` represents a reusable portion of your app's UI. A Fragment must always be hosted in an Activity.

- **Responsibilities**:
  - Modularizing UI logic (e.g., a list pane and detail pane).
  - Can be added, removed, or replaced dynamically at runtime using `FragmentManager`.
  - Has its own distinct lifecycle that is inextricably tied to the host Activity's lifecycle.
- **Data Passing**: Pass data between Fragments using `setFragmentResult`, a shared `ViewModel` (scoped to Activity or Navigation Graph), or Jetpack Navigation safe args.

## Single Activity vs. Multi-Activity Architecture

**Single-Activity Architecture:**
Provides better control over navigation, transitions, and state sharing. Uses one standard Activity (e.g., `MainActivity`) handling the Jetpack Navigation component, swapping out `Fragments` (or `Composables`) as users navigate. This is the modern standard for Android development.

**Multi-Activity Architecture:**
Older apps often map each logical screen to a distinct `Activity`. This can make passing large datasets, seamless transitions, and deep-linking complicated.

## Interview Questions

**Q: What is the main difference between adding and replacing a Fragment?**
*Answer:* Adding a fragment puts it on top of existing ones (so the old one is still beneath it, consuming memory but visible if the new one is transparent). Replacing removes the existing fragments in that container before adding the new one. `replace` is generally better for flat navigation to free memory and prevent click-through issues.

**Q: When an Activity is destroyed on rotation, what happens to its Fragments?**
*Answer:* The FragmentManager automatically saves the state of attached fragments and re-creates them when the Activity is re-created upon rotation. You must not instantiate a new Fragment inside `onCreate` of the Activity unless `savedInstanceState == null`, otherwise you'll get overlapping fragments.
