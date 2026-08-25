# Smart Home Web Frontend (React + Vite + TailwindCSS + Shadcn/UI)

Hệ thống giao diện Web điều khiển và giám sát Nhà Thông Minh (Smart Home), kết nối trực tiếp với Backend FastAPI và EMQX MQTT Broker theo đặc tả kỹ thuật `smart-home-backend-spec-v1.0`.

---

## 1. Công Nghệ Sử Dụng (Tech Stack)

- **Framework:** React 18 (TypeScript) + Vite 5
- **Giao diện & Styling:** TailwindCSS 3, Lucide React Icons, Shadcn/UI Patterns, Glassmorphism Dark Mode
- **Biểu đồ Cảm biến:** Recharts (AreaChart, LineChart)
- **Giao tiếp API:** Axios (Request/Response Interceptors, Auto Bearer Token, Dynamic BaseURL)
- **Quản lý Trạng thái:** React Context (`AuthContext`, `HomeContext`) với cơ chế tự động Polling đồng bộ thiết bị (5s/lần).

---

## 2. Tính Năng Chính Đã Hoàn Thiện

1. **Xác thực & Bảo mật (Auth):**
   - Đăng nhập, đăng ký tài khoản mới.
   - Quản lý JWT Bearer Token, tự động xử lý khi phiên hết hạn.
   - Tự động nhận diện vai trò trong nhà (`owner`, `admin`, `member`).

2. **Bảng Điều Khiển Tổng Quan (Dashboard):**
   - 4 Thẻ chỉ số tổng quan: Thiết bị Online, Công tắc đang bật, Số phòng, Số thành viên.
   - Cụm công tắc nhanh (Quick Relays) cho phép toggle tức thì các kênh đèn/thiết bị trong nhà.
   - Cụm đồng hồ & biểu đồ giám sát môi trường (Nhiệt độ, Độ ẩm, PM2.5, CO2).

3. **Quản Lý Phòng & Thiết Bị (Rooms & Devices):**
   - Lọc thiết bị theo từng phòng.
   - Tạo phòng mới, xóa phòng.
   - Đăng ký thiết bị phần cứng mới (`device_uid`, `device_type`, `room_id`).
   - Thêm & điều khiển từng kênh Relay trên thiết bị ESP32.
   - Gửi lệnh tùy biến (Custom MQTT Command) xuống phần cứng.

4. **Điều Khiển Hồng Ngoại (IR Remotes):**
   - Quản lý danh sách điều khiển ảo (TV, Điều hòa, Quạt, Thiết bị khác).
   - Giao diện Remote tương tác trực quan với các phím nguồn, tăng giảm âm lượng, chuyển kênh,...
   - Thêm mã lệnh IR (Protocol NEC, Sony, Address, Command Code, Raw timings).

5. **Phân Tích & Nhật Ký Cảm Biến (Analytics):**
   - Đồ thị biến thiên các thông số môi trường theo thời gian thực và lịch sử.
   - Bảng nhật ký chi tiết các bản ghi Telemetry.

6. **Cài Đặt & Phân Quyền (Settings):**
   - Đổi tên nhà, chuyển đổi giữa các ngôi nhà.
   - Quản lý danh sách thành viên, thêm thành viên và gán quyền (Admin / Member).
   - Xóa ngôi nhà (dành cho Owner).
   - Cấu hình trực tiếp địa chỉ Server API (`http://192.168.1.35:8000/api`).

---

## 3. Hướng Dẫn Khởi Động & Chạy Web

### Chế độ Development (Hot-reload)

```bash
cd /home/minh/smarthome-web
npm run dev
```

Truy cập trên trình duyệt: `http://localhost:3000` (hoặc `http://<IP-máy-bạn>:3000`).

### Chế độ Production Build

```bash
cd /home/minh/smarthome-web
npm run build
npm run preview
```
