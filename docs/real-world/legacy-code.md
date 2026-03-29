# Dealing with Legacy Code & Refactoring

Taking over a massive, poorly-architected Android codebase (e.g., God Activities, giant nested callbacks, 10-year-old Java files) requires a surgically precise approach.

## 1. The Strangler Fig Pattern

You cannot stop product development for 6 months to rewrite an app from scratch. You must rewrite it piecemeal while new features are continuously deployed.

**How it works:**
1. Pick one specific screen or feature (e.g., the User Profile screen).
2. Rewrite that specific completely detached flow into modern Kotlin/Compose/MVVM.
3. Reroute the legacy app's navigation to point to your new Kotlin implementation instead of the old Java Activity.
4. Delete the old Java Activity.
5. Repeat for the next screen until the legacy code "dies" organically.

## 2. Writing Characterization Tests

Before modifying a highly complex Java "God" class because you want to extract logic, you must prove you didn't break anything. 
- Write JUnit tests that document exactly what the class does *right now* with all its flaws. 
- Refactor the code.
- If the tests still pass, you successfully extracted the logic cleanly.

## 3. Isolating the Domain

Legacy Android code often mixes networking, database queries, and UI manipulation in a single `onPostExecute()` block.

**Step 1:** Create an interface for the operation (e.g., `interface UserRepository`).
**Step 2:** Extract the nasty raw SQLite/Network code into the `UserRepositoryImpl`.
**Step 3:** Inject the `UserRepository` into the legacy God Activity.
Suddenly, the Activity is much smaller and testable, and you've initiated Clean Architecture without breaking the app.

## 4. Defending Against Regressions
- Integrate **ktlint/detekt** immediately. Ensure all *new* code adheres strictly to high-quality standards.
- Add **Strict Mode** in debug builds so developers are instantly aware if they accidentally push disk reads onto the main thread while refactoring asynchronous code.
- Implement **Baseline Profiles** if the legacy application is sluggish at startup due to enormous XML View inflation.
