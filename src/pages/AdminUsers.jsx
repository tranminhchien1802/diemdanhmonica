import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, Modal, Field, Avatar, Badge, EmptyState } from '../components/ui';
import { roleLabels } from '../data/seed';
import { fmtMoney } from '../utils/helpers';

const emptyUser = {
  username: '', password: '', pin: '', name: '', role: 'employee', department: '', position: '',
  phone: '', email: '', salaryBase: 10000000, allowances: 0, status: 'active', managerId: '', avatar: null,
};

const depts = ['Phòng Kỹ thuật', 'Phòng Kinh doanh', 'Phòng Kế toán', 'Phòng Nhân sự', 'Ban Giám đốc'];

export default function Users() {
  const { db, saveUser, deleteUser, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(emptyUser);
  const [q, setQ] = useState('');
  const [deptF, setDeptF] = useState('all');
  const [roleF, setRoleF] = useState('all');
  const [detail, setDetail] = useState(null);
  const [pinUser, setPinUser] = useState(null);
  const [newPin, setNewPin] = useState('');

  const filtered = useMemo(() => {
    return db.users.filter((u) => {
      const okQ = u.name.toLowerCase().includes(q.toLowerCase()) || u.username.toLowerCase().includes(q.toLowerCase()) || u.position.toLowerCase().includes(q.toLowerCase());
      const okD = deptF === 'all' || u.department === deptF;
      const okR = roleF === 'all' || u.role === roleF;
      return okQ && okD && okR;
    });
  }, [db.users, q, deptF, roleF]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEdit(null); setForm(emptyUser); setOpen(true); };
  const openEdit = (u) => { setEdit(u); setForm({ ...u }); setOpen(true); };

  const save = (e) => {
    e.preventDefault();
    if (db.users.some((u) => u.username === form.username && u.id !== edit?.id)) {
      toast('Tên đăng nhập đã tồn tại', 'error');
      return;
    }
    if (db.users.some((u) => u.pin === form.pin && u.id !== edit?.id)) {
      toast('Mã PIN đã tồn tại', 'error');
      return;
    }
    saveUser(form);
    setOpen(false);
    toast(edit ? 'Đã cập nhật nhân sự' : 'Đã thêm nhân sự mới');
  };

  const remove = (u) => {
    if (window.confirm(`Xóa nhân sự ${u.name}?`)) {
      deleteUser(u.id);
      toast('Đã xóa', 'info');
    }
  };

  const submitPin = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(newPin)) { toast('Mã PIN phải đủ 6 chữ số', 'error'); return; }
    if (db.users.some((u) => u.pin === newPin && u.id !== pinUser.id)) { toast('Mã PIN đã được sử dụng bởi nhân sự khác', 'error'); return; }
    saveUser({ ...pinUser, pin: newPin });
    toast(`Đã cấp lại mã PIN mới cho ${pinUser.name}`);
    setPinUser(null);
    setNewPin('');
  };

  const attCount = (uid) => db.attendance.filter((a) => a.userId === uid).length;

  return (
    <div>
      <PageHead
        title="Nhân sự & Phân quyền"
        sub="Quản lý hồ sơ tập trung, chức vụ, phòng ban, thông tin liên hệ và dữ liệu sinh trắc học"
        actions={<button className="btn primary" onClick={openAdd}>+ Thêm nhân sự</button>}
      />

      <div className="card">
        <div className="filter-row">
          <input className="input" placeholder="🔍 Tìm theo tên, username, chức vụ..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input small" value={deptF} onChange={(e) => setDeptF(e.target.value)}>
            <option value="all">Tất cả phòng ban</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input small" value={roleF} onChange={(e) => setRoleF(e.target.value)}>
            <option value="all">Tất cả vai trò</option>
            {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Nhân sự</th><th>Phòng ban</th><th>Chức vụ</th><th>Vai trò</th><th>Liên hệ</th><th>PIN</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-user">
                      <Avatar user={u} size={36} />
                      <div><b>{u.name}</b><small className="d-block muted">{u.username}</small></div>
                    </div>
                  </td>
                  <td>{u.department}</td>
                  <td>{u.position}</td>
                  <td><Badge label={roleLabels[u.role]} color={u.role === 'super_admin' ? 'violet' : u.role === 'hr' ? 'cyan' : u.role === 'leader' ? 'blue' : 'gray'} /></td>
                  <td><small>{u.phone}<br />{u.email}</small></td>
                  <td><code>{u.pin}</code></td>
                  <td><Badge label={u.status === 'active' ? 'Hoạt động' : 'Đã nghỉ'} color={u.status === 'active' ? 'green' : 'gray'} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" title="Chi tiết" onClick={() => setDetail(u)}>👁</button>
                      <button className="icon-btn" title="Cấp lại mã PIN" onClick={() => { setPinUser(u); setNewPin(''); }}>🔑</button>
                      <button className="icon-btn" title="Sửa" onClick={() => openEdit(u)}>✏️</button>
                      <button className="icon-btn danger" title="Xóa" onClick={() => remove(u)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8"><EmptyState icon="👥" text="Không tìm thấy nhân sự" /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Sửa nhân sự: ${edit.name}` : 'Thêm nhân sự mới'} width={680}>
        <form onSubmit={save} className="form-grid">
          <Field label="Họ và tên" required><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="Tên đăng nhập" required><input className="input" value={form.username} onChange={(e) => set('username', e.target.value)} required /></Field>
          <Field label="Mật khẩu" required><input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required /></Field>
          <Field label="Mã PIN (6 số)" required><input className="input" maxLength="6" value={form.pin} onChange={(e) => set('pin', e.target.value.replace(/\D/g, ''))} required /></Field>
          <Field label="Vai trò" required>
            <select className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
              {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Phòng ban" required>
            <select className="input" value={form.department} onChange={(e) => set('department', e.target.value)}>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Chức vụ" required><input className="input" value={form.position} onChange={(e) => set('position', e.target.value)} required /></Field>
          <Field label="Quản lý trực tiếp">
            <select className="input" value={form.managerId || ''} onChange={(e) => set('managerId', e.target.value || null)}>
              <option value="">— Không —</option>
              {db.users.filter((x) => x.role !== 'employee' && x.id !== edit?.id).map((x) => <option key={x.id} value={x.id}>{x.name} ({roleLabels[x.role]})</option>)}
            </select>
          </Field>
          <Field label="Số điện thoại"><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email"><input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Lương cơ bản (VND)"><input className="input" type="number" value={form.salaryBase} onChange={(e) => set('salaryBase', Number(e.target.value))} /></Field>
          <Field label="Phụ cấp (VND)"><input className="input" type="number" value={form.allowances} onChange={(e) => set('allowances', Number(e.target.value))} /></Field>
          <Field label="Trạng thái">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="active">Hoạt động</option>
              <option value="inactive">Đã nghỉ việc</option>
            </select>
          </Field>
          <Field label="Ảnh đại diện (URL)">
            <input className="input" value={form.avatar || ''} onChange={(e) => set('avatar', e.target.value || null)} placeholder="https://... (tùy chọn)" />
          </Field>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary">Lưu</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pinUser} onClose={() => setPinUser(null)} title={`Cấp lại mã PIN cho ${pinUser?.name || ''}`} width={420}>
        <form onSubmit={submitPin}>
          <p className="muted">Nhập mã PIN mới gồm 6 chữ số. Nhân viên sẽ dùng mã này để check-in/check-out.</p>
          <div className="mt8">
            <Field label="Mã PIN mới (6 số)" required>
              <input className="input" maxLength="6" inputMode="numeric" autoFocus value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" required />
            </Field>
          </div>
          {db.users.some((u) => u.pin === newPin && u.id !== pinUser?.id) && <div className="alert err">Mã PIN đã được sử dụng bởi nhân sự khác</div>}
          <div className="form-actions mt16">
            <button type="button" className="btn" onClick={() => setPinUser(null)}>Hủy</button>
            <button type="submit" className="btn primary">🔑 Cấp mã PIN mới</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Hồ sơ: ${detail.name}` : ''}>
        {detail && (
          <div className="profile-detail">
            <div className="profile-top">
              <Avatar user={detail} size={64} />
              <div>
                <h3>{detail.name}</h3>
                <p className="muted">{detail.position} · {detail.department}</p>
                <div className="mt8"><Badge label={roleLabels[detail.role]} color="blue" /> <Badge label={detail.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ'} color={detail.status === 'active' ? 'green' : 'gray'} /></div>
              </div>
            </div>
            <div className="detail-grid">
              <div><span>Username</span><b>{detail.username}</b></div>
              <div><span>Mã PIN</span><b><code>{detail.pin}</code></b></div>
              <div><span>Điện thoại</span><b>{detail.phone || '—'}</b></div>
              <div><span>Email</span><b>{detail.email || '—'}</b></div>
              <div><span>Lương cơ bản</span><b>{fmtMoney(detail.salaryBase)}</b></div>
              <div><span>Phụ cấp</span><b>{fmtMoney(detail.allowances)}</b></div>
              <div><span>Quản lý</span><b>{db.users.find((x) => x.id === detail.managerId)?.name || '—'}</b></div>
              <div><span>Số lần chấm công</span><b>{attCount(detail.id)}</b></div>
            </div>
            <div className="section-t">
              <h4>Dữ liệu sinh trắc học</h4>
              <div className="bio-row">
                <div><span className="bio-icon">📷</span><div><b>Khuôn mặt</b><small className="muted">Chưa đăng ký ảnh khuôn mặt</small></div></div>
                <div><span className="bio-icon">📍</span><div><b>GPS ngoại lệ</b><small className="muted">Không có tọa độ ngoại lệ</small></div></div>
                <div><span className="bio-icon">📲</span><div><b>Mã PIN</b><small className="muted">{detail.pin} · đã kích hoạt</small></div></div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
