# Modularization & Dependency Injection

As an Android app grows, a monolithic architecture (everything in an `app` module) becomes incredibly slow to build, hard to maintain, and difficult for multiple teams to work on. Modularization solves this.

## App Modularization

Modularization is the practice of splitting a single codebase into separate, independent Gradle modules.

### Benefits
1. **Build Times:** Gradle runs tasks in parallel and caches outputs. If you change code in the `feature:login` module, Gradle doesn't recompile the `feature:profile` module.
2. **Encapsulation:** You can hide internal classes using the `internal` visibility modifier, ensuring other modules can't access them and create spaghetti dependencies.
3. **Dynamic Features:** Enables using Android App Bundles to download certain features purely on-demand to reduce initial app size.

### Splitting Strategies
- **By Layer:** `app` -> `domain` -> `data`. (Good for simple projects, but eventually `data` becomes a massive bottleneck).
- **By Feature:** `feature:login`, `feature:checkout`, `core:network`, `core:ui`. (Recommended. Each feature contains its own presentation, domain, and data logic).

## Dependency Injection (DI)

DI is a design pattern used to implement Inversion of Control. Instead of a class creating its own dependencies, they are provided to it.

### Why DI?
- Extremely easy testing (you can easily pass mocked implementations).
- Reduces class coupling.
- Manages singletons efficiently.

### Hilt / Dagger
**Dagger 2** is a compile-time DI framework. It generates highly optimized code without using slow reflection. However, it requires intense boilerplate.

**Hilt** is Google's official wrapper built on top of Dagger. It provides predefined standard components (e.g., `SingletonComponent`, `ViewModelComponent`, `ActivityComponent`) out of the box.

```kotlin
// Defining a dependency
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit = Retrofit.Builder().build()
}

// Injecting into a ViewModel
@HiltViewModel
class MainViewModel @Inject constructor(
    private val api: MyApi // Automatically provided by Hilt
) : ViewModel()
```

### Koin
A wildly popular pragmatic lightweight dependency injection framework built entirely in Kotlin.
- Doesn't generate code; relies on inline functions and a DSL at runtime.
- Marginally slower at startup compared to Dagger/Hilt, but vastly faster build times and zero boilerplate.

## Interview Questions

**Q: When would you choose Koin over Hilt/Dagger?**
*Answer:* Koin is deeply pragmatic. I would choose it for a pure Kotlin project focusing on rapid development, smaller team sizes, and when compile-times are a major bottleneck (since Dagger's annotation processing (KAPT/KSP) slows down builds). I would stick to Hilt for massive enterprise apps where startup performance is extremely critical and compile-time safety is mandated.

**Q: What is the difference between `api` and `implementation` in a `build.gradle` file?**
*Answer:* `implementation` leaks the dependency only to the module it is declared in (faster compilation due to isolated compilation boundaries). `api` leaks the dependency transitively to other modules that depend on this one. You should almost always use `implementation` unless you explicitly want to expose that library's API to consumers of your module.
