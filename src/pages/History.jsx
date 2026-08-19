import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, StatusBadge, StatCard, EmptyState } from '../components/ui';
import { fmtMin, fmtDate, fmtDateVN, weekdayVN } from '../utils/helpers';

export default function History() {
  const { currentUser, db } = useApp();
  const [range, setRange] = useState('month');
  const [monthSel, setMonthSel] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const weeks = useMemo(() => {
    const arr = [];
    const d = new Date(`${monthSel}-01T00:00:00`);
    const y = d.getFullYear(), m = d.getMonth();
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    for (let i = 0; i < 6; i++) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        const dd = new Date(start);
        dd.setDate(start.getDate() + i * 7 + j);
        days.push(dd);
      }
      if (days.some((x) => x.getMonth() === m)) arr.push(days);
    }
    return arr;
  }, [monthSel]);

  const filtered = useMemo(() => {
    const list = db.attendance
      .filter((a) => a.userId === currentUser?.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    if (range === 'day') {
      const last7 = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = list.find((a) => a.date === k);
        last7.push({ date: k, rec: r || null, isToday: i === 0 });
      }
      return last7;
    }
    if (range === 'week') {
      return weeks.flat().map((d) => {
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = list.find((a) => a.date === k);
        return { date: k, rec: r || null };
      });
    }
    return list.filter((a) => a.date.startsWith(monthSel));
  }, [db, currentUser, range, weeks, monthSel]);

  const stats = useMemo(() => {
    const rows = (range === 'month' ? filtered : filtered.filter((f) => f.rec));
    const recs = range === 'month' ? filtered : filtered.map((f) => f.rec).filter(Boolean);
    const present = recs.filter((a) => a && a.status !== 'absent').length;
    const onTime = recs.filter((a) => a && a.status === 'on_time').length;
    const late = recs.filter((a) => a && a.status === 'late').length;
    const early = recs.filter((a) => a && a.status === 'early_leave').length;
    const ot = recs.reduce((s, a) => s + (a?.otHours || 0), 0);
    return { total: rows.length, present, onTime, late, early, ot };
  }, [filtered, range]);

  const isOff = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const monthOptions = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return arr;
  }, []);

  return (
    <div>
      <PageHead title="Lịch sử chấm công" sub={`Theo dõi chi tiết công của ${currentUser?.name}`} />

      <div className="seg-row">
        <div className="seg">
          {['day', 'week', 'month'].map((r) => (
            <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>
              {r === 'day' ? 'Theo ngày' : r === 'week' ? 'Theo tuần' : 'Theo tháng'}
            </button>
          ))}
        </div>
        {range === 'month' && (
          <select className="input small" value={monthSel} onChange={(e) => setMonthSel(e.target.value)}>
            {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      <div className="grid stats-4">
        <StatCard icon="🗓️" label="Tổng ngày (đã có dữ liệu)" value={stats.total} tone="indigo" />
        <StatCard icon="✅" label="Ngày công" value={stats.present} sub={`đúng giờ ${stats.onTime} lần`} tone="green" />
        <StatCard icon="⏰" label="Đi muộn" value={stats.late} sub="theo quy định grace period" tone="amber" />
        <StatCard icon="🏠" label="Về sớm" value={stats.early} sub={`tăng ca ${stats.ot}h`} tone="red" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ngày</th><th>Giờ vào</th><th>Giờ ra</th><th>Trạng thái</th><th>Ghi chú</th><th>Tăng ca</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ date, rec, isToday }) => (
                <tr key={date} className={isToday ? 'today-row' : ''}>
                  <td>
                    <b>{fmtDate(date)}</b>
                    <small className="d-block">{fmtDateVN(date)}</small>
                  </td>
                  <td>{rec?.checkIn != null ? fmtMin(rec.checkIn) : <span className="muted">—</span>}</td>
                  <td>{rec?.checkOut != null ? fmtMin(rec.checkOut) : <span className="muted">—</span>}</td>
                  <td>
                    {isOff(date) && !rec ? <StatusBadge status="absent" /> : rec ? <StatusBadge status={rec.status} /> : <span className="muted">Chưa có</span>}
                    {isOff(date) && !rec && <span className="muted small d-block">Cuối tuần</span>}
                    {isToday && rec && <span className="today-tag">Hôm nay</span>}
                  </td>
                  <td className="muted">{rec?.note || '—'}</td>
                  <td>{rec?.otHours ? `${rec.otHours}h` : <span className="muted">—</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6"><EmptyState icon="🗓️" text="Chưa có dữ liệu trong khoảng thời gian này" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
