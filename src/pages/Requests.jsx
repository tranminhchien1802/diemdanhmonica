import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, StatusBadge, Modal, Field, EmptyState } from '../components/ui';
import { requestTypeLabel, requestTypeColor, fmtDate, fmtDateTime } from '../utils/helpers';

const types = [
  { id: 'nghi_phep', label: 'Xin nghỉ phép', icon: '🌴', desc: 'Nghỉ phép có lương / không lương' },
  { id: 'quen_cham_cong', label: 'Giải trình quên chấm công', icon: '🤔', desc: 'Xác nhận có mặt nhưng quên chấm' },
  { id: 'di_muon_ve_som', label: 'Đi muộn / Về sớm', icon: '⏰', desc: 'Giải trình đi muộn, về sớm' },
  { id: 'cong_tac', label: 'Đơn công tác', icon: '🚗', desc: 'Đi công tác, ngoài văn phòng' },
];

const emptyForm = {
  type: 'nghi_phep', paid: true, fromDate: '', toDate: '', days: 1, reason: '',
};

export default function Requests() {
  const { currentUser, db, addRequest, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');

  const myRequests = useMemo(
    () => db.requests.filter((r) => r.userId === currentUser?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db, currentUser],
  );

  const filtered = filter === 'all' ? myRequests : myRequests.filter((r) => r.status === filter);
  const pending = myRequests.filter((r) => r.status === 'pending').length;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const t = types.find((x) => x.id === form.type);
    addRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      type: form.type,
      typeLabel: t.label,
      paid: form.paid,
      fromDate: form.fromDate,
      toDate: form.toDate,
      days: form.days,
      reason: form.reason,
    });
    setOpen(false);
    setForm(emptyForm);
    toast('Đã gửi đơn! Chờ Trưởng phòng duyệt.');
  };

  return (
    <div>
      <PageHead
        title="Cổng dịch vụ nội bộ"
        sub="Gửi đơn từ trực tuyến và theo dõi trạng thái phê duyệt"
        actions={<button className="btn primary" onClick={() => setOpen(true)}>+ Tạo đơn mới</button>}
      />

      <div className="type-grid">
        {types.map((t) => {
          const count = myRequests.filter((r) => r.type === t.id).length;
          return (
            <button key={t.id} className="type-card" onClick={() => { setForm((f) => ({ ...emptyForm, type: t.id })); setOpen(true); }}>
              <span className="type-icon" style={{ background: requestTypeColor[t.id] + '18', color: requestTypeColor[t.id] }}>{t.icon}</span>
              <b>{t.label}</b>
              <small>{t.desc}</small>
              {count > 0 && <span className="count-pill">{count}</span>}
            </button>
          );
        })}
      </div>

      {pending > 0 && (
        <div className="alert info">
          Bạn có <b>{pending}</b> đơn đang chờ phê duyệt. Đơn sẽ đi qua luồng: Nhân viên → Trưởng phòng → HR.
        </div>
      )}

      <div className="card">
        <div className="card-head-row">
          <h3>Danh sách đơn của tôi</h3>
          <div className="seg small">
            {[['all', 'Tất cả'], ['pending', 'Đang chờ'], ['approved', 'Đã duyệt'], ['rejected', 'Từ chối']].map(([k, l]) => (
              <button key={k} className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="📄" text="Chưa có đơn nào ở trạng thái này" />
        ) : (
          <div className="req-list">
            {filtered.map((r) => (
              <div key={r.id} className="req-item">
                <span className="type-icon sm" style={{ background: requestTypeColor[r.type] + '18', color: requestTypeColor[r.type] }}>{types.find((t) => t.id === r.type)?.icon}</span>
                <div className="req-main">
                  <div className="req-title">
                    <b>{requestTypeLabel[r.type]}</b>
                    <StatusBadge status={r.status} />
                  </div>
                  <p>
                    {fmtDate(r.fromDate)}{r.toDate && r.toDate !== r.fromDate ? ` → ${fmtDate(r.toDate)}` : ''}
                    {r.paid ? ' · có lương' : ' · không lương'}
                    {r.days > 1 ? ` · ${r.days} ngày` : ''}
                  </p>
                  <p className="muted">"{r.reason}"</p>
                </div>
                <div className="req-flow">
                  <div className={`flow-dot ${r.leaderStatus}`}>TP</div>
                  <div className="flow-line" />
                  <div className={`flow-dot ${r.hrStatus}`}>HR</div>
                </div>
                <div className="req-meta muted">
                  <small>Gửi: {fmtDateTime(r.createdAt)}</small>
                  {r.hrNote && <small>Ghi chú HR: {r.hrNote}</small>}
                  {r.leaderNote && !r.hrNote && <small>Ghi chú TP: {r.leaderNote}</small>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Tạo đơn mới">
        <form onSubmit={submit} className="form-grid">
          <Field label="Loại đơn" required>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          {form.type === 'nghi_phep' && (
            <Field label="Hình thức">
              <div className="seg">
                <button type="button" className={form.paid ? 'active' : ''} onClick={() => set('paid', true)}>Có lương</button>
                <button type="button" className={!form.paid ? 'active' : ''} onClick={() => set('paid', false)}>Không lương</button>
              </div>
            </Field>
          )}
          <Field label="Từ ngày" required>
            <input className="input" type="date" value={form.fromDate} onChange={(e) => set('fromDate', e.target.value)} required />
          </Field>
          <Field label="Đến ngày">
            <input className="input" type="date" value={form.toDate} onChange={(e) => set('toDate', e.target.value)} />
          </Field>
          <Field label="Số ngày">
            <input className="input" type="number" min="0.5" step="0.5" value={form.days} onChange={(e) => set('days', Number(e.target.value))} />
          </Field>
          <Field label="Lý do" required>
            <textarea className="input" rows="3" value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Trình bày lý do cụ thể..." required />
          </Field>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Hủy</button>
            <button type="submit" className="btn primary">Gửi đơn</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
