export const pad = (n) => String(n).padStart(2, '0');

export const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => dateStr(new Date());

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const parseTime = (t) => {
  if (typeof t === 'number') return t;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
};

export const fmtMin = (m) => {
  if (m == null) return '--:--';
  let total = m;
  if (total < 0) total += 1440;
  const h = Math.floor(total / 60) % 24;
  const min = total % 60;
  return `${pad(h)}:${pad(min)}`;
};

export const fmtMoney = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, day] = String(d).split('-');
  return `${day}/${m}/${y}`;
};

export const weekdayVN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export const fmtDateVN = (d) => {
  if (!d) return '';
  const dt = new Date(String(d) + 'T00:00:00');
  return `${weekdayVN[dt.getDay()]}, ${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`;
};

export const fmtDateTime = (iso) => {
  if (!iso) return '--';
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const requestTypeLabel = {
  nghi_phep: 'Xin nghỉ phép',
  quen_cham_cong: 'Giải trình quên chấm công',
  di_muon_ve_som: 'Đi muộn / Về sớm',
  cong_tac: 'Đơn công tác',
};

export const requestTypeColor = {
  nghi_phep: '#8b5cf6',
  quen_cham_cong: '#f59e0b',
  di_muon_ve_som: '#ef4444',
  cong_tac: '#06b6d4',
};

export const statusLabel = {
  approved: 'Đã duyệt',
  pending: 'Đang chờ duyệt',
  rejected: 'Từ chối',
  on_time: 'Đúng giờ',
  late: 'Đi muộn',
  early_leave: 'Về sớm',
  absent: 'Vắng mặt',
  present: 'Đã chấm công',
  active: 'Hoạt động',
  inactive: 'Đã nghỉ',
};

export const statusColor = {
  approved: 'green',
  pending: 'amber',
  rejected: 'red',
  on_time: 'green',
  late: 'amber',
  early_leave: 'red',
  absent: 'gray',
  present: 'blue',
  active: 'green',
  inactive: 'gray',
};

export const shiftTypeColor = {
  'Hành chính': '#6366f1',
  'Ca gãy': '#f59e0b',
  'Ca đêm': '#8b5cf6',
  'Ca xoay': '#ec4899',
};
