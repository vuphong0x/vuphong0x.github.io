# Room Database

Room is a persistence library that provides an abstraction layer over SQLite to allow fluent database access while harnessing the full power of SQLite.

## Core Components

### 1. Entity
Represents a table within the database. Annotated with `@Entity`.
```kotlin
@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "first_name") val firstName: String,
    val lastName: String
)
```

### 2. DAO (Data Access Object)
Contains the methods used for accessing the database. Room generates the implementation at compile time.
```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>> // Observes database changes!

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(vararg users: User)

    @Delete
    suspend fun delete(user: User)
}
```

### 3. Database
Holds the database and serves as the main access point for the underlying connection.
```kotlin
@Database(entities = [User::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

## Best Practices

1. **Use Coroutines & Flows:** Always return `Flow<T>` for queries you want to observe, and use `suspend fun` for one-shot reads, inserts, and deletes. Room automatically executes these on background dispatchers.
2. **Migrations:** Never change the schema without providing a Migration strategy. Otherwise, the app will crash on update.
   ```kotlin
   val MIGRATION_1_2 = object : Migration(1, 2) {
       override fun migrate(database: SupportSQLiteDatabase) {
           database.execSQL("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0")
       }
   }
   ```
3. **Type Converters:** SQLite only supports basic types (String, Int, Long, Blob). If you need to save a `Date` or a custom Object, create a `@TypeConverter` to serialize/deserialize it to/from a String or Long.

## Interview Questions

**Q: Why does Room force you to use background threads for database access?**
*Answer:* Accessing the database on the Main thread will block the UI, causing jank or potentially an ANR (Application Not Responding) crash. Room explicitly throws an `IllegalStateException` if it detects Main thread execution unless `allowMainThreadQueries()` is explicitly built (which should never be used in production).

**Q: How do you handle 1-to-many relationships in Room?**
*Answer:* You define multiple Data Classes (Entities) and then link them using a wrapper model annotated with `@Relation`. 
For example, a `UserWithPlaylists` wrapper would have an `@Embedded val user: User` and a `@Relation(parentColumn = "id", entityColumn = "userId") val playlists: List<Playlist>`. Room handles querying both tables seamlessly.
