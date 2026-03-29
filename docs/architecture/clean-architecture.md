# Clean Architecture

Clean Architecture, conceptualized by Robert C. Martin (Uncle Bob), is a software design philosophy that separates the elements of a design into ringed layers. The fundamental overriding rule is the **Dependency Rule**: Source code dependencies must point only *inward*, toward higher-level policies.

## The Three Main Layers in Android

### 1. Presentation Layer
- **Components:** Activities, Fragments, Composables, ViewModels.
- **Responsibility:** Draws UI and handles user input.
- **Dependencies:** Depends on the Domain Layer. Knows nothing about the Data Layer.

### 2. Domain Layer (The Core)
- **Components:** UseCases (Interactors), Domain Models, Repository Interfaces.
- **Responsibility:** Contains the pure business logic of the app.
- **Dependencies:** **Zero dependencies on Android frameworks or other layers.** It is pure Kotlin/Java code. This makes testing business logic incredibly fast and pure.

### 3. Data Layer
- **Components:** Repository Implementations, Data Sources (Room DAOs, Retrofit interfaces), DTOs (Data Transfer Objects).
- **Responsibility:** Fetches data from external sources and maps DTOs to pure Domain Models.
- **Dependencies:** Depends on the Domain Layer (implements its interfaces).

## Use Cases (Interactors)
A Use Case encapsulates a single, specific task (e.g., `GetUserProfileUseCase`, `PerformLoginUseCase`).
- They make the ViewModel much smaller and purely responsible for formatting data to the UI.
- They ensure business logic is highly reusable across different ViewModels.

```kotlin
// Inner layer: Domain
class GetUserUseCase(private val repository: UserRepository) {
    suspend operator fun invoke(id: String): User {
        return repository.getUser(id)
        // Add business validation here
    }
}
```

## Dependency Inversion

Because the Domain layer cannot depend on the Data layer, we use the Dependency Inversion Principle.
1. The Domain layer defines an **Interface** (`UserRepository`).
2. The Domain layer's UseCase relies on this Interface.
3. The Data layer provides the **Implementation** (`UserRepositoryImpl`) of that interface.
4. Dependency Injection (e.g., Hilt/Dagger) wires them together at runtime.

## Benefits & Drawbacks
**Benefits:**
- Highly testable (Domain layer can be tested with basic JUnit tests; no Robolectric/emulators required).
- Decoupled from frameworks (You can swap Room for Realm without altering business logic).
- Scalable for large teams.

**Drawbacks:**
- Over-engineering for simple apps.
- Results in many classes mapping identical properties (DTO -> Domain Model -> UI Model).

## Interview Questions

**Q: Explain the Dependency Rule in Clean Architecture.**
*Answer:* Dependencies must point inwards. Nothing in an inner circle can know anything at all about something in an outer circle. Specifically, our pure Domain layer cannot import Retrofit, Room, or Android Context.

**Q: Why do we have separate models (DTO, Domain Model, UI State)? Doesn't it just create boilerplate?**
*Answer:* It prevents changes in an external API from breaking the UI. If the backend changes a JSON key from `user_age` to `age_in_years`, only the API DTO and Mapper change. The Domain Model and UI Model remain unaffected. The boilerplate pays off heavily in maintenance stability.
