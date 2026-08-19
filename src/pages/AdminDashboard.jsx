import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, StatCard, Badge, Avatar } from '../components/ui';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { todayStr, weekdayVN, monthKey } from '../utils/helpers';

export default function AdminDashboard() {
  const { db } = useApp();
  const today = todayStr();

  const todayRecs = useMemo(() => db.attendance.filter((a) => a.date === today), [db.attendance, today]);
  const activeUsers = db.users.filter((u) => u.status === 'active' && u.role !== 'super_admin');
  const checkedIn = todayRecs.length;
  const onTime = todayRecs.filter((a) => a.status === 'on_time').length;
  const late = todayRecs.filter((a) => a.status === 'late').length;
  const absentToday = activeUsers.length - checkedIn;

  const onLeave = useMemo(() => {
    const todayKey = new Date(today + 'T00:00:00');
    return db.requests.filter((r) => {
      if (r.status !== 'approved' || r.type !== 'nghi_phep') return false;
      const from = new Date(r.fromDate + 'T00:00:00');
      const to = new Date(r.toDate + 'T00:00:00');
      return from <= todayKey && todayKey <= to;
    }).length;
  }, [db.requests, today]);

  const pending = db.requests.filter((r) => r.status === 'pending').length;

  const weekData = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const recs = db.attendance.filter((a) => a.date === k);
      const present = recs.length;
      const onTimeC = recs.filter((a) => a.status === 'on_time').length;
      arr.push({ day: weekdayVN[d.getDay()], 'Chấm công': present, 'Đúng giờ': onTimeC });
    }
    return arr;
  }, [db.attendance]);

  const pieData = [
    { name: 'Đúng giờ', value: onTime, color: '#10b981' },
    { name: 'Đi muộn', value: late, color: '#f59e0b' },
    { name: 'Vắng mặt', value: Math.max(0, absentToday), color: '#9ca3af' },
  ];

  const monthMk = monthKey();
  const deptStats = useMemo(() => {
    const map = {};
    for (const u of db.users) {
      if (u.role === 'super_admin') continue;
      map[u.department] = map[u.department] || { total: 0, present: 0, late: 0 };
      map[u.department].total++;
    }
    for (const a of todayRecs) {
      const u = db.users.find((x) => x.id === a.userId);
      if (u && map[u.department]) {
        map[u.department].present++;
        if (a.status === 'late') map[u.department].late++;
      }
    }
    return Object.entries(map).map(([k, v]) => ({ dept: k.replace('Phòng ', ''), ...v }));
  }, [db.users, todayRecs]);

  const recentReq = [...db.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const typeLabel = {
    nghi_phep: 'Nghỉ phép', quen_cham_cong: 'Quên chấm công', di_muon_ve_som: 'Muộn/Sớm', cong_tac: 'Công tác',
  };

  return (
    <div>
      <PageHead title="Bảng điều khiển" sub="Tổng quan hoạt động chấm công theo thời gian thực" />

      <div className="grid stats-4">
        <StatCard icon="📌" label="Đã chấm công hôm nay" value={checkedIn} sub={`trên ${activeUsers.length} nhân viên`} tone="indigo" />
        <StatCard icon="⏰" label="Tỷ lệ đúng giờ" value={activeUsers.length ? `${Math.round((onTime / Math.max(1, checkedIn)) * 100)}%` : '--'} sub={`${onTime} đúng giờ / ${late} muộn`} tone="green" />
        <StatCard icon="🌴" label="Đang nghỉ phép" value={onLeave} sub="đơn đã duyệt" tone="cyan" />
        <StatCard icon="📝" label="Đơn chờ duyệt" value={pending} sub="cần xử lý ngay" tone="amber" />
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Chấm công 7 ngày gần nhất</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="Chấm công" stroke="#4f46e5" strokeWidth={2} fill="url(#gP)" />
              <Area type="monotone" dataKey="Đúng giờ" stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Tình hình hôm nay</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Chấm công theo phòng ban</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" name="Tổng NV" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              <Bar dataKey="present" name="Đã chấm" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="Muộn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-head-row">
            <h3>Đơn từ gần đây</h3>
          </div>
          <div className="mini-list">
            {recentReq.map((r) => {
              const u = db.users.find((x) => x.id === r.userId);
              return (
                <div key={r.id} className="mini-row">
                  <Avatar user={u} size={34} />
                  <div className="mini-main">
                    <b>{u?.name}</b>
                    <small>{typeLabel[r.type]}</small>
                  </div>
                  <Badge label={r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Đang chờ'} color={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'amber'} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
