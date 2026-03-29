# XML Views

The legacy, imperative way of building UIs in Android relies on XML layouts and View classes (e.g., `TextView`, `RecyclerView`, `ConstraintLayout`).

## Key XML Concepts

### 1. View Hierarchies
XML layouts are structured as trees.
- Avoid deep hierarchies as they negatively impact measurement and drawing performance.
- **ConstraintLayout** is preferred to flatten the view hierarchy, allowing complex layouts without nesting view groups.

### 2. ViewBinding
Replaces `findViewById`, providing null safety and type safety.
- It generates a binding class for each XML layout.
- Directly links to the views via their IDs, avoiding runtime crashes.

### 3. RecyclerView
Essential for displaying lists.
- Avoids memory exhaustion by recycling off-screen `ViewHolder` views.
- Requires an `Adapter` (creates ViewHolders and binds data) and a `LayoutManager` (positions items).
- Use `ListAdapter` with `DiffUtil` for calculating list changes efficiently on a background thread and animating the differences.

### 4. Custom Views
You can extend existing views (`TextView`) or `View`/`ViewGroup` directly.
- Override `onMeasure()` to dictate the view's size.
- Override `onDraw()` using a `Canvas` for custom graphics.
- Extract custom attributes into `attrs.xml` for XML configuration.

## Best Practices

1. **Accessibility**: Always use `android:contentDescription` on ImageViews for TalkBack support. Use `minHeight="48dp"` for touch targets.
2. **Styles and Themes**: Do not hardcode colors in XML. Use `?attr/colorPrimary` or `@style/MyCustomText`. Extract common styles into `styles.xml`.
3. **Strings**: Never hardcode text strings. Use `@string/my_string` to support localization.

## Interview Questions

**Q: What is the difference between `View.GONE` and `View.INVISIBLE`?**
*Answer:* `View.INVISIBLE` hides the view, but it still takes up space in the layout hierarchy. `View.GONE` completely removes the view from the layout calculations, collapsing the space it previously occupied.

**Q: Explain how `DiffUtil` works.**
*Answer:* `DiffUtil` is a utility class that calculates the difference between two lists and outputs a list of update operations that converts the first list into the second. It determines exactly which items were added, removed, or changed, drastically improving RecyclerView update performance compared to `notifyDataSetChanged()`.
