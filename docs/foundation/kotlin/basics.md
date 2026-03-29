# Kotlin Basics

## Key Concepts

### 1. Scope Functions
Execute a block of code within the context of an object.
- **`let`**: Returns the lambda result. Context object is `it`. Good for null checks (`obj?.let { ... }`).
- **`apply`**: Returns the context object. Context object is `this`. Good for object configuration.
- **`also`**: Returns the context object. Context object is `it`. Good for side effects like logging.
- **`run`**: Returns the lambda result. Context object is `this`. Good for calculating a value from an object.
- **`with`**: Similar to `run`, but passed as an argument.

## Interview Questions
**Q: How does `val` differ from `const val`?**
*Answer:* `val` is a runtime constant (value assigned at runtime and cannot be changed), while `const val` is a compile-time constant (value known at compile time, must be primitive or String, and declared at the top level or in an object).

**Q: Explain the difference between `let` and `apply`.**
*Answer:* `let` takes the object as `it` and returns the result of the lambda. `apply` takes the object as `this` and returns the object itself. `apply` is for configuration, `let` is for transformation or null checks.

Q: object và data object khác gì nhau?

Q: Scaffold and Surface
