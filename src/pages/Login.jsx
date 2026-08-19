import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { roleLabels } from '../data/seed';

export default function Login() {
  const { login, loginByPin, currentUser, db, toast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('account');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (currentUser) navigate(currentUser.role === 'employee' ? '/user' : '/admin');
  }, [currentUser]);

  const doAccount = (e) => {
    e.preventDefault();
    setErr('');
    const res = login(username.trim(), password);
    if (!res.ok) setErr(res.message);
    else navigate(res.user.role === 'employee' ? '/user' : '/admin');
  };

  const pressPin = (v) => {
    if (err) setErr('');
    const next = (pin + v).slice(0, 6);
    setPin(next);
    if (next.length === 6) {
      const res = loginByPin(next);
      if (res.ok) navigate(res.user.role === 'employee' ? '/user' : '/admin');
      else { setErr(res.message); setTimeout(() => setPin(''), 300); }
    }
  };

  const quick = (user) => {
    const res = login(user.username, user.password);
    if (res.ok) navigate(res.user.role === 'employee' ? '/user' : '/admin');
  };

  const demoRoles = ['super_admin', 'hr', 'leader', 'employee'];

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-logo big"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M12 22a10 10 0 110-20 10 10 0 010 20z" /><path d="M12 6v6l4 2" /></svg></div>
        <h1>Monica</h1>
        <p>Hệ thống chấm công thông minh<br />và quản lý nhân sự toàn diện</p>
        <ul className="login-feats">
          <li><span>✓</span> Chấm công bằng mã PIN nhanh chóng</li>
          <li><span>✓</span> Theo dõi công & lịch sử theo thời gian thực</li>
          <li><span>✓</span> Cổng đơn từ, phê duyệt theo luồng cấp bậc</li>
          <li><span>✓</span> Bảng lương & báo cáo Excel / PDF</li>
        </ul>
      </div>

      <div className="login-card">
        <div className="tabs">
          <button className={`tab ${tab === 'account' ? 'active' : ''}`} onClick={() => { setTab('account'); setErr(''); }}>Đăng nhập</button>
          <button className={`tab ${tab === 'pin' ? 'active' : ''}`} onClick={() => { setTab('pin'); setErr(''); }}>Chấm công PIN</button>
        </div>

        {tab === 'account' ? (
          <form onSubmit={doAccount} className="login-form">
            <h2>Xin chào!</h2>
            <p className="muted">Đăng nhập để tiếp tục đến phân hệ của bạn</p>
            <label className="field">
              <span className="field-label">Tên đăng nhập</span>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoFocus />
            </label>
            <label className="field">
              <span className="field-label">Mật khẩu</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
            {err && <div className="alert err">{err}</div>}
            <button className="btn primary block" type="submit">Đăng nhập →</button>

            <div className="divider"><span>Đăng nhập nhanh demo</span></div>
            <div className="quick-grid">
              {demoRoles.map((r) => {
                const u = db.users.find((x) => x.role === r);
                return (
                  <button key={r} type="button" className="quick-btn" onClick={() => quick(u)}>
                    <b>{u.name}</b>
                    <small>{roleLabels[r]}</small>
                  </button>
                );
              })}
            </div>
          </form>
        ) : (
          <div className="pin-panel">
            <h2>Chấm công bằng mã PIN</h2>
            <p className="muted">Nhập mã PIN 6 số để check-in / check-out</p>
            <div className={`pin-dots ${err ? 'shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={i < pin.length ? 'filled' : ''} />)}
            </div>
            {err ? <div className="alert err">{err}</div> : <div className="pin-hint">Mã PIN demo: 123456 / 654321 / 333444</div>}
            <div className="pin-pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((v, i) =>
                v === '' ? <span key={i} /> : (
                  <button key={i} className="pin-key" onClick={() => v === '⌫' ? setPin(pin.slice(0, -1)) : pressPin(v)}>
                    {v === '⌫' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20"><path d="M21 4H8l-7 8 7 8h13a1 1 0 001-1V5a1 1 0 00-1-1z" /><path d="M18 9l-6 6M12 9l6 6" /></svg> : v}
                  </button>
                )
              )}
            </div>
            <p className="muted small">Các tài khoản khác xem mục <b>Tài khoản mẫu</b> ở tab Đăng nhập</p>
          </div>
        )}
      </div>
    </div>
  );
}
