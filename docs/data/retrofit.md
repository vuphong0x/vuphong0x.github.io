# Retrofit

### 1. Retroft là gì?

Về mặt định nghĩa, **Retrofit là một Type-safe HTTP client** dành cho Android và Java/Kotlin, được phát triển bởi Square.

Tuy nhiên, nhìn sâu hơn dưới góc độ kiến trúc, Retrofit thực chất là một **Abstraction Layer.**

- Nó biến một interface trong Java/Kotlin (chứa các annotation như `@GET`, `@POST`) thành một HTTP call hoàn chỉnh.

- *Under the hood*, Retrofit không tự thực hiện việc gọi mạng. Nó ủy quyền toàn bộ kết nối mạng thực tế (Network Layer) cho **OkHttp**.

- Nhiệm vụ chính của Retrofit là xử lý request routing, tự động hóa việc mapping dữ liệu (Serialization/Deserialization) thông qua các Converters (như Gson, Moshi, Kotlinx.serialization) và hỗ trợ tích hợp luồng bất đồng bộ (Coroutines, RxJava).

### 2. Triển khai

1. Định nghĩa API Interface

```kotlin
interface UserApiService {
    @GET("users/{id}")
    suspend fun getUserProfile(
        @Path("id") userId: String
    ): Response<UserDto> // Sử dụng suspend function của Coroutines
}
```

2: Khởi tạo với OkHttp và Converter (Thường đặt trong DI module như Hilt/Dagger)

```kotlin
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(HttpLoggingInterceptor().apply { level = Level.BODY })
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl("https://api.yourdomain.com/")
    .client(okHttpClient)
    .addConverterFactory(MoshiConverterFactory.create()) // Hoặc Gson/Kotlinx
    .build()

val apiService = retrofit.create(UserApiService::class.java)
```

### 3. Bảo mật Retrofit

**A. Bảo mật đường truyền (Transport Layer Security)**

- **Chỉ sử dụng HTTPS:** Mặc định từ Android 9 (API 28), cleartext traffic đã bị vô hiệu hóa. Phải đảm bảo toàn bộ endpoint là `https://`.

- **SSL/Certificate Pinning:** Đây là kỹ thuật quan trọng nhất để chống lại tấn công **Man-In-The-Middle (MITM)**. Kẻ tấn công có thể cài một chứng chỉ giả mạo vào máy người dùng để đọc lén data. Chúng ta chặn việc này bằng cách "gắn chặt" (pin) mã băm (hash) của public key từ server trực tiếp vào code.

  ```
  import okhttp3.CertificatePinner
  import okhttp3.OkHttpClient

  // Khởi tạo Certificate Pinner
  val certificatePinner = CertificatePinner.Builder()
      // Pin chính cho domain
      .add("api.yourdomain.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
      // Luôn cung cấp ít nhất 1 backup pin phòng trường hợp server đổi chứng chỉ đột xuất
      .add("api.yourdomain.com", "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=") 
      .build()

  // Gắn vào OkHttpClient
  val okHttpClient = OkHttpClient.Builder()
      .certificatePinner(certificatePinner)
      .build()
  ```

**B. Quản lý Authentication & Token an toàn**

- **Auth Interceptor:** Tự động đính kèm Bearer Token (lấy từ EncryptedSharedPreferences hoặc Keystore) vào header của mọi request.

  ```kotlin
  import okhttp3.Interceptor
  import okhttp3.Response

  class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
      override fun intercept(chain: Interceptor.Chain): Response {
          val originalRequest = chain.request()
          
          // Bỏ qua nếu request đã có header Authorization (ví dụ API login)
          if (originalRequest.header("Authorization") != null) {
              return chain.proceed(originalRequest)
          }

          val requestBuilder = originalRequest.newBuilder()
          tokenManager.getAccessToken()?.let { token ->
              requestBuilder.addHeader("Authorization", "Bearer $token")
          }
          
          return chain.proceed(requestBuilder.build())
      }
  }
  ```

