import { pad, dateStr, monthKey, parseTime } from '../utils/helpers';

export const roleLabels = {
  super_admin: 'Super Admin',
  hr: 'HR Manager',
  leader: 'Trưởng phòng',
  employee: 'Nhân viên',
};

export const seedUsers = [
  { id: 'u1', username: 'admin', password: 'admin123', pin: '123456', name: 'Minh Chiến', role: 'super_admin', department: 'Ban Giám đốc', position: 'Super Admin', phone: '0900000001', email: 'admin@monica.vn', salaryBase: 25000000, allowances: 3000000, status: 'active', managerId: null, avatar: null },
  { id: 'u2', username: 'hr', password: 'hr123', pin: '654321', name: 'Nguyễn Thị Hương', role: 'hr', department: 'Phòng Nhân sự', position: 'HR Manager', phone: '0900000002', email: 'huong@monica.vn', salaryBase: 18000000, allowances: 2000000, status: 'active', managerId: 'u1', avatar: null },
  { id: 'u3', username: 'leader', password: 'leader123', pin: '111222', name: 'Trần Văn Nam', role: 'leader', department: 'Phòng Kỹ thuật', position: 'Trưởng phòng Kỹ thuật', phone: '0900000003', email: 'nam@monica.vn', salaryBase: 15000000, allowances: 1500000, status: 'active', managerId: 'u1', avatar: null },
  { id: 'u4', username: 'emp1', password: 'emp123', pin: '333444', name: 'Lê Thị Mai', role: 'employee', department: 'Phòng Kỹ thuật', position: 'Kỹ sư phần mềm', phone: '0900000004', email: 'mai@monica.vn', salaryBase: 12000000, allowances: 1000000, status: 'active', managerId: 'u3', avatar: null },
  { id: 'u5', username: 'emp2', password: 'emp123', pin: '555666', name: 'Phạm Minh Tú', role: 'employee', department: 'Phòng Kinh doanh', position: 'Nhân viên kinh doanh', phone: '0900000005', email: 'tu@monica.vn', salaryBase: 10000000, allowances: 1000000, status: 'active', managerId: 'u3', avatar: null },
  { id: 'u6', username: 'emp3', password: 'emp123', pin: '777888', name: 'Hoàng Anh Quân', role: 'employee', department: 'Phòng Kế toán', position: 'Kế toán viên', phone: '0900000006', email: 'quan@monica.vn', salaryBase: 11000000, allowances: 800000, status: 'active', managerId: 'u1', avatar: null },
  { id: 'u7', username: 'emp4', password: 'emp123', pin: '999000', name: 'Vũ Thị Lan', role: 'employee', department: 'Phòng Nhân sự', position: 'Chuyên viên nhân sự', phone: '0900000007', email: 'lan@monica.vn', salaryBase: 11000000, allowances: 800000, status: 'active', managerId: 'u2', avatar: null },
  { id: 'u8', username: 'emp5', password: 'emp123', pin: '121212', name: 'Ngô Đình Khánh', role: 'employee', department: 'Phòng Kỹ thuật', position: 'Tester', phone: '0900000008', email: 'khanh@monica.vn', salaryBase: 9500000, allowances: 600000, status: 'active', managerId: 'u3', avatar: null },
];

export const seedShifts = [
  { id: 's1', name: 'Ca hành chính', type: 'Hành chính', startTime: '08:00', endTime: '17:30', graceLate: 10, graceEarly: 15, breakMin: 60, color: '#6366f1', offDays: [0, 6] },
  { id: 's2', name: 'Ca sáng', type: 'Ca gãy', startTime: '07:00', endTime: '11:30', graceLate: 5, graceEarly: 10, breakMin: 0, color: '#f59e0b', offDays: [0, 6] },
  { id: 's3', name: 'Ca chiều', type: 'Ca gãy', startTime: '13:30', endTime: '18:00', graceLate: 5, graceEarly: 10, breakMin: 0, color: '#10b981', offDays: [0, 6] },
  { id: 's4', name: 'Ca đêm', type: 'Ca đêm', startTime: '22:00', endTime: '06:00', graceLate: 10, graceEarly: 15, breakMin: 60, color: '#8b5cf6', offDays: [] },
  { id: 's5', name: 'Ca xoay', type: 'Ca xoay', startTime: '08:00', endTime: '20:00', graceLate: 10, graceEarly: 15, breakMin: 90, color: '#ec4899', offDays: [] },
];

