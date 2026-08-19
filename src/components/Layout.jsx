import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Avatar } from './ui';
import { roleLabels } from '../data/seed';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const I = {
  dash: ['M3 12l9-9 9 9', 'M5 10v10a1 1 0 001 1h4v-7h4v7h4a1 1 0 001-1V10'],
  clock: ['M12 22a10 10 0 110-20 10 10 0 010 20z', 'M12 6v6l4 2'],
  history: ['M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8', 'M3 3v5h5'],
  doc: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M8 13h8', 'M8 17h8', 'M8 9h2'],
  wallet: ['M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z', 'M16 11h4v2h-4a2 2 0 010-4', 'M16 11h.01'],
  users: ['M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2', 'M10 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 8h18', 'M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z', 'M3 12h18'],
  settings: ['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z'],
  check: ['M20 6L9 17l-5-5', 'M3 22h18'],
  report: ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M8 17h.01', 'M8 13h.01', 'M12 13h4', 'M12 17h4'],
  bell: ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'],
  home: ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10'],
  exit: ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  logout: ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
};

const adminNav = [
  { to: '/admin', label: 'Bảng điều khiển', icon: 'dash' },
  { to: '/admin/users', label: 'Nhân sự & Phân quyền', icon: 'users' },
  { to: '/admin/shifts', label: 'Ca làm việc & Lịch trình', icon: 'calendar' },
  { to: '/admin/approvals', label: 'Phê duyệt đơn từ', icon: 'check' },
  { to: '/admin/policy', label: 'Chính sách chấm công', icon: 'settings' },
  { to: '/admin/reports', label: 'Tổng hợp công & Báo cáo', icon: 'report' },
];

const userNav = [
  { to: '/user', label: 'Chấm công', icon: 'clock' },
  { to: '/user/history', label: 'Lịch sử chấm công', icon: 'history' },
  { to: '/user/requests', label: 'Cổng dịch vụ nội bộ', icon: 'doc' },
  { to: '/user/payslip', label: 'Bảng lương', icon: 'wallet' },
];

export default function Layout({ mode }) {
  const { currentUser, logout, db, markAllRead } = useApp();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const nav = mode === 'admin' ? adminNav : userNav;
  const unread = db.notifications.filter((n) => !n.read).length;

  const goHome = () => navigate(mode === 'admin' ? '/admin' : '/user');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand" onClick={goHome}>
          <div className="brand-logo"><Icon d={I.clock} /></div>
          <div>
            <b>Monica</b>
            <span>{mode === 'admin' ? 'Quản trị & Nhân sự' : 'Nhân viên'}</span>
          </div>
        </div>
        <nav className="nav">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon d={I[n.icon]} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        {['super_admin', 'hr', 'leader'].includes(currentUser?.role) && (
          <button className="nav-item switcher" onClick={() => navigate(mode === 'admin' ? '/user' : '/admin')}>
            <Icon d={mode === 'admin' ? I.home : I.dash} />
            <span>{mode === 'admin' ? 'Phân hệ nhân viên' : 'Phân hệ quản trị'}</span>
          </button>
        )}
        <button className="nav-item logout" onClick={handleLogout}>
          <Icon d={I.logout} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)}>
            <Icon d={['M3 6h18', 'M3 12h18', 'M3 18h18']} />
          </button>
          <div className="topbar-title">
            {mode === 'admin' ? 'Hệ thống chấm công · Quản trị' : 'Hệ thống chấm công Monica'}
          </div>
          <div className="topbar-right">
            <div className="bell-wrap">
              <button className="icon-btn" onClick={() => { setBellOpen((v) => !v); }}>
                <Icon d={I.bell} />
                {unread > 0 && <span className="bell-dot">{unread}</span>}
              </button>
              {bellOpen && (
                <div className="bell-panel">
                  <div className="bell-head">
                    <b>Thông báo</b>
                    <button className="link-btn" onClick={markAllRead}>Đã đọc tất cả</button>
                  </div>
                  {db.notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className={`bell-item ${n.read ? '' : 'unread'}`}>
                      <span className={`bell-type t-${n.type}`}>{n.type === 'request' ? 'Đơn từ' : 'Chấm công'}</span>
                      <p>{n.message}</p>
                      <small>{new Date(n.createdAt).toLocaleString('vi-VN')}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="user-chip" onClick={() => navigate(mode === 'admin' ? '/admin/users' : '/user')}>
              <Avatar user={currentUser} size={34} />
              <span className="user-chip-info">
                <b>{currentUser?.name}</b>
                <small>{roleLabels[currentUser?.role]}</small>
              </span>
            </button>
          </div>
        </header>
        <div className={`mobile-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
