import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { roleLabels } from '../data/seed';

const depts = ['Phòng Kỹ thuật', 'Phòng Kinh doanh', 'Phòng Kế toán', 'Phòng Nhân sự'];

const emptyReg = { name: '', username: '', password: '', pin: '', confirmPin: '', department: 'Phòng Kỹ thuật', position: '', phone: '', email: '' };

export default function Login() {
  const { login, register, currentUser, db, toast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('account');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [reg, setRegForm] = useState(emptyReg);
  const [regErr, setRegErr] = useState('');
  const [regOk, setRegOk] = useState(false);

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

  const doRegister = (e) => {
    e.preventDefault();
    setRegErr('');
    if (reg.pin.length !== 6) { setRegErr('Mã PIN phải đủ 6 chữ số'); return; }
    if (reg.pin !== reg.confirmPin) { setRegErr('Xác nhận mã PIN không khớp'); return; }
    if (reg.password.length < 6) { setRegErr('Mật khẩu tối thiểu 6 ký tự'); return; }
    const res = register(reg);
    if (!res.ok) { setRegErr(res.message); return; }
    setRegOk(true);
    toast('Đăng ký thành công! Vui lòng đăng nhập.');
    setReg(emptyReg);
  };

  const setRegField = (k, v) => setRegForm((f) => ({ ...f, [k]: v }));

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
          <button className={`tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErr(''); }}>Đăng ký</button>
        </div>

        {tab === 'register' ? (
          <div className="login-form">
            <h2>Đăng ký tài khoản</h2>
            <p className="muted">Tự đăng ký và tạo mã PIN cá nhân của bạn</p>
            {regOk && <div className="alert info">✅ Đăng ký thành công! Chuyển sang tab <b>Đăng nhập</b> để vào hệ thống.</div>}
            <form onSubmit={doRegister} className="form-grid reg-grid">
              <label className="field form-grid-span">
                <span className="field-label">Họ và tên <b className="req">*</b></span>
                <input className="input" value={reg.name} onChange={(e) => setRegField('name', e.target.value)} placeholder="Nguyễn Văn A" required />
              </label>
              <label className="field">
                <span className="field-label">Tên đăng nhập <b className="req">*</b></span>
                <input className="input" value={reg.username} onChange={(e) => setRegField('username', e.target.value)} placeholder="vanan" required />
              </label>
              <label className="field">
                <span className="field-label">Mật khẩu <b className="req">*</b></span>
                <input className="input" type="password" value={reg.password} onChange={(e) => setRegField('password', e.target.value)} placeholder="Tối thiểu 6 ký tự" required />
              </label>
              <label className="field">
                <span className="field-label">Mã PIN 6 số <b className="req">*</b></span>
                <input className="input" maxLength="6" inputMode="numeric" value={reg.pin} onChange={(e) => setRegField('pin', e.target.value.replace(/\D/g, ''))} placeholder="••••••" required />
              </label>
              <label className="field">
                <span className="field-label">Xác nhận mã PIN <b className="req">*</b></span>
                <input className="input" maxLength="6" inputMode="numeric" value={reg.confirmPin} onChange={(e) => setRegField('confirmPin', e.target.value.replace(/\D/g, ''))} placeholder="••••••" required />
              </label>
              <label className="field">
                <span className="field-label">Phòng ban <b className="req">*</b></span>
                <select className="input" value={reg.department} onChange={(e) => setRegField('department', e.target.value)}>
                  {depts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Chức vụ <b className="req">*</b></span>
                <input className="input" value={reg.position} onChange={(e) => setRegField('position', e.target.value)} placeholder="Nhân viên" required />
              </label>
              <label className="field">
                <span className="field-label">Số điện thoại</span>
                <input className="input" value={reg.phone} onChange={(e) => setRegField('phone', e.target.value)} placeholder="090xxxxxxx" />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="input" type="email" value={reg.email} onChange={(e) => setRegField('email', e.target.value)} placeholder="you@monica.vn" />
              </label>
              {regErr && <div className="alert err form-grid-span">{regErr}</div>}
              <button className="btn primary block" type="submit">Tạo tài khoản</button>
            </form>
            <p className="muted small mt16">Sau khi đăng ký, bạn sẽ có vai trò <b>Nhân viên</b> và được chấm công bằng mã PIN vừa tạo. Quyền quản trị do Super Admin phân công.</p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
