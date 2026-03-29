# Paging 3

The Paging library helps you load and display pages of data from a larger dataset from local storage or over a network. It drastically reduces network usage and system memory consumption.

## Core Components

### 1. PagingSource
Defines how to fetch paginated data (e.g., from Retrofit) and defines the paging keys (page numbers or cursors).
```kotlin
class UserPagingSource(val api: ApiService) : PagingSource<Int, User>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, User> {
        return try {
            val page = params.key ?: 1
            val response = api.getUsers(page = page)
            LoadResult.Page(
                data = response.items,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (response.items.isEmpty()) null else page + 1
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
    // getRefreshKey implementation omitted for brevity
}
```

### 2. Pager
A wrapper that provides a stream (`Flow<PagingData<T>>`) based on configuration (`PagingConfig`) and a factory that returns instances of your `PagingSource`.

```kotlin
val userFlow = Pager(
    config = PagingConfig(pageSize = 20, enablePlaceholders = false)
) {
    UserPagingSource(apiService)
}.flow.cachedIn(viewModelScope) // Crucial to prevent reloading on rotation
```

### 3. RemoteMediator (Network + Database)
Used only if fetching from the network *and* caching in a local Room database. It handles the logic of querying the network when the database runs out of data.

### 4. UI Layer (PagingDataAdapter / LazyPagingItems)
- **RecyclerView:** Use `PagingDataAdapter`. It builds on top of `DiffUtil` to animate items as the pages load in seamlessly.
- **Compose:** Use `.collectAsLazyPagingItems()`.

```kotlin
val lazyPagingItems = viewModel.userFlow.collectAsLazyPagingItems()
LazyColumn {
    items(lazyPagingItems.itemCount) { index ->
        val user = lazyPagingItems[index]
        UserItem(user)
    }
}
```

## Best Practices

1. **`cachedIn()`:** Always call `.cachedIn(viewModelScope)` right after your Pager flow creation. It caches the stream in memory so when the user rotates the device, the items are presented instantly without a new network request or PagingSource invalidation.
2. **Error Handling in UI:** Listen to `lazyPagingItems.loadState` to show loading spinners, appended footers (loading more indicators), or retry buttons.

## Interview Questions

**Q: Explain what the `prevKey` and `nextKey` are in the PagingSource.**
*Answer:* These are pointers used by the Paging library to know what parameter to pass to the API for the subsequent or previous fetching requests. They can be standard integer page numbers (1, 2, 3), string cursors ("next_hash_token_abc"), or offset values. If `nextKey` is null, the Paging library assumes it has reached the end of the entire list and will stop attempting to load more data.

**Q: Why would you use a `RemoteMediator` instead of just a `PagingSource`?**
*Answer:* A `PagingSource` alone is for network-only or database-only pagination. A `RemoteMediator` handles the complex orchestration of "Offline-First" apps. It acts as a signaling mechanism, intercepting network requests, writing the result directly into Room, and letting Room's own `PagingSource` act as the undisputed single source of truth for the UI.
