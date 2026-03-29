# Retrofit

```kotlin
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class SmartRetryInterceptor(private val maxRetries: Int = 3) : Interceptor {
    
    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        var response: Response? = null
        var exception: Exception? = null
        var attempt = 0
        var delayMs = 1000L // Khởi tạo thời gian chờ ban đầu là 1s

        while (attempt < maxRetries) {
            try {
                // Thực hiện gọi API
                response = chain.proceed(request)
                
                // Nếu gọi thành công (2xx) HOẶC lỗi do Client (4xx) -> Trả về luôn, KHÔNG retry
                if (response.isSuccessful || response.code in 400..499) {
                    return response
                }
                
                // Nếu là lỗi Server (5xx), ta sẽ đóng response hiện tại để giải phóng tài nguyên trước khi thử lại
                response.close()
                println("[Interceptor] Lỗi Server HTTP ${response.code}. Chuẩn bị thử lại...")
                
            } catch (e: IOException) {
                // Bắt các lỗi về mạng (Timeout, UnknownHostException, v.v.)
                exception = e
                println("[Interceptor] Lỗi Mạng: ${e.message}. Chuẩn bị thử lại...")
            }

            attempt++
            
            // Nếu chưa vượt quá số lần retry, thực hiện chờ (Delay) rồi mới vòng lại
            if (attempt < maxRetries) {
                println("[Interceptor] Đang thử lại lần $attempt sau ${delayMs}ms...")
                try {
                    // Vì Interceptor chạy trên background thread của OkHttp, ta dùng Thread.sleep
                    Thread.sleep(delayMs)
                } catch (ie: InterruptedException) {
                    Thread.currentThread().interrupt()
                }
                delayMs *= 2 // Exponential backoff: x2 thời gian chờ cho lần sau
            }
        }

        // Nếu đã hết số lần thử mà vẫn thất bại, ném ra lỗi hoặc trả về response lỗi cuối cùng
        return response ?: throw exception ?: IOException("Unknown network error")
    }
}
```

```kotlin
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

// Khởi tạo Client
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(SmartRetryInterceptor(maxRetries = 3)) // Gắn Retry Interceptor
    // Cấu hình thêm timeout cơ bản
    .connectTimeout(15, TimeUnit.SECONDS)
    .readTimeout(15, TimeUnit.SECONDS)
    .build()
    
// Khởi tạo Retrofit
val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    // .addConverterFactory(GsonConverterFactory.create()) // Hoặc Moshi/Kotlinx Serialization
    .client(okHttpClient)
    .build()
```