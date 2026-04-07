# Launch Mode

## Task và Back Stack

Khi mở một ứng dụng, Android sẽ tạo ra một Task để chứa các Activity.

- Task:&#x20;

  - Về cơ bản, nó là một "vùng chứa" (container) bao gồm các Activity mà người dùng tương tác để hoàn thành một công việc nhất định. Mỗi Task tương ứng với một card trong màn hình đa nhiệm (Recent Apps)

  - Task khác App.&#x20;

    - Một app có thể có nhiều Task

    - Một Task có thế chứa activity từ nhiều app (deeplink, intent)
- Back Stack: Quản lí các Activity trong Task theo cấu trúc LIFO (Last In, First Out)

### Launch Mode

1. `standard` (Mặc định)

   Luôn tạo instance mới

2. `singleTop`

   Nếu Activity đang ở top -> reuse (gọi `onNewIntent()`)

   Nếu không thì tạo mới

3. `singleTask`

   Đảm bảo chỉ có một instance trong Task.&#x20;

   Nếu đã tồn tại thì clear tất cả activity phía trên nó và gọi `onNewIntent()`

4. `singleInstance`&#x20;

   Đảm bảo chỉ có 1 instance trong Task

   Nằm trong một Task riêng và đứng một mình&#x20;

5. `singleInstancePerTask`&#x20;

   Giống `singleInstance` nhưng có thể có nhiều task khác nhau chứa nó.

**Note**:&#x20;

1. `taskAffinity`

   Nếu chỉ khai báo launch mode là `singleInstance` hoặc `singleInstancePerTask` có thể là không đủ vì tất cả các Activity đều có chung một `taskAffinity` (là Application ID) nên nó sẽ vẫn chui vào Task hiện tại. Để nó thực sự tách ra Task mới thì cần định nghĩa một `taskAffinity` khác biệt trong file Manifest.

2. Intent Flags ghi đè Manifest

   FLAG\_ACTIVITY\_NEW\_TASK (kết hợp với `taskAffinity`). Nếu có sẵn một Task nào đó có `taskAffinity` như vậy thì nó sẽ nhé Activity vào Task đó, nếu không thì nó tạo Task mới

3. `allowTaskReparenting="true"`

   Giả sử Activity bị một App khác (ví dụ: Gmail) gọi lên. Tạm thời nó đang phải ở nhờ trong Task của Gmail.

   Nhưng nếu nó được set `allowTaskReparenting="true"`, thì ngay khi người dùng mở lại App gốc, Activity này sẽ lập tức "nhảy" từ Task của Gmail về lại Task của App gốc.
