import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  seedUsers, seedShifts, defaultPolicy, generateAttendance, seedRequests, generatePayslips, seedNotifications,
} from '../data/seed';
import { todayStr, monthKey } from '../utils/helpers';

const KEY = 'monica_db_v1';
const SESSION = 'monica_session_v1';

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
};

const freshDb = () => {
  const db = {
    users: seedUsers,
    shifts: seedShifts,
    policy: defaultPolicy,
    attendance: generateAttendance(seedUsers, seedShifts, defaultPolicy),
    requests: seedRequests,
    payslips: generatePayslips(seedUsers),
    notifications: seedNotifications,
  };
  db.attendance = dedupeAttendance(db);
  return db;
};

const dedupeAttendance = (db) => {
  const seen = new Set();
  return db.attendance.filter((a) => {
    const k = `${a.userId}_${a.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => {
    const existing = load();
    if (existing) return existing;
    return freshDb();
  });
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION));
    } catch { return null; }
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION, JSON.stringify(session));
    else localStorage.removeItem(SESSION);
  }, [session]);

  const toast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === session?.userId) || null,
    [db.users, session],
  );

  const updateDb = (fn) => setDb((prev) => fn(structuredClone(prev)));

  const login = (username, password) => {
    const user = db.users.find((u) => u.username === username && u.password === password);
    if (!user) return { ok: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
    setSession({ userId: user.id });
    toast(`Xin chào, ${user.name}!`);
    return { ok: true, user };
  };

  const loginByPin = (pin) => {
    const user = db.users.find((u) => u.pin === pin);
    if (!user) return { ok: false, message: 'Mã PIN không hợp lệ' };
    setSession({ userId: user.id });
    toast(`Xin chào, ${user.name}!`);
    return { ok: true, user };
  };

  const logout = () => setSession(null);

  const notify = (message, type = 'info') => {
    updateDb((d) => {
      d.notifications = [
        { id: `n_${Date.now()}`, message, type, createdAt: new Date().toISOString(), read: false },
        ...d.notifications,
      ];
      return d;
    });
  };

  const resetDb = () => {
    const d = freshDb();
    setDb(d);
    toast('Đã khôi phục dữ liệu demo', 'info');
  };

  const checkIn = (userId, shiftId) => {
    const d = todayStr();
    const rec = db.attendance.find((a) => a.userId === userId && a.date === d);
    if (rec?.checkIn != null) return { ok: false, message: 'Bạn đã check-in hôm nay rồi' };
    const shift = db.shifts.find((s) => s.id === shiftId) || db.shifts[0];
    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    const start = shift.startTime.split(':').reduce((a, b) => a * 60 + Number(b), 0);
    let status = 'on_time';
    let note = '';
    if (min > start + shift.graceLate) { status = 'late'; note = `Đi muộn ${min - start} phút`; }
    updateDb((d) => {
      const idx = d.attendance.findIndex((a) => a.userId === userId && a.date === todayStr());
      if (idx >= 0) d.attendance[idx].checkIn = min;
      else d.attendance.push({ id: `a_${userId}_${todayStr()}`, userId, date: todayStr(), shiftId: shift.id, checkIn: min, checkOut: null, status, note, method: 'pin', otHours: 0, gps: { lat: db.policy.officeLat, lng: db.policy.officeLng } });
      return d;
    });
    return { ok: true, status, time: min };
  };

  const checkOut = (userId) => {
    const d = todayStr();
    const rec = db.attendance.find((a) => a.userId === userId && a.date === d);
    if (!rec?.checkIn) return { ok: false, message: 'Chưa check-in hôm nay' };
    if (rec.checkOut != null) return { ok: false, message: 'Bạn đã check-out rồi' };
    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    updateDb((d) => {
      const idx = d.attendance.findIndex((a) => a.userId === userId && a.date === todayStr());
      if (idx >= 0) {
        d.attendance[idx].checkOut = min;
        const shift = d.shifts.find((s) => s.id === d.attendance[idx].shiftId) || d.shifts[0];
        const end = shift.endTime.split(':').reduce((a, b) => a * 60 + Number(b), 0);
        if (min < end - shift.graceEarly) {
          d.attendance[idx].status = 'early_leave';
          d.attendance[idx].note = `Về sớm ${end - min} phút`;
        }
      }
      return d;
    });
    return { ok: true, time: min };
  };

  const addRequest = (req) => {
    const r = {
      ...req,
      id: `r_${Date.now()}`,
      status: 'pending',
      leaderStatus: 'pending',
      hrStatus: 'pending',
      leaderNote: '',
      hrNote: '',
      createdAt: new Date().toISOString(),
    };
    updateDb((d) => { d.requests = [r, ...d.requests]; return d; });
    notify(`${req.userName} gửi đơn mới: ${req.typeLabel}. Cần phê duyệt.`, 'request');
    return r;
  };

  const approveRequest = (id, role, approve, note) => {
    updateDb((d) => {
      const r = d.requests.find((x) => x.id === id);
      if (!r) return d;
      if (role === 'leader') {
        r.leaderStatus = approve ? 'approved' : 'rejected';
        r.leaderNote = note || '';
        r.status = approve ? 'pending' : 'rejected';
      } else {
        r.hrStatus = approve ? 'approved' : 'rejected';
        r.hrNote = note || '';
        r.status = approve ? 'approved' : 'rejected';
      }
      if (r.status !== 'pending') {
        const u = d.users.find((x) => x.id === r.userId);
        notify(`Đơn "${r.typeLabel}" của ${u?.name || 'nhân viên'} đã được ${approve ? 'duyệt' : 'từ chối'}.`, 'request');
      }
      return d;
    });
  };

  const batchApprove = (ids, role) => {
    ids.forEach((id) => approveRequest(id, role, true, 'Duyệt hàng loạt'));
  };

  const saveUser = (user) => {
    if (user.id) {
      updateDb((d) => {
        const idx = d.users.findIndex((x) => x.id === user.id);
        if (idx >= 0) d.users[idx] = { ...d.users[idx], ...user };
        return d;
      });
    } else {
      const nu = { ...user, id: `u_${Date.now()}` };
      updateDb((d) => { d.users = [...d.users, nu]; return d; });
    }
  };

  const deleteUser = (id) => updateDb((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) }));

  const saveShift = (shift) => {
    if (shift.id) {
      updateDb((d) => {
        const idx = d.shifts.findIndex((x) => x.id === shift.id);
        if (idx >= 0) d.shifts[idx] = { ...d.shifts[idx], ...shift };
        return d;
      });
    } else {
      const ns = { ...shift, id: `s_${Date.now()}` };
      updateDb((d) => { d.shifts = [...d.shifts, ns]; return d; });
    }
  };

  const deleteShift = (id) => updateDb((d) => ({ ...d, shifts: d.shifts.filter((s) => s.id !== id) }));

  const savePolicy = (p) => updateDb((d) => ({ ...d, policy: { ...d.policy, ...p } }));

  const markAllRead = () => updateDb((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));

  const value = {
    db, session, currentUser, toasts,
    login, loginByPin, logout, resetDb, toast,
    checkIn, checkOut, addRequest, approveRequest, batchApprove,
    saveUser, deleteUser, saveShift, deleteShift, savePolicy,
    markAllRead, notify,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
