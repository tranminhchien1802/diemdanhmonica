# Monica · Hệ thống chấm công thông minh

Ứng dụng web chấm công & quản lý nhân sự xây dựng bằng **ReactJS + Vite**, chạy hoàn toàn trên trình duyệt (dữ liệu lưu trên `localStorage`), sẵn sàng deploy lên **Vercel** dưới dạng static site.

## Bản mô tả ngắn

### 1. Ý tưởng
Xây dựng hệ thống chấm công & quản lý nhân sự chạy hoàn toàn trên web, giúp thay thế bảng chấm công giấy truyền thống. Nhân viên tự chấm công, tự đăng ký và theo dõi đơn từ; quản lý giám sát, phê duyệt và thống kê tập trung trên một nền tảng duy nhất.

### 2. Cách hoạt động
Nhân viên đăng nhập web → chấm công check-in/check-out bằng mã PIN 6 số và chọn ca làm việc → hệ thống tự ghi nhận giờ vào/ra, tính trạng thái (đúng giờ / đi muộn / về sớm). Đơn xin nghỉ, giải trình... gửi qua luồng phê duyệt Nhân viên → Trưởng phòng → HR. Admin cấu hình ca làm việc, chính sách chấm công và xuất báo cáo Excel/PDF.

### 3. Những gì đã làm
- 2 phân hệ đầy đủ: nhân viên (`/user`) và quản trị (`/admin`).
- Chấm công bằng PIN, lịch sử theo ngày/tuần/tháng, thống kê công trong tháng.
- Cổng đơn từ (nghỉ phép, giải trình, công tác) kèm luồng phê duyệt 3 cấp.
- Tra cứu bảng lương chi tiết theo tháng.
- Quản lý nhân sự, ca làm việc, chính sách chấm công (GPS, bán kính, OT...).
- Dashboard biểu đồ real-time, xuất báo cáo Excel/PDF, tài khoản demo đủ vai trò.
- Deploy tĩnh lên Vercel, chạy được ngay.

### 4. Những gì chưa làm
- Chưa có backend/database thật — dữ liệu hiện lưu trên `localStorage` trình duyệt nên mỗi máy một bộ dữ liệu, chỉ phù hợp demo.
- Chưa có định vị GPS thực tế khi chấm công, chưa tích hợp sinh trắc học khuôn mặt.
- Thông báo real-time (Telegram/Zalo/Email) chưa nối được dịch vụ thật.

### 5. Nếu có thêm thời gian
- Kết nối API + database (Node.js/Supabase/Firebase) để dữ liệu dùng chung, nhiều người dùng thực tế.
- Xác thực vị trí chấm công bằng GPS thật và nhận diện khuôn mặt.
- Bật thông báo qua Telegram/Zalo/Email, gửi cảnh báo tự động khi nhân viên quên chấm công.

## Tính năng

### Phân hệ nhân viên (`/user`)
- **Đăng ký tài khoản**: nhân viên tự đăng ký, tự tạo mã PIN 6 số trên trang đăng nhập.
- **Chấm công thông minh**: check-in / check-out bằng mã PIN 6 số, chọn ca làm việc.
- **Lịch sử cá nhân**: xem chi tiết theo ngày / tuần / tháng (giờ vào, giờ ra, trạng thái Đúng giờ / Đi muộn / Về sớm), thống kê tổng số công trong tháng.
- **Cổng dịch vụ nội bộ**: đơn xin nghỉ phép (có / không lương), giải trình quên chấm công, đi muộn / về sớm, công tác; theo dõi trạng thái phê duyệt trực quan.
- **Tra cứu bảng lương**: chi tiết lương cơ bản, phụ cấp, tăng ca, khấu trừ bảo hiểm / phạt theo tháng.

### Phân hệ quản trị & nhân sự (`/admin`)
- **Nhân sự & phân quyền**: quản lý hồ sơ tập trung, vai trò Super Admin / HR Manager / Trưởng phòng / Nhân viên, dữ liệu sinh trắc học (PIN, khuôn mặt, GPS ngoại lệ); **cấp lại mã PIN** cho nhân viên bằng nút 🔑.
- **Ca làm việc & lịch trình**: ca hành chính, ca gãy, ca xoay, ca đêm; quản lý ngày nghỉ tuần, grace period.
- **Chính sách chấm công**: tọa độ trung tâm, bán kính chấm công, khung giờ làm việc, thời gian ân hạn, quy tắc tính tăng ca (OT), cấu hình thông báo Telegram / Zalo OA / Email.
- **Phê duyệt đơn từ**: luồng cấp bậc Nhân viên → Trưởng phòng → HR; duyệt hàng loạt kèm ghi chú.
- **Tổng hợp công & báo cáo**: thống kê ngày công, tăng ca, vi phạm theo tháng; **xuất Excel / PDF**.
- **Dashboard quản lý**: biểu đồ thời gian thực (tỷ lệ đúng giờ, nhân viên nghỉ phép, chấm công theo phòng ban, đơn gần đây).
- **Thông báo real-time**: chuông thông báo khi có đơn mới cần duyệt / nhân viên chấm công.

