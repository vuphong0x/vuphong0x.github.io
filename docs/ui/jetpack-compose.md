# Jetpack Compose

Jetpack Compose is Android’s modern declarative UI toolkit. It drastically reduces boilerplate and speeds up UI development by describing *what* the UI should look like for a given state, rather than *how* to mutate it over time.

## Core Concepts

### 1. Declarative Paradigm
Instead of manually updating UI widgets (e.g., `textView.setText(data)`), your Composables observe state. When the state changes, Compose automatically re-executes (recomposes) the specific functions that read that state.

### 2. Basic Composables
- **`Text`**: Displays text.
- **`Image`** / **`Icon`**: Displays graphics.
- **`Button`**: Handles clicks.
- **`TextField`**: Input field.

### 3. Layouts
- **`Column`**: Arranges elements vertically (`LinearLayout(vertical)` equivalent).
- **`Row`**: Arranges elements horizontally (`LinearLayout(horizontal)` equivalent).
- **`Box`**: Stacks elements on top of each other (`FrameLayout` equivalent).
- **`LazyColumn`** / **`LazyRow`**: The Compose equivalent of `RecyclerView`. Emits only the visible items.

### 4. Modifiers
Used to decorate or configure a composable (padding, background, click listeners, size).
*Important:* The order of Modifiers matters! `Modifier.padding(16.dp).background(Color.Red)` looks different from `Modifier.background(Color.Red).padding(16.dp)`.

### 5. State Management
- `remember`: Caches an object across recompositions.
- `mutableStateOf`: An observable state holder. Changes to its value trigger recompositions.
```kotlin
var name by remember { mutableStateOf("User") }
```
- **State Hoisting**: A pattern where you move state up to a parent composable to make the child stateless and reusable.

## Best Practices

1. **Unidirectional Data Flow (UDF)**: Events flow up, State flows down. Composables pass events to the ViewModel, the ViewModel updates the StateFlow, and the Composable recomposes based on the new State.
2. **Stable Types**: Ensure objects passed to Composables are `@Stable` or `@Immutable` (like Data Classes with `val` properties). If Compose isn't sure an object changed, it recommits unnecessarily.
3. **Avoid heavy computations in Composable functions**: They can execute hundreds of times per second (e.g., during animations).

## Interview Questions

**Q: What is Recomposition?**
*Answer:* Recomposition is the process of calling your composable functions again when their inputs (state) change. Compose intelligently tracks which data belongs to which composable and only updates the parts of the UI whose data changed, skipping the rest.

**Q: How do you perform a side effect in Compose without running it on every recomposition?**
*Answer:* You use Side-Effect APIs like `LaunchedEffect` (runs a suspending function based on a key), `DisposableEffect` (runs when a key changes and provides a cleanup block), or `SideEffect` (runs after every successful recomposition).