export const defaultPolicy = {
  officeName: 'Văn phòng Monica',
  officeAddress: '123 Nguyễn Trãi, Quận 1, TP.HCM',
  officeLat: 10.7765,
  officeLng: 106.7009,
  radiusM: 200,
  workStart: '08:00',
  workEnd: '17:30',
  graceLate: 10,
  graceEarly: 15,
  otRate: 1.5,
  otRateWeekend: 2,
  otCap: 2,
  notifyTelegram: true,
  notifyZalo: false,
  notifyEmail: true,
  telegramBotToken: '',
  telegramChatId: '',
  zaloOaId: '',
  smtpEmail: '',
};

const rand = (min, max, seed) => {
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return min + Math.floor(r * (max - min + 1));
};

export function generateAttendance(users, shifts, policy) {
  const recs = [];
  const today = new Date();
  for (const u of users) {
    if (u.role === 'super_admin') continue;
    const shift = shifts.find((s) => s.id === (u.id === 'u5' ? 's2' : u.id === 'u3' ? 's1' : 's1')) || shifts[0];
    for (let day = 1; day <= today.getDate(); day++) {
      const d = new Date(today.getFullYear(), today.getMonth(), day);
      const dow = d.getDay();
      if (shift.offDays.includes(dow)) continue;
      const seed = u.id.charCodeAt(1) * 100 + day * 7;
      const r = rand(0, 9, seed);
      let checkIn = null, checkOut = null, status = 'absent', note = '', otHours = 0;
      if (r < 1) {
        status = 'absent';
      } else {
        const start = parseTime(shift.startTime);
        const end = parseTime(shift.endTime);
        checkIn = start + rand(-6, 25, seed + 1);
        checkOut = end + rand(-25, 20, seed + 2);
        if (checkOut < checkIn) checkOut += 540;
        const late = checkIn > start + shift.graceLate;
        const early = checkOut < end - shift.graceEarly;
        if (late && early) { status = 'late'; note = 'Đi muộn & về sớm'; }
        else if (late) { status = 'late'; note = `Đi muộn ${checkIn - start} phút`; }
        else if (early) { status = 'early_leave'; note = `Về sớm ${end - checkOut} phút`; }
        else status = 'on_time';
        if (r === 4 || r === 8) { otHours = rand(1, 2, seed + 3); }
      }
      recs.push({
        id: `a_${u.id}_${dateStr(d)}`,
        userId: u.id,
        date: dateStr(d),
        shiftId: shift.id,
        checkIn,
        checkOut,
        status,
        note,
        method: 'pin',
        otHours,
        gps: { lat: policy.officeLat + 0.0008, lng: policy.officeLng - 0.0006 },
      });
    }
  }
  return recs;
}

const dOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