## Tài khoản demo

| Vai trò          | Username | Mật khẩu  | PIN     |
|------------------|----------|-----------|---------|
| Super Admin      | admin    | admin123  | 123456  |
| HR Manager       | hr       | hr123     | 654321  |
| Trưởng phòng     | leader   | leader123 | 111222  |
| Nhân viên        | emp1     | emp123    | 333444  |
| Nhân viên        | emp2     | emp123    | 555666  |

Trang đăng nhập có sẵn nút **Đăng nhập nhanh demo** theo từng vai trò. Mã PIN được tạo khi **đăng ký tài khoản** và dùng để xác nhận check-in / check-out.

## Chạy local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build production vào dist/
npm run preview  # xem bản build
```

## Deploy lên Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Hoặc import repository vào [vercel.com](https://vercel.com) — framework tự phát hiện **Vite**, cấu hình SPA fallback đã có sẵn trong `vercel.json`.

---

## 🔒 Chấm công bảo mật (QR động + GPS + Selfie)

Phân hệ chống gian lận chấm công **3 lớp** dùng **Supabase** (PostgreSQL + Storage):

- **Lớp 1 — GPS**: client gửi toạ độ, **server (Supabase RPC) tự tính khoảng cách Haversine** và từ chối nếu ngoài bán kính.
- **Lớp 2 — QR động**: mã QR phát trên màn hình máy chấm công, tự đổi mỗi 45s, mỗi mã dùng đúng 1 lần — chụp màn hình gửi từ xa vô dụng.
- **Lớp 3 — Selfie + nhận diện khuôn mặt**: chụp ảnh trực tiếp, trích xuất đặc trưng khuôn mặt (face-api.js), so khớp với khuôn mặt đã đăng ký, ghi ảnh + toạ độ + thời gian vào audit.

Toàn bộ quyết định quan trọng (validate QR, tính bán kính, ghi nhận) đều nằm trong **hàm chạy trên server** (`record_checkin`) — client không thể tự làm giả.

### Route
| Route | Mô tả |
|-------|-------|
| `/secure` | Trang nhân viên: GPS → quét QR → selfie → check-in |
| `/secure-admin` | Admin: phát QR động, cấu hình toạ độ/bán kính, đăng ký khuôn mặt, xem audit |

### Setup Supabase (lần đầu, ~5 phút)
1. Tạo project tại [supabase.com](https://supabase.com) → mở **SQL Editor** → dán toàn bộ nội dung file **`supabase/setup.sql`** → Run.
2. Tạo **Storage bucket** tên `selfies` (Storage → New bucket).
3. Copy **Project URL** + **anon key** từ Settings → API, điền vào file `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Chạy `npm run dev` → mở `/secure-admin`:
   - Lấy toạ độ văn phòng (Google Maps → click chuột phải → copy lat/lng), nhập vào phần **Điểm chấm công** → Lưu.
   - Chọn nhân viên → tải ảnh khuôn mặt → **Đăng ký khuôn mặt**.
   - Bấm **Bắt đầu phát QR** — để màn hình này tại cửa chấm công.
5. Mở `/secure` trên điện thoại (cùng mạng) → chọn nhân viên → **Xác định vị trí** → quét QR → chụp selfie → check-in.

> 💡 GPS di động sai số 5–50m, nên đặt bán kính ≥ 100m. Để chống giả lập GPS mạnh hơn, xem mục "Cải thiện sau".

### Cải thiện sau (bản production thật)
- Tích hợp **Supabase Auth** thay cho chọn nhân viên thủ công.
- **Liveness detection** (nháy mắt/xoay đầu) chống ảnh tĩnh.
- Ràng buộc RLS thật theo `auth.uid()` thay vì `security definer`.
- Ký số dữ liệu (anti-tampering), chống giả lập GPS bằng IP check.

> Dữ liệu phân hệ demo chấm công thường được lưu trên `localStorage` của từng trình duyệt để demo. Với môi trường production thực tế, cần kết nối API/DB (Node.js, Firebase, Supabase...).