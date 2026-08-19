import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, Modal, Field, Badge, EmptyState } from '../components/ui';
import { shiftTypeColor } from '../utils/helpers';

const emptyShift = {
  name: '', type: 'Hành chính', startTime: '08:00', endTime: '17:30', graceLate: 10, graceEarly: 15, breakMin: 60, color: '#6366f1', offDays: [0, 6],
};

const dowLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function Shifts() {
  const { db, saveShift, deleteShift, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(emptyShift);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => { setEdit(null); setForm(emptyShift); setOpen(true); };
  const openEdit = (s) => { setEdit(s); setForm({ ...s }); setOpen(true); };

  const save = (e) => {
    e.preventDefault();
    saveShift(form);
    setOpen(false);
    toast(edit ? 'Đã cập nhật ca làm việc' : 'Đã thêm ca làm việc');
  };

  const usageCount = (sid) => db.attendance.filter((a) => a.shiftId === sid).length;

  const toggleOff = (d) => {
    const arr = form.offDays.includes(d) ? form.offDays.filter((x) => x !== d) : [...form.offDays, d];
    set('offDays', arr);
  };

  return (
    <div>
      <PageHead
        title="Ca làm việc & Lịch trình"
        sub="Thiết lập đa dạng ca làm việc: hành chính, ca gãy, ca xoay, ca đêm"
        actions={<button className="btn primary" onClick={openAdd}>+ Thêm ca làm việc</button>}
      />

      <div className="shift-cards">
        {db.shifts.map((s) => (
          <div key={s.id} className="card shift-card" style={{ borderTop: `4px solid ${s.color}` }}>
            <div className="shift-card-head">
              <span className="shift-badge" style={{ background: s.color + '18', color: s.color }}>{s.type}</span>
              <div className="row-actions">
                <button className="icon-btn" onClick={() => openEdit(s)}>✏️</button>
                <button className="icon-btn danger" onClick={() => { if (window.confirm(`Xóa ca "${s.name}"?`)) { deleteShift(s.id); toast('Đã xóa', 'info'); } }}>🗑</button>
              </div>
            </div>
            <h3>{s.name}</h3>
            <div className="shift-time">{s.startTime} → {s.endTime}</div>
            <div className="shift-meta">
              <div><span>Ân hạn muộn</span><b>{s.graceLate}p</b></div>
              <div><span>Ân hạn sớm</span><b>{s.graceEarly}p</b></div>
              <div><span>Nghỉ giữa ca</span><b>{s.breakMin}m</b></div>
            </div>
            <div className="shift-days">
              {dowLabels.map((l, i) => (
                <span key={i} className={s.offDays.includes(i) ? 'off' : 'on'}>{l}</span>
              ))}
            </div>
            <div className="muted small">Đã dùng: {usageCount(s.id)} lượt chấm công</div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Sửa ca: ${edit.name}` : 'Thêm ca làm việc'} width={620}>
        <form onSubmit={save} className="form-grid">
          <Field label="Tên ca" required><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="Loại ca" required>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {Object.keys(shiftTypeColor).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Giờ bắt đầu" required><input className="input" type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} required /></Field>
          <Field label="Giờ kết thúc" required><input className="input" type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} required /></Field>
          <Field label="Grace period đi muộn (phút)"><input className="input" type="number" min="0" value={form.graceLate} onChange={(e) => set('graceLate', Number(e.target.value))} /></Field>
          <Field label="Grace period về sớm (phút)"><input className="input" type="number" min="0" value={form.graceEarly} onChange={(e) => set('graceEarly', Number(e.target.value))} /></Field>
          <Field label="Thời gian nghỉ giữa ca (phút)"><input className="input" type="number" min="0" value={form.breakMin} onChange={(e) => set('breakMin', Number(e.target.value))} /></Field>
          <Field label="Màu nhận diện"><input className="input" type="color" value={form.color} onChange={(e) => set('color', e.target.value)} /></Field>
          <div className="form-grid-span">
            <span className="field-label">Ngày nghỉ trong tuần</span>
            <div className="offday-pick">
              {dowLabels.map((l, i) => (
                <button key={i} type="button" className={form.offDays.includes(i) ? 'sel off' : ''} onClick={() => toggleOff(i)}>
                  {l}{form.offDays.includes(i) ? ' ✕' : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
