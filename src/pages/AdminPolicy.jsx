import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHead, Field, Toggle } from '../components/ui';
import { defaultPolicy } from '../data/seed';

export default function Policy() {
  const { db, savePolicy, resetDb, toast } = useApp();
  const [p, setP] = useState({ ...db.policy });
  const set = (k, v) => setP((f) => ({ ...f, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    savePolicy(p);
    toast('Đã lưu cấu hình chính sách chấm công');
  };

  const reset = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu demo (xóa các thay đổi hiện tại)?')) {
      resetDb();
      setP({ ...defaultPolicy });
    }
  };

  return (
    <div>
      <PageHead
        title="Chính sách chấm công"
        sub="Cấu hình linh hoạt vị trí, khung giờ, ân hạn và quy tắc tính lương tăng ca"
      />

      <form onSubmit={save}>
        <div className="grid two">
          <div className="card">
            <h3>📍 Vị trí chấm công</h3>
            <div className="form-grid">
              <Field label="Tên văn phòng"><input className="input" value={p.officeName} onChange={(e) => set('officeName', e.target.value)} /></Field>
              <Field label="Địa chỉ"><input className="input" value={p.officeAddress} onChange={(e) => set('officeAddress', e.target.value)} /></Field>
              <Field label="Vĩ độ trung tâm"><input className="input" type="number" step="any" value={p.officeLat} onChange={(e) => set('officeLat', Number(e.target.value))} /></Field>
              <Field label="Kinh độ trung tâm"><input className="input" type="number" step="any" value={p.officeLng} onChange={(e) => set('officeLng', Number(e.target.value))} /></Field>
              <Field label="Bán kính cho phép (m)"><input className="input" type="number" min="0" value={p.radiusM} onChange={(e) => set('radiusM', Number(e.target.value))} /></Field>
              <Field label="Xem trước"><code className="input">10.7765, 106.7009 ± {p.radiusM}m</code></Field>
            </div>
            <div className="map-preview">
              <svg viewBox="0 0 300 150">
                <rect x="0" y="0" width="300" height="150" fill="#eef2ff" rx="10" />
                <circle cx="150" cy="75" r="52" fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="6 4" />
                <circle cx="150" cy="75" r="8" fill="#4f46e5" />
                <text x="150" y="142" textAnchor="middle" fontSize="11" fill="#4b5563">Vùng chấm công bán kính {p.radiusM}m</text>
              </svg>
            </div>
          </div>

          <div className="card">
            <h3>⏰ Khung giờ làm việc & Ân hạn</h3>
            <div className="form-grid">
              <Field label="Giờ bắt đầu chính thức"><input className="input" type="time" value={p.workStart} onChange={(e) => set('workStart', e.target.value)} /></Field>
              <Field label="Giờ kết thúc chính thức"><input className="input" type="time" value={p.workEnd} onChange={(e) => set('workEnd', e.target.value)} /></Field>
              <Field label="Grace period đi muộn (phút)"><input className="input" type="number" min="0" value={p.graceLate} onChange={(e) => set('graceLate', Number(e.target.value))} /></Field>
              <Field label="Grace period về sớm (phút)"><input className="input" type="number" min="0" value={p.graceEarly} onChange={(e) => set('graceEarly', Number(e.target.value))} /></Field>
            </div>
            <div className="hint-box">
              Nhân viên check-in trong khoảng <b>{p.workStart} → {p.workStart} + {p.graceLate} phút</b> vẫn tính <b>Đúng giờ</b>. Tương tự, check-out sớm không quá <b>{p.graceEarly} phút</b> không tính là về sớm.
            </div>

            <h3 className="mt16">💰 Quy tắc tăng ca (OT)</h3>
            <div className="form-grid">
              <Field label="Hệ số OT ngày thường"><input className="input" type="number" step="0.1" min="1" value={p.otRate} onChange={(e) => set('otRate', Number(e.target.value))} /></Field>
              <Field label="Hệ số OT cuối tuần/lễ"><input className="input" type="number" step="0.1" min="1" value={p.otRateWeekend} onChange={(e) => set('otRateWeekend', Number(e.target.value))} /></Field>
              <Field label="Giờ OT tối đa/ngày"><input className="input" type="number" min="0" value={p.otCap} onChange={(e) => set('otCap', Number(e.target.value))} /></Field>
              <Field label="Tính OT khi vượt quá (phút)"><input className="input" type="number" min="0" value={p.otThreshold} onChange={(e) => set('otThreshold', Number(e.target.value))} /></Field>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🔔 Thông báo Real-time</h3>
          <div className="toggle-row">
            <Toggle checked={p.notifyTelegram} onChange={(v) => set('notifyTelegram', v)} label="Telegram" />
            <Toggle checked={p.notifyZalo} onChange={(v) => set('notifyZalo', v)} label="Zalo OA" />
            <Toggle checked={p.notifyEmail} onChange={(v) => set('notifyEmail', v)} label="Email" />
          </div>
          {p.notifyTelegram && (
            <div className="form-grid mt16">
              <Field label="Telegram Bot Token"><input className="input" type="password" value={p.telegramBotToken} onChange={(e) => set('telegramBotToken', e.target.value)} placeholder="123456:ABC-DEF..." /></Field>
              <Field label="Chat ID nhận thông báo"><input className="input" value={p.telegramChatId} onChange={(e) => set('telegramChatId', e.target.value)} placeholder="-100123456789" /></Field>
            </div>
          )}
          {p.notifyZalo && (
            <div className="form-grid mt16">
              <Field label="Zalo OA ID"><input className="input" value={p.zaloOaId} onChange={(e) => set('zaloOaId', e.target.value)} placeholder="XXXXXX" /></Field>
            </div>
          )}
          {p.notifyEmail && (
            <div className="form-grid mt16">
              <Field label="SMTP / Email nhận báo"><input className="input" type="email" value={p.smtpEmail} onChange={(e) => set('smtpEmail', e.target.value)} placeholder="hr@monica.vn" /></Field>
            </div>
          )}
          <p className="muted small mt16">Khi có đơn mới cần duyệt hoặc nhân viên chấm công thành công, hệ thống sẽ bắn thông báo qua các kênh đã bật.</p>
        </div>

        <div className="form-actions sticky-bar">
          <button type="button" className="btn" onClick={reset}>↺ Khôi phục dữ liệu demo</button>
          <button type="submit" className="btn primary">💾 Lưu cấu hình</button>
        </div>
      </form>
    </div>
  );
}
