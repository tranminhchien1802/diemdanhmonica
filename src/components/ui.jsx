import React from 'react';
import { statusColor, statusLabel, initials } from '../utils/helpers';

export function Badge({ label, color = 'gray' }) {
  const map = {
    green: { bg: '#ecfdf5', c: '#047857' },
    amber: { bg: '#fffbeb', c: '#b45309' },
    red: { bg: '#fef2f2', c: '#b91c1c' },
    blue: { bg: '#eff6ff', c: '#1d4ed8' },
    gray: { bg: '#f3f4f6', c: '#4b5563' },
    violet: { bg: '#f5f3ff', c: '#6d28d9' },
    cyan: { bg: '#ecfeff', c: '#0e7490' },
  };
  const { bg, c } = map[color] || map.gray;
  return (
    <span className="badge" style={{ background: bg, color: c }}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge label={statusLabel[status] || status} color={statusColor[status] || 'gray'} />;
}

export function Avatar({ user, size = 38 }) {
  const bg = user?.avatar;
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (bg) return <img className="avatar" src={bg} alt={user?.name} style={style} />;
  return (
    <div className="avatar" style={{ ...style, background: `linear-gradient(135deg, #4f46e5, #7c3aed)` }}>
      {initials(user?.name)}
    </div>
  );
}

export function StatCard({ icon, label, value, sub, tone = 'indigo' }) {
  const tones = {
    indigo: { bg: '#eef2ff', c: '#4f46e5' },
    green: { bg: '#ecfdf5', c: '#059669' },
    amber: { bg: '#fffbeb', c: '#d97706' },
    red: { bg: '#fef2f2', c: '#dc2626' },
    cyan: { bg: '#ecfeff', c: '#0891b2' },
    violet: { bg: '#f5f3ff', c: '#7c3aed' },
  };
  const t = tones[tone];
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: t.bg, color: t.c }}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, required }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <b className="req">*</b>}</span>
      {children}
    </label>
  );
}

export const inputCls = 'input';

export function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

export function PageHead({ title, sub, actions }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-track" />
      {label && <span className="toggle-label">{label}</span>}
    </button>
  );
}
