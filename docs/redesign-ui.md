# Thiết kế lại giao diện — tài liệu bàn giao

Branch: `redesign-ui` · 5 commit từ `3f2f012` (baseline) tới `39cf3cc`
Máy chủ: `/home/inno/smarthome` · Cập nhật: 26/08/2026

Tài liệu này ghi **lý do**, không chỉ ghi cái gì đã đổi. Nhiều chỗ trong code
trông tuỳ tiện nhưng có nguyên nhân đo đạc được — mục
[Những chỗ dễ phá](#4-những-chỗ-dễ-phá-nếu-không-biết-lý-do) là phần quan
trọng nhất, đọc trước khi sửa bất cứ thứ gì.

> **`web/README.md` đã lạc hậu một phần.** Nó vẫn mô tả bản cũ. Xem
> [mục 9](#9-những-gì-trong-webreadmemd-đã-cũ) để biết chỗ nào không còn đúng.

---

## 1. Tóm tắt

Giao diện cũ mang những dấu hiệu điển hình của UI do AI sinh ra. Đo được
trong code trước khi sửa:

| Dấu hiệu | Trước | Sau |
|---|---|---|
| `rounded-2xl` / `rounded-3xl` | 47 / 14 | 0 |
| `glass-card` + `backdrop-blur` | 18 + 8 | 0 |
| `glow-*` + `shadow-lg shadow-<màu>` | 10 + 20 | 0 |
| `bg-gradient-to-*` | 14 | 0 |
| `font-mono` (dùng cho chữ thường) | 38 | 0 |
| icon `Sparkles` | 14 | 0 |
| `animate-ping` / `pulse` / `bounce` | 2 / 6 / 3 | 0 |
| Số sắc màu accent | 12 | 1 accent + 3 màu tín hiệu |

Kèm ngôn từ thổi phồng: *"IoT & AI Environment"*, *"Đang khởi tạo hệ sinh
thái nhà thông minh"*, *"Dữ liệu quang phổ NDIR, tán xạ laser và cảm biến
bán dẫn MOX"*, badge `PRO`, địa chỉ `EMQX 192.168.1.35:1883` hiển thị ngay
trên màn hình chính.

**Hướng thiết kế mới: "bảng điện trong nhà".** Giao diện cũ mặc cho ngôi nhà
bộ đồ của một phòng máy chủ — *node*, *hạ tầng*, *giao thức*, chấm nhấp nháy,
số hiệu port. Nhưng người dùng là gia đình, không phải quản trị hệ thống.
Chất liệu lấy từ thế giới của chính họ: công tắc ốp tường, nhãn cầu dao,
nhiệt kế treo tường.

Dashboard được sắp lại theo việc thực sự cần hàng ngày:
**không khí → công tắc → kịch bản → biểu đồ**. Trước đây công tắc — thứ
người ta mở app để bấm — nằm dưới màn hình đầu, sau lời chào và 4 thẻ chỉ số.

---

## 2. Cách chạy

**Máy chủ không cài node.** Mọi thao tác node đều chạy trong container.
Đừng cài node lên host, không cần thiết.

### Dev server (có hot-reload)

```bash
cd ~/smarthome/web
docker run -d --name vite-dev \
  --network emqx_default \
  -v "$PWD":/app -w /app \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e VITE_DEV_API_TARGET=http://smarthome-backend:8000 \
  -p 5173:5173 node:20-alpine \
  sh -c "npm install && npm run dev -- --host 0.0.0.0 --port 5173"
```

Phải `--network emqx_default` thì proxy `/api` mới tới được backend.

Xem từ máy khác (chạy trên máy bạn, không phải máy chủ):

```bash
ssh -N -L 5173:localhost:5173 iot
# rồi mở http://localhost:5173
```

### Kiểm tra kiểu

```bash
cd ~/smarthome/web
docker run --rm -v "$PWD":/app -w /app \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  node:20-alpine npx tsc --noEmit
```

Mất khoảng 2 phút. **Vite dev không kiểm tra kiểu** (esbuild bỏ qua type),
nên phải chạy `tsc` riêng trước khi commit.

### Triển khai

```bash
cd ~/smarthome
docker compose up -d --build frontend   # khoảng 10 phút
docker compose up -d --build backend    # nhanh hơn
```

Frontend build lâu vì `.dockerignore` loại `node_modules`, nên `npm ci` tải
lại toàn bộ gói bên trong image. Đó là chủ ý — xem mục 4.

Sau khi triển khai, web ở cổng 80 và 3000 của máy chủ.

### Xem bản đã triển khai từ máy khác

```bash
ssh -N -L 8080:localhost:80 iot
# rồi mở http://localhost:8080
```

Muốn điện thoại cùng wifi với **máy bạn** xem được:

```bash
ssh -N -L 0.0.0.0:8081:localhost:80 iot
sudo ufw allow 8081/tcp        # nếu máy bạn bật ufw
# điện thoại mở http://<IP-máy-bạn>:8081
```

---

## 3. Hệ thiết kế

### Màu — quy tắc: chỉ dùng khi mang nghĩa

Định nghĩa trong `web/src/index.css`, map sang Tailwind trong
`web/tailwind.config.js`.

| Token | Sáng | Tối | Nghĩa |
|---|---|---|---|
| `--ground` | `#F2F3F0` | `#141614` | nền trang |
| `--surface` | `#FFFFFF` | `#1D201D` | mặt bảng, thẻ |
| `--sunken` | `#E7E9E4` | `#101210` | vùng lõm, nền phím |
| `--ink` | `#17191A` | `#EDEFEA` | chữ chính |
| `--ink-2` | `#5E6663` | `#9AA29B` | chữ phụ |
| `--line` | `#DDE1DC` | `#2C302C` | đường kẻ, viền |
| `--live` | `#C8811F` | `#E0A44A` | **chỉ dùng cho tải đang bật** |
| `--tone` | theo phòng | theo phòng | danh tính phòng, xem `lib/roomTone.ts` |

Thang chất lượng không khí: `--air-good` `--air-ok` `--air-bad`.

Trạng thái thiết bị (online/offline) **cố ý không dùng màu** — dùng chữ và
một chấm mực. Giữ bảng màu kỷ luật; chữ đã nói rõ nghĩa rồi.

### Chữ

- Display: **Bricolage Grotesque Variable** — wordmark, tiêu đề, số đo lớn
- Body/UI: **Be Vietnam Pro** — do xưởng chữ Việt làm cho tiếng Việt
- **Không dùng monospace.** Số đo dùng `.tnum` (tabular-nums)

Nhúng qua `@fontsource`, **không dùng Google Fonts CDN**. Thiết bị chạy
trong LAN có thể không ra được internet; bản cũ dùng CDN nên chữ sẽ âm thầm
rơi về font hệ thống. Đã kiểm chứng: `dist/assets` có sẵn các file `.woff2`,
CSS không gọi ra `googleapis`/`gstatic`.

Cả hai font đều có subset `vietnamese`. Đã kiểm tra trước khi chọn.

### Class dùng chung (`index.css`)

- `.plate` — mặt bảng phẳng có viền
- `.plate--toned` / `.plate__head` — phủ màu tone của phòng, rất nhạt (6% / 10%)
- `.gat` / `.gat__knob` — công tắc gạt
- `.switch-row` — hàng chứa công tắc, mang `data-on`

### Bảng màu biểu đồ — PHẢI chạy validator khi đổi

`web/src/lib/chartColors.ts`. Bốn màu đã qua 5 kiểm tra ở cả hai chế độ:
dải độ sáng, ngưỡng chroma, tách biệt với người mù màu (ΔE ≥ 8), ngưỡng
phân biệt với mắt thường (ΔE ≥ 15), tương phản với nền (≥ 3:1).

**Đừng chỉnh bằng mắt.** Bảng màu trước đó trông ổn nhưng trượt: ba màu dưới
ngưỡng chroma (đọc ra thành xám) và cặp tím↔cam chỉ ΔE 14,2 ở nền tối —
người mắt bình thường cũng khó phân biệt.

```bash
node scripts/validate_palette.js "#00897B,#C1591F,#8A4B9E,#6F8A16" --mode light
node scripts/validate_palette.js "#0F9C88,#C4682F,#9C5FAE,#7C9128" --mode dark
```

---

## 4. Những chỗ dễ phá nếu không biết lý do

Đây là mục quan trọng nhất của tài liệu này.

### 4.1 `OFFSET 0` trong endpoint aggregate — đừng xoá

`backend/app/routers/telemetry.py`, hàm `get_telemetry_aggregate`.

Trông như code thừa. Thực ra nó là **rào vật chất hoá**: nó ngăn Postgres gộp
phẳng subquery, nhờ đó chỉ mang 6 cột cần thiết vào bước gộp thay vì kéo cả
dòng rộng 407 byte (cột `extra_metrics` JSONB).

Đo A/B xen kẽ qua **đúng đường code này** (trích câu SQL từ router rồi chạy),
42.700 dòng, khoảng 6 giờ:

| | Lần 1 | Lần 2 | Lần 3 | Trung bình |
|---|---|---|---|---|
| Không có `OFFSET 0` | 5575 ms | 3098 ms | 2370 ms | **3681 ms** |
| Có `OFFSET 0` | 3371 ms | 2116 ms | 2169 ms | **2552 ms** |

Nhanh hơn khoảng **30%**. Biên độ dao động lớn — máy này không mạnh.

> **Hai bẫy khi đo, cả hai tôi đều đã mắc:**
>
> 1. **Bộ đệm nguội.** Lần chạy đầu mất tới 5,6 giây. Đo một lần rồi kết luận
>    thì dễ quy sai công cho thay đổi vừa làm. Phải chạy xen kẽ A/B nhiều lần.
> 2. **Truy vấn rút gọn không đại diện.** Lần đầu tôi đo bằng
>    `SELECT count(*) FROM (...)` với ít cột hơn, ra ~700-900 ms và tưởng đó
>    là thời gian thật. Postgres tối ưu câu đó khác hẳn câu đầy đủ có 6 hàm
>    `avg()` và 2 lần trích JSONB. **Luôn đo bằng chính câu SQL sẽ chạy.**

### 4.2 Ô thời gian không được hẹp hơn 60 giây

`web/src/lib/telemetry.ts`, trường `bucketSeconds` trong mảng `RANGES`.

Hiện không có hằng nào ép buộc điều này — cả ba khoảng đều đặt tay ở 60s hoặc
300s. Thêm khoảng mới thì phải tự nhớ giữ `bucketSeconds >= 60`.

Nhãn trục x là `HH:MM`. Ô hẹp hơn một phút khiến hai ô liền nhau mang **cùng
một nhãn** — trục biến thành một dãy dài lặp lại cùng giờ phút. Đây đúng là
lỗi đã được báo và sửa; đừng tạo lại bằng cách tăng số ô lên.

### 4.3 `VITE_API_URL=/api` — đừng ghi cứng IP trở lại

`web/.env`.

`nginx.conf` đã proxy `/api` sang backend, nên đường dẫn tương đối làm web
chạy được từ **bất kỳ địa chỉ nào**: IP LAN, IP public, SSH tunnel, localhost.
Bản cũ ghi cứng `http://192.168.1.35:8000/api` nên chỉ máy cùng dải mạng mới
dùng được.

Đã kiểm chứng qua ba origin khác nhau. Ghi cứng IP trở lại sẽ phá mọi đường
truy cập trừ LAN.

Giá trị dự phòng trong `web/src/api/client.ts` cũng là `/api` — giữ nguyên.

### 4.4 `matchesAny` khớp theo từ trọn vẹn, không phải chuỗi con

`web/src/lib/text.ts`.

Khớp chuỗi con thì `"den"` sẽ ăn nhầm vào `"Garden Socket"`, và `"ngu"` ăn
nhầm vào `"Phòng Nguyên"`. Đã có test 8 trường hợp xác nhận điều này.

### 4.5 Trạng thái công tắc báo bằng VỊ TRÍ, không phải màu

`web/src/components/dashboard/SwitchPlate.tsx` + `.gat` trong `index.css`.

Đây là điều kiện khiến tone màu theo phòng trở nên an toàn. Phím bấm cũ báo
bật/tắt **bằng màu**, nên thêm màu theo phòng sẽ khiến không ai biết phím nào
đang bật. Công tắc gạt báo bằng vị trí núm, nên màu được rảnh tay mang danh
tính phòng.

Nếu đổi công tắc gạt về dạng chỉ đổi màu, **phải bỏ tone màu theo phòng cùng lúc**.

### 4.6 `.dockerignore` phải loại `node_modules`

`web/.dockerignore`.

Dockerfile chạy `npm ci` rồi mới `COPY . .`. Nếu context chứa `node_modules`
thì bước copy đè lên thư mục vừa cài, và kéo thêm 150 MB vào build context.

Đây là lý do build lâu (~10 phút). Đó là đánh đổi có chủ ý: chậm nhưng
sạch và tái lập được.

### 4.7 Quyền sở hữu file khi chạy container

Luôn dùng `--user "$(id -u):$(id -g)" -e HOME=/tmp` khi chạy container node
trên thư mục mount. Bỏ đi thì `node_modules` và `dist` thuộc `root`, và lần
sau chạy dưới quyền `inno` sẽ lỗi `EACCES`. Đã gặp hai lần.

---

## 5. Lỗi đã sửa

### Kịch bản "Đi ngủ" không tắt được đèn

**Nguyên nhân gốc:** kịch bản suy loại thiết bị từ tên tự do của kênh bằng
từ khoá tiếng Việt cứng — `ch.name.toLowerCase().includes('đèn')`. Nhưng kênh
duy nhất trong database tên là `Ceiling Light`, tiếng Anh. Điều kiện không
khớp nên không có gì bị tắt. **Không phải lỗi giao diện** — giao diện phản
ánh đúng: chẳng có gì thay đổi cả. Nút thì vẫn báo "đã tắt 0 đèn".

**Sửa:** khớp trên tên đã bỏ dấu, từ khoá cả hai thứ tiếng, khớp theo từ
trọn vẹn. Khi không nhận ra kênh nào, kịch bản nói thẳng thay vì báo "0 đèn".

**Bỏ fallback `ch.channel === 2`** của kịch bản "Lọc không khí" — nó bật đại
bất cứ thứ gì cắm ở kênh 2, kể cả bình nóng lạnh.

### Bốn lỗi có sẵn trong code

| File | Lỗi |
|---|---|
| `ui/Switch.tsx` | `bg-slate-750` — màu này không tồn tại trong bảng Tailwind |
| `ui/Modal.tsx` | Dùng `animate-in fade-in zoom-in-95` nhưng `tailwindcss-animate` không có trong `plugins` → các lớp này vô hiệu từ trước tới nay |
| `ui/Modal.tsx` | Không có focus trap, không trả focus về nút đã mở |
| `dashboard/AirQualityGauge.tsx` | `pm25 && pm25 < 25` báo "Có bụi" khi PM2.5 **đúng bằng 0** — tức không khí sạch tuyệt đối lại bị báo bẩn. Cùng lỗi ở CO₂ và VOC |

---

## 6. Những chỗ giả đã gỡ bỏ

Ghi lại để không ai tưởng là tính năng bị mất rồi thêm lại.

**Tab "Quét mã QR"** trong Thêm thiết bị **không đọc camera và không giải mã
gì cả**. Nó chờ 1,2 giây rồi điền cứng `esp32-node-58332`. Có hiệu ứng vạch
quét chạy, và đó là **tab mặc định**. Đã chuyển thành liên kết "Điền thiết bị
mẫu" — giữ tiện ích, bỏ nhãn sai sự thật.

**"Chipset I2C: SHT31 / SCD41 / SGP41"** trên thẻ thiết bị là hardcode, hiện
y hệt cho mọi thiết bị được đoán là cảm biến qua `device_uid.includes('58332')`.

**`m.user?.email || 'user@smarthome.local'`** — bịa ra email giả khi backend
không trả về.

**Chấm xanh nhấp nháy "IR Ready"** không kiểm tra gì; `cmd.protocol || 'NEC'`
gán bừa giao thức khi không biết.

**`QuickRelays.tsx`** (206 dòng) đã xoá — thay bằng `SwitchPlate`.

---

## 7. Backend: endpoint gộp telemetry

```
GET /api/devices/{id}/telemetry/aggregate
    ?bucket_seconds=60&start_time=...&max_points=500
```

`backend/app/routers/telemetry.py` · schema `TelemetryBucket` trong
`backend/app/schemas/telemetry.py`

**Vì sao cần:** endpoint `/telemetry` thô bị chặn ở 1000 bản ghi. Cảm biến
gửi khoảng **0,48 giây một lần** (không phải 3,7 giây — con số đó là trung
bình bị kéo lệch bởi một khoảng chết 3,7 ngày). Nên 1000 bản ghi chỉ phủ
**~8 phút**, không thể vẽ biểu đồ 1 giờ hay 6 giờ.

Đã kiểm chứng với database thật:

| Khoảng | Số mốc trả về | Phủ thật | Bản ghi thô gộp lại |
|---|---|---|---|
| 15 phút | 16 | 15 phút | 1.720 |
| 1 giờ | 61 | 60 phút | 7.109 |
| 6 giờ | 73 | 360 phút | 42.743 |

Chi tiết kỹ thuật:
- Điều kiện `WHERE` dùng cột trần, không bọc trong hàm, để còn dùng được chỉ
  mục `idx_sensor_data_device_timestamp` có sẵn
- `jsonb_typeof` trước khi ép kiểu, để không vỡ nếu `extra_metrics` chứa giá
  trị không phải số
- Lấy `max_points` ô **mới nhất** (order desc + limit) rồi đảo lại cho tăng dần

---

## 8. Giới hạn còn lại và việc nên làm tiếp

**Kịch bản vẫn đoán loại thiết bị từ tên tự do.** Cách bền vững là thêm
trường phân loại cho `relay_channels` (đèn / quạt / ổ cắm / khác) thay vì suy
từ tên người dùng tự gõ. Cần đổi schema + migration + UI để đặt.

**Biểu đồ 6 giờ mất ~2,1–3,4 giây** (đo qua đúng đường code, nhiều lần).
15 phút mất ~0,2–0,6 s, 1 giờ ~0,6–0,8 s. Chi phí nằm ở việc đọc 42.700
dòng. Muốn nhanh và ổn định hơn cần bảng gộp sẵn cập nhật theo giờ.

**Web chạy HTTP thuần.** Mật khẩu đăng nhập đi qua mạng ở dạng chữ rõ.

**Backend chưa giới hạn số lần thử đăng nhập.** Cần trước khi mở ra internet.

**`js` bundle 694 kB** (203 kB gzip) — cảnh báo có sẵn từ trước, chủ yếu do
recharts. Chưa tách chunk.

**Chưa kiểm được trên thiết bị thật:** bố cục điện thoại, mặt công tắc gạt
với relay thật, tone màu theo phòng với nhiều phòng.

---

## 9. Những gì trong `web/README.md` đã cũ

File đó vẫn giữ nguyên, không bị sửa. Nhưng các mục sau không còn đúng:

| Trong README | Thực tế bây giờ |
|---|---|
| "Glassmorphism Dark Mode" | Đã bỏ hoàn toàn. Có hệ token sáng/tối, chọn được trong Cài đặt |
| "4 Thẻ chỉ số tổng quan" | Gộp thành một dòng trạng thái mảnh |
| "Cụm công tắc nhanh (Quick Relays)" | Thay bằng `SwitchPlate` — mặt công tắc gạt nhóm theo phòng |
| "Recharts (AreaChart, LineChart)" | Chỉ còn LineChart, mỗi chỉ số một thang y riêng |
| "Cấu hình địa chỉ Server API" ở Settings | Đã chuyển sang trang Đăng nhập; giá trị mặc định là `/api` |
| `cd /home/minh/smarthome-web` | Đường dẫn thật: `/home/inno/smarthome/web` |
| `npm run dev` chạy trực tiếp | Máy chủ không cài node, phải chạy trong container — xem mục 2 |
| Truy cập `http://localhost:3000` | Dev server ở cổng 5173; cổng 3000 là bản đã triển khai |

---

## 10. Lịch sử commit

| Commit | Nội dung |
|---|---|
| `3f2f012` | baseline — bản gốc trước khi sửa |
| `15348fd` | Nền tảng thiết kế + Dashboard: hệ token, chữ, UI primitives, khung ứng dụng |
| `793287e` | Công tắc gạt + tone màu theo phòng |
| `ee17ddf` | Sửa kịch bản "Đi ngủ" + áp ngôn ngữ thiết kế cho toàn bộ trang còn lại |
| `57c7662` | Tách biểu đồ theo từng chỉ số; sửa thang thời gian; bỏ địa chỉ máy chủ khỏi Cài đặt |
| `39cf3cc` | Gộp telemetry trong SQL; đường dẫn API tương đối; Dockerfile nhiều tầng; triển khai |

Muốn về nguyên trạng: `git checkout main`
