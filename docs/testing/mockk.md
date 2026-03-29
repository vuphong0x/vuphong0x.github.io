# MockK

MockK is the definitive mocking library built exclusively for Kotlin. Unlike older Java libraries like Mockito, MockK handles Kotlin's unique language traits—such as `final` classes by default, `object` singletons, extension functions, and `suspend` coroutines natively and effortlessly.

## Defining Mocks

A mocked object behaves as a totally blank shell of a class. You must dictate exactly what it should return when its methods are called, otherwise it crashes.

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
verify { userRepository.deleteUser(any()) wasNot Called }
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
*Answer:* A `mockk` is a true hollow shell; you must define the behavior of every method you intend to call. A `spyk` acts as a wrapper around a real, instantiated object. It will execute the *real* code of the object, unless you explicitly override a specific method on it using `every { ... }`. Spies are excellent for partial mocking.

**Q: How do you handle mocking a suspend function?**
*Answer:* Kotlin Coroutines suspend functions must be mocked and verified using the `coEvery { ... }`, `coVerify { ... }`, and `coAnswers { ... }` syntax counterparts provided natively by MockK.
