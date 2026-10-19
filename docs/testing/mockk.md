# MockK

MockK is a mocking library with Kotlin-oriented APIs. It provides APIs for stubbing/verifying Kotlin calls, including suspend functions; choose mocks or fakes according to the behavior under test.

## Defining Mocks

Configure the behavior the test needs. Unstubbed calls on strict mocks can fail; relaxed mocks/default handling follow their configured rules. Prefer a fake when a small stateful implementation makes the behavior clearer.

### Annotations Setup
```kotlin
class UserUseCaseTest {
    @MockK
    lateinit var userRepository: UserRepository

    @InjectMockKs
    lateinit var userUseCase: UserUseCase // Automatically injects the mocked repo!

    @Before
    fun setUp() = MockKAnnotations.init(this)
}
```

### Every / Returns (Stubbing)
You define the output using `every { ... } returns ...`. For suspend functions, use `coEvery`.

```kotlin
@Test
fun `when user is found, emit user state`() = runTest {
    // Arrange: Stub the behavior
    coEvery { userRepository.fetchUser("123") } returns User("123", "John")

    // Act
    val result = userUseCase.invoke("123")

    // Assert
    assertEquals("John", result.name)
}
```

## Core Features

### 1. Verification
You use `verify { ... }` or `coVerify` to ensure a method was called exactly the amount of times expected.
```kotlin
// Ensure the network payload was only sent ONCE
verify(exactly = 1) { analyticsTracker.logEvent("Login_Success") }

// Ensure another function was never called
coVerify(exactly = 0) { userRepository.deleteUser(any()) }
```

### 2. Argument Capturing
If an object is created on-the-fly inside the class under test, you can't assert against it directly. You must capture it using a `slot`.
```kotlin
val idSlot = slot<String>()
every { repository.saveToken(capture(idSlot)) } returns true

useCase.generateAndSaveToken()

assertEquals("test_token_123", idSlot.captured)
```

### 3. Mocking Static Objects & Extensions
MockK makes it incredibly easy to mock static constants, Kotlin `object` instances, and top-level extension functions using `mockkObject()` and `mockkStatic()`.

## Interview Questions

**Q: In MockK, what is a `spyk` compared to a `mockk`?**
*Answer:* A `mockk` is a true hollow shell; unstubbed behavior depends on whether the mock is strict or relaxed. A `spyk` acts as a wrapper around a real, instantiated object. It will execute the *real* code of the object, unless you explicitly override a specific method on it using `every { ... }`. Spies are excellent for partial mocking.

**Q: How do you handle mocking a suspend function?**
*Answer:* Kotlin Coroutines suspend functions must be mocked and verified using the `coEvery { ... }`, `coVerify { ... }`, and `coAnswers { ... }` syntax counterparts provided natively by MockK.


For suspend delete APIs use `coVerify`; for synchronous APIs use `verify`. Verify call count only when that interaction is part of the contract. See [test strategy](./test-strategy.md).

Nguồn API: [MockK documentation](https://mockk.io/).