export const seedRequests = [
  { id: 'r1', userId: 'u4', type: 'nghi_phep', paid: true, fromDate: dOffset(-6), toDate: dOffset(-6), reason: 'Nghỉ phép năm, khám sức khỏe định kỳ.', status: 'approved', leaderStatus: 'approved', hrStatus: 'approved', leaderNote: 'Đồng ý', hrNote: 'Đã duyệt', createdAt: new Date(Date.now() - 7 * 864e5).toISOString() },
  { id: 'r2', userId: 'u5', type: 'di_muon_ve_som', paid: false, fromDate: dOffset(-1), toDate: dOffset(-1), reason: 'Hẹn khám bệnh vào buổi sáng, đi muộn 1 tiếng.', status: 'pending', leaderStatus: 'pending', hrStatus: 'pending', leaderNote: '', hrNote: '', createdAt: new Date(Date.now() - 1 * 864e5).toISOString() },
  { id: 'r3', userId: 'u6', type: 'cong_tac', paid: false, fromDate: dOffset(2), toDate: dOffset(3), reason: 'Công tác gặp khách hàng tại Cần Thơ.', status: 'approved', leaderStatus: 'approved', hrStatus: 'approved', leaderNote: 'OK', hrNote: 'Chúc chuyến đi thành công', createdAt: new Date(Date.now() - 3 * 864e5).toISOString() },
  { id: 'r4', userId: 'u7', type: 'quen_cham_cong', paid: false, fromDate: dOffset(-2), toDate: dOffset(-2), reason: 'Quên chấm công buổi sáng ngày 12, thực tế đã có mặt từ 7h45.', status: 'pending', leaderStatus: 'approved', hrStatus: 'pending', leaderNote: 'Xác nhận đúng', hrNote: '', createdAt: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: 'r5', userId: 'u8', type: 'nghi_phep', paid: false, fromDate: dOffset(-3), toDate: dOffset(-3), reason: 'Nghỉ không lương việc gia đình.', status: 'rejected', leaderStatus: 'approved', hrStatus: 'rejected', leaderNote: 'Đồng ý', hrNote: 'Không đủ phép, vui lòng sắp xếp lại', createdAt: new Date(Date.now() - 4 * 864e5).toISOString() },
  { id: 'r6', userId: 'u4', type: 'cong_tac', paid: false, fromDate: dOffset(-4), toDate: dOffset(-4), reason: 'Đi gặp đối tác ký hợp đồng.', status: 'approved', leaderStatus: 'approved', hrStatus: 'approved', leaderNote: '', hrNote: '', createdAt: new Date(Date.now() - 5 * 864e5).toISOString() },
];

export function generatePayslips(users) {
  const slips = [];
  const now = new Date();
  for (const m of [0, 1]) {
    const dt = new Date(now.getFullYear(), now.getMonth() - m, 15);
    const mk = monthKey(dt);
    for (const u of users) {
      if (u.role === 'super_admin') continue;
      const otHours = u.id === 'u4' ? 12 : u.id === 'u8' ? 8 : 6;
      const otPay = Math.round((u.salaryBase / 26 / 8) * otHours * 1.5);
      const insurance = Math.round(u.salaryBase * 0.105);
      const penalty = u.id === 'u8' ? 200000 : 0;
      const bonus = u.id === 'u5' ? 1500000 : u.id === 'u3' ? 2000000 : 0;
      const net = u.salaryBase + u.allowances + otPay + bonus - insurance - penalty;
      slips.push({
        id: `p_${u.id}_${mk}`,
        userId: u.id,
        month: mk,
        baseSalary: u.salaryBase,
        allowances: u.allowances,
        otPay,
        bonus,
        insurance,
        penalty,
        net,
        generatedDate: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(15)}`,
      });
    }
  }
  return slips;
}

export const seedNotifications = [
  { id: 'n1', message: 'Phạm Minh Tú gửi đơn đi muộn/về sớm cần phê duyệt.', type: 'request', createdAt: new Date(Date.now() - 864e5).toISOString(), read: false },
  { id: 'n2', message: 'Vũ Thị Lan gửi đơn giải trình quên chấm công cần HR duyệt.', type: 'request', createdAt: new Date(Date.now() - 2 * 864e5).toISOString(), read: false },
  { id: 'n3', message: 'Lê Thị Mai đã chấm công thành công lúc 07:58.', type: 'checkin', createdAt: new Date().toISOString(), read: false },
];
