import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, StatusBadge, Modal, Field, Avatar, EmptyState } from '../components/ui';
import { requestTypeLabel, requestTypeColor, fmtDate, fmtDateTime } from '../utils/helpers';

const typeIcon = { nghi_phep: '🌴', quen_cham_cong: '🤔', di_muon_ve_som: '⏰', cong_tac: '🚗' };

export default function Approvals() {
  const { db, currentUser, approveRequest, batchApprove, toast } = useApp();
  const [filter, setFilter] = useState('pending');
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const isLeader = currentUser?.role === 'leader' || !!db.users.find((u) => u.managerId === currentUser?.id);
  const isHr = ['hr', 'super_admin'].includes(currentUser?.role);
  const canBoth = isHr && db.users.some((u) => u.managerId === currentUser?.id);
  const [roleMode, setRoleMode] = useState(isLeader && !isHr ? 'leader' : canBoth ? 'hr' : isHr ? 'hr' : 'leader');
  const role = roleMode;

  const myTeam = useMemo(() => {
    const ids = db.users.filter((u) => u.managerId === currentUser?.id).map((u) => u.id);
    return new Set(ids);
  }, [db.users, currentUser]);

  const canSee = (r) => {
    if (roleMode === 'leader') return isLeader && myTeam.has(r.userId) && r.leaderStatus === 'pending';
    if (roleMode === 'hr') return isHr && r.leaderStatus === 'approved' && r.hrStatus === 'pending';
    return false;
  };

  const list = useMemo(() => {
    const all = [...db.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter === 'pending') return all.filter(canSee);
    if (filter === 'done') return all.filter((r) => r.status !== 'pending');
    return all;
  }, [db.requests, filter, canSee]);

  const openApprove = (r) => { setSel(r); setMode('approve'); setNote(''); };
  const openReject = (r) => { setSel(r); setMode('reject'); setNote(''); };

  const submit = () => {
    approveRequest(sel.id, role, mode === 'approve', note);
    toast(mode === 'approve' ? 'Đã duyệt đơn' : 'Đã từ chối đơn', mode === 'approve' ? 'success' : 'info');
    setSel(null);
  };

  const toggleSel = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const batch = () => {
    batchApprove([...selected], role);
    toast(`Đã duyệt hàng loạt ${selected.size} đơn`);
    setSelected(new Set());
  };

  const nextActionLabel = (r) => {
    if (roleMode === 'leader') return 'Chờ Trưởng phòng';
    return 'Chờ HR duyệt cuối';
  };

  return (
    <div>
      <PageHead
        title="Phê duyệt đơn từ"
        sub={`Luồng duyệt: Nhân viên → Trưởng phòng → ${roleMode === 'leader' ? 'Bạn (Trưởng phòng)' : 'HR duyệt cuối'}`}
        actions={
          selected.size > 0 ? (
            <button className="btn primary" onClick={batch}>✓ Duyệt hàng loạt ({selected.size})</button>
          ) : undefined
        }
      />

      {canBoth && (
        <div className="seg mb16" style={{ display: 'inline-flex' }}>
          <button className={roleMode === 'leader' ? 'active' : ''} onClick={() => { setRoleMode('leader'); setSelected(new Set()); }}>Vai trò Trưởng phòng</button>
          <button className={roleMode === 'hr' ? 'active' : ''} onClick={() => { setRoleMode('hr'); setSelected(new Set()); }}>Vai trò HR</button>
        </div>
      )}

      <div className="card">
        <div className="card-head-row">
          <div className="seg small">
            {[['pending', 'Chờ xử lý'], ['done', 'Đã xử lý'], ['all', 'Tất cả']].map(([k, l]) => (
              <button key={k} className={filter === k ? 'active' : ''} onClick={() => { setFilter(k); setSelected(new Set()); }}>{l}</button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState icon="✅" text="Không có đơn nào trong danh mục này" />
        ) : (
          <div className="req-list">
            {list.map((r) => {
              const u = db.users.find((x) => x.id === r.userId);
              const action = canSee(r);
              return (
                <div key={r.id} className={`req-item ${action ? 'actionable' : ''}`}>
                  <span className="type-icon sm" style={{ background: requestTypeColor[r.type] + '18', color: requestTypeColor[r.type] }}>{typeIcon[r.type]}</span>
                  <div className="req-main">
                    <div className="req-title">
                      <b>{u?.name}</b>
                      <StatusBadge status={r.status} />
                    </div>
                    <p>{requestTypeLabel[r.type]} · {fmtDate(r.fromDate)}{r.toDate !== r.fromDate ? ` → ${fmtDate(r.toDate)}` : ''} {r.paid ? '· có lương' : '· không lương'}</p>
                    <p className="muted">"{r.reason}"</p>
                    <small className="muted">Gửi {fmtDateTime(r.createdAt)}</small>
                  </div>
                  <div className="req-flow">
                    <div className={`flow-dot ${r.leaderStatus}`}>TP</div>
                    <div className="flow-line" />
                    <div className={`flow-dot ${r.hrStatus}`}>HR</div>
                    <small className="flow-step">{nextActionLabel(r)}</small>
                  </div>
                  {action && (
                    <div className="req-actions">
                      <button className="icon-btn" onClick={toggleSel.bind(null, r.id)} title="Chọn hàng loạt">
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => {}} onClick={(e) => e.stopPropagation()} />
                      </button>
                      <button className="btn sm danger" onClick={() => openReject(r)}>Từ chối</button>
                      <button className="btn sm primary" onClick={() => openApprove(r)}>Duyệt</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={`${mode === 'approve' ? 'Duyệt' : 'Từ chối'} đơn ${sel ? requestTypeLabel[sel.type] : ''}`}>
        {sel && (
          <div>
            <div className="profile-top">
              <Avatar user={db.users.find((x) => x.id === sel.userId)} size={48} />
              <div>
                <b>{db.users.find((x) => x.id === sel.userId)?.name}</b>
                <p className="muted">{sel.reason}</p>
                <small className="muted">{fmtDate(sel.fromDate)}{sel.toDate !== sel.fromDate ? ` → ${fmtDate(sel.toDate)}` : ''}</small>
              </div>
            </div>
            <Field label={mode === 'approve' ? 'Ghi chú duyệt (tùy chọn)' : 'Lý do từ chối'}>
              <textarea className="input" rows="3" value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'approve' ? 'VD: Đồng ý...' : 'VD: Thiếu thông tin...'} />
            </Field>
            <div className="form-actions">
              <button className="btn" onClick={() => setSel(null)}>Hủy</button>
              <button className={`btn ${mode === 'approve' ? 'primary' : 'danger'}`} onClick={submit}>
                {mode === 'approve' ? '✓ Xác nhận duyệt' : '✕ Xác nhận từ chối'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
