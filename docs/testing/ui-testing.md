# UI Testing (Espresso and Compose)

UI tests are instrumented tests. They run on a physical device or emulator, meaning they have access to the full Android Framework (`Context`, `Activity`, `Instrumentation`). They are slower but test the application precisely the way a user interacts with it.

## Traditional UI Testing: Espresso

Espresso is the core API for interacting with standard XML Views. Its core philosophy revolves around automatically synchronizing with the UI thread to prevent flaky tests resulting from animations or network delays.

### Core Architecture
1. **ViewMatchers:** Find a view (`onView(withId(R.id.button_login))`).
2. **ViewActions:** Perform an action (`perform(click())`, `perform(typeText("user"))`).
3. **ViewAssertions:** Check a state (`check(matches(isDisplayed()))`).

```kotlin
@RunWith(AndroidJUnit4::class)
class LoginScreenTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    @Test
    fun testFailedLoginShowsErrorToast() {
        onView(withId(R.id.username)).perform(typeText("invalid_user"))
        onView(withId(R.id.password)).perform(typeText("wrong_pass"))
        onView(withId(R.id.login_button)).perform(click())

        // Verify the error message view becomes visible
        onView(withText("Invalid Credentials"))
            .check(matches(isDisplayed()))
    }
}
```

## Modern UI Testing: Compose Testing

Jetpack Compose uses semantics instead of View IDs. Semantics define accessible information about the Compose tree, letting TalkBack accessibility services—and the Test Framework—know what a node represents.

```kotlin
class ComposeLoginTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testLoginButtonEnabledOnlyWhenFieldsAreFilled() {
        // Set the UI Content directly! No Activity Required!
        composeTestRule.setContent {
            MyTheme {
                LoginScreen()
            }
        }

        // Before entering text, the button is disabled
        composeTestRule.onNodeWithText("Login").assertIsNotEnabled()

        // Enter text 
        composeTestRule.onNodeWithTag("EmailInput").performTextInput("test@test.com")
        composeTestRule.onNodeWithTag("PassInput").performTextInput("password")

        // Now button is enabled
        composeTestRule.onNodeWithText("Login").assertIsEnabled()
    }
}
```

## Flakiness and Idling Resources

A flaky test is a test that sometimes passes and sometimes fails without code changes. UI tests are highly susceptible to flakiness due to unpredictable real-world networking or database delays.
- **Espresso / Compose Rule** inherently wait for the UI thread to go idle.
- However, if you are running Coroutines / Retrofit off the main thread, the Test Framework doesn't know about them. 
- You must implement **IdlingResources** to tell the test runner: *"Wait, I'm doing network operations in the background right now. Do not assert the UI until I say I'm done."*

## Interview Questions

**Q: What is a Flaky Test and how do you fix it?**
*Answer:* A flaky test is unreliable due to race conditions or background timing. To fix it, you replace `Thread.sleep()` with IdlingResources or wrap network modules using a mocked offline engine (e.g., WireMock or MockWebServer) during UI testing to make the test utterly deterministic and isolated from actual internet latency.

**Q: Explain the difference between `createComposeRule` and `createAndroidComposeRule`.**
*Answer:* `createComposeRule` allows you to test pure composable functions in total isolation without needing a host Activity (fast and robust). `createAndroidComposeRule` boots up an actual specified `Activity` hosting the Composable, granting you access to `getString()`, `Theme`, or Activity-specific ViewModels.
