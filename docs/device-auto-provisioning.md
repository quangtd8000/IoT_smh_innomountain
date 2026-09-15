# Thiết bị tự đăng ký — để hệ thống scale

Tài liệu này ghi **lý do** của cơ chế định danh + tự đăng ký thiết bị. Đọc trước
khi sửa `services/claim.py`, `services/device_registry.py`, `include/config.h`
hoặc `platformio.ini`.

---

## 1. Vấn đề trước đây

Mỗi board phải cấu hình tay hai thứ trong `platformio.ini`:

```ini
-DDEVICE_ID=3
-DDEVICE_UID=\"esp32-node-58332\"
```

rồi vào web tạo device với đúng UID đó. Hệ quả:

- Thêm node thứ N là N lần sửa file + N lần tạo device bằng tay.
- Quên một trong hai là dữ liệu rơi vào chỗ khác hoặc bị bỏ. Đã gặp thật: đổi
  `DEVICE_UID` mà quên `DEVICE_ID`, firmware publish song song hai topic nên
  backend vẫn đổ số liệu vào thiết bị cũ — trên web trông như "đổi mã không ăn".
- Firmware publish **hai topic cho cùng một bản tin**
  (`smart_home/<uid>/telemetry` và `home/<home_id>/device/<device_id>/telemetry`)
  nên mỗi số đo bị ghi vào DB **hai lần**.

## 2. Thiết kế hiện tại

### 2.1 Một mã duy nhất, suy từ phần cứng

`config.h` để `DEVICE_UID` rỗng; `net_mqtt.cpp` suy UID từ MAC của chip:

```
esp32-node-<3 byte cuối MAC>
```

Nạp **cùng một firmware** cho mọi board, không sửa `platformio.ini`. Mỗi bản tin
chỉ đi trên một topic: `smart_home/<uid>/{telemetry,state,status,command}`.
Muốn ghim UID cố định thì thêm `-DDEVICE_UID="..."` cho env đó.

### 2.2 Claim token — thiết bị tự vào đúng nhà

Vấn đề còn lại: backend phải biết UID lạ thuộc **ngôi nhà nào**. Không thể tin
`home_id` do thiết bị khai (ai cũng publish được).

Cách làm: token không trạng thái, `HMAC(JWT_SECRET, "home_id.expiry")`.

1. Web gọi `GET /api/homes/{id}/provision-config` (JWT owner/admin) → nhận
   `broker`, `user`, `pass_mqtt`, **`claim_token`** (sống 1 giờ).
2. Web gửi token xuống ESP32 qua BLE; ESP32 lưu vào NVS (`claim_token`).
3. Mỗi bản tin telemetry/state mang thêm `claim_token` + `node_type`.
4. Backend thấy UID lạ: `verify_claim_token` → có `home_id` → tự tạo device
   (`services/device_registry.py`), tự thêm 3 kênh công tắc nếu là relay.

Token sai/hết hạn thì bản tin bị bỏ và ghi cảnh báo như trước — không có đường
tự tạo thiết bị bừa.

### 2.3 Vì sao không dùng bảng DB cho token

Bảng token cần migration, cần job dọn rác, cần chống trùng khi có nhiều tiến
trình. HMAC không cần gì trong ba thứ đó và tự hết hạn. Đổi `JWT_SECRET` là
thu hồi toàn bộ token đang lưu hành.

### 2.4 Đăng ký trùng không còn là lỗi

Web vẫn `POST /api/homes/{id}/devices` sau khi ghép nối để đặt tên/phòng theo ý
người dùng. Bản tin đầu tiên có thể tới **trước** lệnh POST đó, nên endpoint này
nay là *create-or-adopt*: UID đã có trong cùng home → trả 200 và cập nhật
tên/phòng; UID thuộc home khác → vẫn 409. Nhờ vậy hai đường đăng ký không đánh
nhau, và người dùng không thấy lỗi "UID đã tồn tại".

## 3. Những chỗ dễ phá

- **`claim_token` phải nằm trong payload telemetry.** Xoá đi thì thiết bị mới
  không tự đăng ký được, log sẽ đầy `Device UID ... not found`.
- **`node_type` quyết định loại thiết bị.** Không có nó, backend suy từ trường
  `relays`; relay mà không gửi `relays` sẽ bị tạo thành `sensor`.
- **Đừng publish lại topic `home/<id>/device/<id>/...`.** Đó là nguồn ghi trùng
  hai lần vào `sensor_data`.
- **Buffer MQTT đã nâng lên 2048** (`net_mqtt.cpp`) vì payload cảm biến cộng
  `claim_token` vượt 1024. Hạ xuống sẽ làm bản tin dài bị cắt.
- **Token nằm trong NVS**, không nằm trong payload BLE sau khi lưu: đổi Wi-Fi
  lần sau mà web không gửi token mới thì firmware **giữ token cũ** (cố ý — nếu
  xoá oan thì node đang chạy tốt sẽ mất quyền tự đăng ký).
