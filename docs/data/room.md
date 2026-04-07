# Room Database

Room là một thư viện lưu trữ dữ liệu cung cấp một lớp trừu tượng bên trên SQLite, giúp truy cập cơ sở dữ liệu một cách linh hoạt đồng thời vẫn tận dụng toàn bộ sức mạnh của SQLite.

### Core Components

#### 1. Entity

Đại diện cho một bảng dữ liệu trong database. Annotated with `@Entity`.

```kotlin
@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    @ColumnInfo(name = "first_name") val firstName: String,
    val lastName: String
)
```

#### 2. DAO (Data Access Object)

Chứa các phương thức được sử dụng để truy cập cơ sở dữ liệu. Room sẽ tự động tạo phần triển khai (implementation) tại thời điểm compile.

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

#### 3. Database

Chứa cơ sở dữ liệu và đóng vai trò là điểm truy cập chính đến kết nối dữ liệu bên dưới.

```kotlin
@Database(entities = [User::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```



### **Migrations**

1. **AutoMigration**

   ```kotlin
   // Database class before the version update.
   @Database(
     version = 1,
     entities = [User::class]
   )
   abstract class AppDatabase : RoomDatabase() {
     ...
   }

   // Database class after the version update.
   @Database(
     version = 2,
     entities = [User::class],
     autoMigrations = [
       AutoMigration (from = 1, to = 2)
     ]
   )
   abstract class AppDatabase : RoomDatabase() {
     ...
   }
   ```

- Phải cấu hình Room export schema ra file JSON trong `build.gradle` . Room dựa vào file JSON của version cũ và version mới để tự so sánh và viết lệnh SQL

- Nếu xóa /đổi tên cột /bảng thì cần triển khai thêm class `AutoMigrationSpec` đi kèm với các annotation như: `@DeleteTable` ,`@RenameTable` ,`@DeleteColumn` ,`@RenameColumn`

  ```kotlin
  @Database(
    version = 2,
    entities = [User::class],
    autoMigrations = [
      AutoMigration (
        from = 1,
        to = 2,
        spec = AppDatabase.MyAutoMigration::class // Use spec property
      )
    ]
  )
  abstract class AppDatabase : RoomDatabase() {
    @RenameTable(fromTableName = "User", toTableName = "AppUser")
    class MyAutoMigration : AutoMigrationSpec
    ...
  }
  ```

1. **Manual Migration**

   Dùng cách này khi có **thay đổi phức tạp về dữ liệu** mà AutoMigration không thể tự hiểu được. Ví dụ:

   - Chuyển kiểu dữ liệu của một cột (từ `Int` sang `String`).

   - Tách một bảng thành hai bảng.

   - Lấy dữ liệu từ cột cũ tính toán rồi gán vào cột mới trước khi xóa cột cũ.

   ```
   // Ví dụ: Thêm cột 'phone_number' vào bảng 'User'
   val MIGRATION_1_2 = object : Migration(1, 2) {
       override fun migrate(database: SupportSQLiteDatabase) {
           database.execSQL("ALTER TABLE User ADD COLUMN phone_number TEXT DEFAULT ''")
       }
   }

   // Khi build database, nhớ add vào:
   val db = Room.databaseBuilder(
       applicationContext,
       AppDatabase::class.java, "my_database"
   )
   .addMigrations(MIGRATION_1_2) // Thêm migration step ở đây
   .build()
   ```

**Q: Làm sao để biết mình viết SQL trong Manual Migration có đúng không trước khi release?**

Chúng ta tuyệt đối không test bằng cơm (cài app rồi update thử). Thay vào đó, Android cung cấp thư viện `androidx.room:room-testing`. Chúng ta sẽ viết Unit Test sử dụng `MigrationTestHelper` để giả lập việc tạo DB ở version cũ, insert data mẫu, sau đó chạy hàm `runMigrationsAndValidate` lên version mới để kiểm tra xem cấu trúc bảng và data có được bảo toàn chính xác hay không.
