# Object-Oriented Programming (OOP) in Kotlin

Kotlin embraces OOP while also introducing functional programming features. It fixes many of Java’s design issues, providing a safer and more robust object model.

## Key OOP Concepts in Kotlin

### 1. Classes and Inheritance
By default, all classes in Kotlin are `final` (cannot be inherited). To allow inheritance, a class must be explicitly marked with the `open` keyword.

```kotlin
open class Animal(val name: String) {
    open fun makeSound() {
        println("Animal sound")
    }
}

class Dog(name: String) : Animal(name) {
    override fun makeSound() {
        println("Bark")
    }
}
```

### 2. Interfaces
Interfaces in Kotlin can contain abstract default method implementations, making them more powerful than traditional Java interfaces (prior to Java 8).
- A class can implement multiple interfaces.
- If multiple interfaces provide default implementations for the same method name, the implementing class *must* override that method and resolve the conflict.

### 3. Abstract Classes
Used to define a blueprint representing a concept. An abstract class cannot be instantiated directly.
- Unlike interfaces, abstract classes can hold state (properties).

### 4. Visibility Modifiers
- `public`: (Default) Visible everywhere.
- `private`: Visible only inside the file or class containing the declaration.
- `protected`: Visible inside the class and its subclasses (unlike Java, which allows package-level access).
- `internal`: Visible anywhere within the same module (useful for multi-module architectures).

### 5. Companion Objects
Kotlin does not have the `static` keyword. Instead, it uses `companion object` to define instances tied to a class rather than instances of the class.

```kotlin
class User private constructor(val name: String) {
    companion object {
        fun createGuest(): User = User("Guest")
    }
}
```

### 6. Sealed Classes and Interfaces
Provides restricted class hierarchies where a value can have one of the types from a limited set. Excellent for representing UI states (Loading, Success, Error).

```kotlin
sealed class UiState {
    object Loading : UiState()
    data class Success(val data: List<Item>) : UiState()
    data class Error(val exception: Exception) : UiState()
}
```

## Interview Questions

**Q: What is the main usage of `sealed class`?**
*Answer:* `sealed class` is used to represent constrained hierarchies (enum on steroids). It restricts inheritance to classes defined within the same file. It ensures exhaustive `when` statements at compile-time when checking all possible subtypes, making it the perfect pattern for MVI/MVVM UI states.

**Q: How does `internal` differ from Java's package-private visibility?**
*Answer:* Java's package-private allows access to any class inside the same package. Kotlin's `internal` allows access to any class compiled together in the same *module* (e.g., a specific Gradle module), regardless of package.