- **Authenticator (Refresh Token mechanism):** Khi server trả về lỗi `401 Unauthorized` (Token hết hạn), `Authenticator` sẽ tự động chặn request đó lại, gọi một API âm thầm để lấy Token mới, lưu lại, và thực hiện lại (retry) request bị lỗi ban đầu mà user không hề hay biết.

  ```kotlin
  import okhttp3.Authenticator
  import okhttp3.Request
  import okhttp3.Response
  import okhttp3.Route

  class TokenAuthenticator(
      private val tokenManager: TokenManager,
      // Dùng Lazy (hoặc Provider trong Dagger/Hilt) để tránh lỗi Circular Dependency
      private val authApiService: dagger.Lazy<AuthApiService> 
  ) : Authenticator {

      override fun authenticate(route: Route?, response: Response): Request? {
          // Nếu chính request gọi refresh token cũng bị 401 -> Trả về null để tránh lặp vô hạn
          if (response.request.url.encodedPath.contains("/auth/refresh")) {
              return null
          }

          // Dùng block synchronized để đảm bảo nếu có nhiều API call cùng lúc bị 401,
          // thì chỉ có 1 thread thực hiện gọi hàm refresh token.
          synchronized(this) {
              // Lấy token mới nhất từ local để kiểm tra xem có thread nào vừa refresh chưa
              val currentToken = tokenManager.getAccessToken()
              val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")

              if (requestToken != null && requestToken != currentToken) {
                  // Token đã được refresh bởi 1 thread khác, chỉ cần gọi lại request với token mới
                  return response.request.newBuilder()
                      .header("Authorization", "Bearer $currentToken")
                      .build()
              }

              // Gọi API đồng bộ để lấy token mới (Authenticator chạy trên background thread)
              val newToken = fetchNewTokenSynchronously()
              
              return if (newToken != null) {
                  tokenManager.saveAccessToken(newToken)
                  response.request.newBuilder()
                      .header("Authorization", "Bearer $newToken")
                      .build()
              } else {
                  // Refresh token hết hạn hoặc lỗi -> Xóa data nội bộ và trigger hàm Logout đẩy user về màn hình đăng nhập
                  tokenManager.clearAll()
                  null
              }
          }
      }

      private fun fetchNewTokenSynchronously(): String? {
          // Thực thi cuộc gọi API lấy token mới bằng method .execute() thay vì enqueue()
          // ...
      }
  }
  ```

**C. Bảo mật Keys và Endpoints**

- **Không lưu API Key ở dạng plain text trong code:** Hacker dịch ngược (Decompile) APK có thể dễ dàng đọc được.

- Giải pháp: Lưu API Key trong file `local.properties` và móc nối qua `BuildConfig`, hoặc cao cấp hơn là đưa các key nhạy cảm xuống tầng C/C++ (NDK) để gây khó khăn tối đa cho việc dịch ngược.

- Sử dụng **R8/ProGuard** để obfuscate (làm rối mã nguồn) các interface của Retrofit và Data classes (lưu ý dùng `@Keep` hoặc quy tắc hợp lý để không làm hỏng Converter).

**D. Mã hóa Payload (Data Level Security)**

Nếu ứng dụng làm việc với dữ liệu cực kỳ nhạy cảm (Tài chính, Y tế), HTTPS là chưa đủ.

- Chúng ta cần mã hóa bất đối xứng/đối xứng chính phần Body của request trước khi đưa cho Retrofit (ví dụ: dùng AES-256 mã hóa chuỗi JSON, sau đó server giải mã). Có thể viết một custom `Interceptor` hoặc custom `Converter.Factory` để tự động hóa việc mã hóa/giải mã này ở tầng mạng.

```kotlin
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response

class EncryptionInterceptor(private val cryptoUtils: CryptoUtils) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // 1. Chỉ mã hóa những request có mang Body (như POST, PUT)
        if (originalRequest.method == "POST" && originalRequest.body != null) {
            
            val originalBodyString = extractBodyToString(originalRequest.body)
            
            // Mã hóa chuỗi JSON gốc thành một chuỗi bị mã hóa
            val encryptedString = cryptoUtils.encryptAES(originalBodyString)
            
            // Đóng gói lại thành RequestBody
            val encryptedBody = encryptedString.toRequestBody("text/plain; charset=utf-8".toMediaTypeOrNull())

            // Tạo request mới với body đã mã hóa
            val encryptedRequest = originalRequest.newBuilder()
                .method(originalRequest.method, encryptedBody)
                .build()

            return chain.proceed(encryptedRequest)
        }

        // Nếu là GET request, cứ đi tiếp bình thường
        return chain.proceed(originalRequest)
    }
    
    // Hàm phụ trợ để parse RequestBody thành String...
}
```
