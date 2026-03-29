# System Design & Architecture

System design questions test a developer's ability to abstract a massive feature or app into scalable, robust technical components.

## General Approach

When given an Android system design prompt (e.g., "Design the Twitter Feed" or "Design a Ride-Sharing Map App"):
1. **Clarify Requirements:** Ask questions. Is offline support required? Are we dealing with real-time sockets or polling? Image uploads?
2. **High-Level Diagram:** Propose standard MVVM + Clean Architecture flow. Note where Repositories sit and how UseCases abstract logic.
3. **Data Layer Strategy:** Discuss API interactions (REST vs GraphQL/WebSockets) and local persistence (Room). Explain the caching strategy (Single Source of Truth paradigm).
4. **Offline support/Sync (crucial):** How does the app handle a dropped connection? (E.g., Save API actions to Room, push to server via WorkManager when connection returns).
5. **Pagination:** How are massive lists rendered without memory limits blowing up? (Paging 3 + RemoteMediator).
6. **Performance & Security:** Image Caching (Coil/Glide), Certificate Pinning, Obfuscation (R8), Encryption (EncryptedSharedPreferences).

---

## Scenario A: Design an Offline-First Chat Application

**Requirements:**
- Send/Receive distinct text messages.
- Must work robustly without internet connection (queueing).

**Architecture Components:**
1. **Network:** Use WebSockets or Server-Sent Events (SSE) for real-time delivery, not REST polling. Fallback to FCM (Firebase Cloud Messaging) pushing wake locks if the app is killed.
2. **Local Database:** Room Database. Specifically, a `Message` table with a `sync_status` column (`PENDING`, `SENT`, `FAILED`).
3. **Single Source of Truth:**
   - The UI absolutely NEVER observes the network directly.
   - The UI *only* observes a Flow from the Room DAO (`SELECT * FROM messages WHERE chat_id = X ORDER BY timestamp ASC`).
   - Network responses write strictly to Room.
4. **Offline Queueing:**
   - App is offline. User types "Hello".
   - ViewModel saves "Hello" to Room with `sync_status = PENDING`. The UI instantly shows it (optimistic update).
   - Enqueue a `WorkManager` task or start a job using `ConnectivityManager` callbacks.
   - When the internet restores, `WorkManager` intercepts the payload, posts to the WebSocket, updates the Room column to `SENT` upon success.
5. **Pagination:** Paging 3 loads older messages from Room natively as the user scrolls up.

---

## Scenario B: Design an Instagram Image Feed

**Requirements:**
- Extremely fast image loading.
- Smooth scrolling without UI Jank.
- Pagination.

**Architecture Components:**
1. **Data loading:** REST API endpoint using offset/cursor pagination. Paging 3 `RemoteMediator` sits between the raw API DTO mapper and the Room Cache layout.
2. **Image Loading Engine (Glide/Coil):**
   - **Memory Cache:** L1 Cache. A HashMap maintaining decoded Bitmaps based on LRU (Least Recently Used) policies to render instantly on scroll.
   - **Disk Cache:** L2 Cache. Encoded JPEGs/WebP saved to app scope cache directory so repeated app opens don't require network transfers.
   - **Downsampling:** The raw backend image might be 4000x4000 pixels. The Image Pipeline must detect the ImageView boundaries (e.g., 500x500) and decode the Bitmap scaled to exactly that size to dodge `OutOfMemoryError` limits.
3. **RecyclerView / LazyColumn:** 
   - Strict usage of `DiffUtil` so appending page 2 doesn't stutter the visible page 1 items.
   - Pre-fetching URLs using RecyclerView's `PreloadItem` mechanism so the next image downloads before the user scrolls to it.

---

## Scenario C: Massive Legacy Refactoring

**Requirements:**
- Taking over a large Monolithic Java App (God Activities, MVC).
- Transitioning it to Kotlin, Compose, MVVM, and Modularized architecture.

**Strategy:**
1. **Stop the Bleeding:** Create a boundary. All *new* features are built strictly in Kotlin using MVVM/Compose in separate modules.
2. **Modularization first:** Rip out generic utility functions (Date parsing, pure Network clients) into `core:utils` and `core:network` modules.
3. **Strangler Fig Pattern:** Use Jetpack Navigation. Slowly extract single `Activity` screens into `Fragment/Compose` destinations hosted in a modern `MainActivity`.
4. **Unit Tests are mandatory:** Before touching complex legacy God classes in Java, write heavy JUnit characterization tests tracking inputs and outputs perfectly to ensure refactoring logic into Kotlin UseCases doesn't cause hidden regressions.
