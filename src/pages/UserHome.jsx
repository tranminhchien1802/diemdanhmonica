import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard, Badge, PageHead } from '../components/ui';
import { fmtMin, todayStr, fmtDateVN, fmtMoney } from '../utils/helpers';

export default function UserHome() {
  const { currentUser, db, checkIn, checkOut, toast } = useApp();
  const [clock, setClock] = useState(new Date());
  const [action, setAction] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [shiftId, setShiftId] = useState(db.shifts[0]?.id);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = todayStr();
  const rec = db.attendance.find((a) => a.userId === currentUser?.id && a.date === today);
  const checkedIn = rec?.checkIn != null;
  const checkedOut = rec?.checkOut != null;

  const monthStats = useMemo(() => {
    const mk = today.slice(0, 7);
    const list = db.attendance.filter((a) => a.userId === currentUser?.id && a.date.startsWith(mk));
    const present = list.filter((a) => a.status !== 'absent');
    const onTime = list.filter((a) => a.status === 'on_time').length;
    const late = list.filter((a) => a.status === 'late').length;
    const early = list.filter((a) => a.status === 'early_leave').length;
    const ot = list.reduce((s, a) => s + (a.otHours || 0), 0);
    const slips = db.payslips.filter((p) => p.userId === currentUser?.id);
    const latest = slips[0];
    return { present: present.length, onTime, late, early, ot, total: list.length, latest };
  }, [db, currentUser, today]);

  const confirm = (type) => {
    setAction(type);
    setShowPin(true);
    setPin('');
    setErr('');
  };

  const submitPin = () => {
    if (pin.length < 6) return;
    if (pin !== currentUser.pin) { setErr('Sai mã PIN!'); setPin(''); return; }
    setShowPin(false);
    const res = action === 'in' ? checkIn(currentUser.id, shiftId) : checkOut(currentUser.id);
    if (!res.ok) toast(res.message, 'error');
    else toast(action === 'in' ? `Check-in thành công lúc ${fmtMin(res.time)}` : `Check-out thành công lúc ${fmtMin(res.time)}`);
  };

  const timeStr = clock.toLocaleTimeString('vi-VN');
  const dateStr = clock.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div>
      <PageHead title={`Chào ${currentUser?.name?.split(' ').slice(-1)} 👋`} sub={dateStr} />

      <div className="grid user-hero">
        <div className="card hero-clock">
          <div className="clock-time">{timeStr}</div>
          <div className="clock-date">{dateStr}</div>
          <div className="clock-hint">Bấm nút bên dưới để chấm công</div>
          <div className="hero-actions">
            <button className="btn primary lg" disabled={checkedIn} onClick={() => confirm('in')}>
              ✓ Check-in
            </button>
            <button className="btn lg" disabled={!checkedIn || checkedOut} onClick={() => confirm('out')}>
              Check-out →
            </button>
          </div>
          <div className="hero-status">
            {!checkedIn && <Badge label="Chưa check-in hôm nay" color="amber" />}
            {checkedIn && !checkedOut && <Badge label={`Đang làm việc · vào lúc ${fmtMin(rec.checkIn)}`} color="green" />}
            {checkedIn && checkedOut && <Badge label={`Đã kết thúc ca · vào ${fmtMin(rec.checkIn)} / ra ${fmtMin(rec.checkOut)}`} color="blue" />}
          </div>
        </div>

        <div className="card shift-pick">
          <h3>Ca làm việc hôm nay</h3>
          <div className="shift-list">
            {db.shifts.map((s) => (
              <button key={s.id} className={`shift-opt ${shiftId === s.id ? 'sel' : ''}`} style={{ '--c': s.color }} onClick={() => setShiftId(s.id)}>
                <span className="shift-dot" />
                <div>
                  <b>{s.name}</b>
                  <small>{s.startTime} – {s.endTime} · nghỉ {s.breakMin}m</small>
                </div>
              </button>
            ))}
          </div>
          <p className="muted small">Chọn ca trước khi bấm check-in. Chấm công sử dụng định vị GPS quanh văn phòng.</p>
        </div>
      </div>

      <div className="grid stats-4">
        <StatCard icon="✅" label="Ngày công thực tế (tháng này)" value={`${monthStats.present} ngày`} sub={`trên ${monthStats.total} ngày làm việc`} tone="green" />
        <StatCard icon="⏰" label="Đi đúng giờ" value={monthStats.onTime} sub={`trễ ${monthStats.late} lần`} tone="indigo" />
        <StatCard icon="🕐" label="Tăng ca" value={`${monthStats.ot}h`} sub="tính theo quy định OT" tone="cyan" />
        <StatCard icon="💰" label="Lương tháng hiện tại" value={monthStats.latest ? fmtMoney(monthStats.latest.net) : '--'} sub={monthStats.latest?.month || 'chưa có bảng lương'} tone="violet" />
      </div>

      {showPin && (
        <div className="modal-overlay" onClick={() => setShowPin(false)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>Xác nhận {action === 'in' ? 'check-in' : 'check-out'}</h3><button className="icon-btn" onClick={() => setShowPin(false)}>✕</button></div>
            <div className="modal-body">
              <p className="muted center">Nhập mã PIN cá nhân 6 số</p>
              <div className={`pin-dots ${err ? 'shake' : ''}`}>
                {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < pin.length ? 'filled' : ''} />)}
              </div>
              {err && <div className="alert err">{err}</div>}
              <div className="pin-pad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((v, i) =>
                  v === '' ? <span key={i} /> : (
                    <button key={i} className="pin-key" onClick={() => v === '⌫' ? setPin(pin.slice(0, -1)) : setPin((pin + v).slice(0, 6))}>{v}</button>
                  )
                )}
              </div>
              <button className="btn primary block" disabled={pin.length < 6} onClick={submitPin}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
