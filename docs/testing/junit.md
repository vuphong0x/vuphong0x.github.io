# JUnit and Local Unit Testing

Unit Tests verify the behavior of the smallest unit of logic (e.g., a function, a UseCase, or a ViewModel). They run on the local JVM (your computer) and are exceptionally fast compared to instrumented UI tests.

## Why Unit Testing?
1. Validates business logic securely.
2. Prevents regressions when refactoring.
3. Documents the intended behavior of a component.

## Best Practices (FIRST Principle)
- **F**ast: Tests should run in milliseconds to encourage developers to run them often.
- **I**solated/Independent: Tests should never depend on each other. One failing test shouldn't trigger a cascade of failures.
- **R**epeatable: A test should produce the same result regardless of the environment (e.g., network conditions, timezone).
- **S**elf-validating: The test either passes (green) or fails (red) purely automatically without manual log inspection.
- **T**horough: Test edge cases, nulls, empty lists, exceptions, boundary limits.

## Setting Up JUnit 4/5
In Android, JUnit 4 is the legacy standard, while JUnit 5 (Jupiter) is the modern standard.

```kotlin
// Basic JUnit 4 Example
class CalculatorTest {

    private lateinit var calculator: Calculator

    @Before
    fun setUp() {
        calculator = Calculator()
    }

    @Test
    fun `when adding two positive numbers, then return correct sum`() {
        // Arrange
        val a = 5
        val b = 3

        // Act
        val result = calculator.add(a, b)

        // Assert
        assertEquals(8, result)
    }
}
```

## Testing ViewModels and Coroutines

Because Coroutines utilize specialized Dispatchers (like `Dispatchers.Main` which relies on the `android.os.Looper`), you will get crashes if you run ViewModel tests on a standard local JVM.

**Solution:** Use `MainDispatcherRule` to swap the Main dispatcher for `UnconfinedTestDispatcher`.

```kotlin
@OptIn(ExperimentalCoroutinesApi::class)
class MainDispatcherRule(
    val testDispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(testDispatcher)
    }

    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}

class LoginViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun `when login succeeds, state is updated to Success`() = runTest {
        // Evaluate suspended code inside runTest to skip delays!
        viewModel.login()
        assertEquals(Success, viewModel.uiState.value)
    }
}
```

## Interview Questions

**Q: Explain the AAA pattern in Unit Testing.**
*Answer:* AAA stands for **Arrange** (set up objects, mocks, and initial state), **Act** (execute the specific method being tested), and **Assert** (verify the returned value or resulting state). Following this structure makes tests highly legible.

**Q: What is `runTest` from the `kotlinx-coroutines-test` library, and why is it superior to `runBlocking`?**
*Answer:* `runTest` is designed specifically for testing hanging suspend functions. It automatically skips delays (`delay(5000)` executes instantaneously). `runBlocking` actually blocks the underlying thread and waits the full real 5 seconds, making your test suites unacceptably slow.
