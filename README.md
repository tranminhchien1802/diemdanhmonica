# Monica · Hệ thống chấm công thông minh

Ứng dụng web chấm công & quản lý nhân sự xây dựng bằng **ReactJS + Vite**, chạy hoàn toàn trên trình duyệt (dữ liệu lưu trên `localStorage`), sẵn sàng deploy lên **Vercel** dưới dạng static site.

## Tính năng

### Phân hệ nhân viên (`/user`)
- **Chấm công thông minh**: check-in / check-out bằng mã PIN 6 số, chọn ca làm việc.
- **Lịch sử cá nhân**: xem chi tiết theo ngày / tuần / tháng (giờ vào, giờ ra, trạng thái Đúng giờ / Đi muộn / Về sớm), thống kê tổng số công trong tháng.
- **Cổng dịch vụ nội bộ**: đơn xin nghỉ phép (có / không lương), giải trình quên chấm công, đi muộn / về sớm, công tác; theo dõi trạng thái phê duyệt trực quan.
- **Tra cứu bảng lương**: chi tiết lương cơ bản, phụ cấp, tăng ca, khấu trừ bảo hiểm / phạt theo tháng.

### Phân hệ quản trị & nhân sự (`/admin`)
- **Nhân sự & phân quyền**: quản lý hồ sơ tập trung, vai trò Super Admin / HR Manager / Trưởng phòng / Nhân viên, dữ liệu sinh trắc học (PIN, khuôn mặt, GPS ngoại lệ).
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

Trang đăng nhập có sẵn nút **Đăng nhập nhanh demo** theo từng vai trò. Tab **Chấm công PIN** cho phép check-in/check-out trực tiếp bằng mã PIN.

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

> Dữ liệu được lưu trên `localStorage` của từng trình duyệt để demo. Với môi trường production thực tế, cần kết nối API/DB (Node.js, Firebase, Supabase...).