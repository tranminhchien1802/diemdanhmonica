import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { loadFaceModels, getDescriptorFromImage } from '../lib/face';
import { fmtDateTime } from '../utils/helpers';
import { PageHead, Badge } from '../components/ui';

export default function SecureAdmin() {
  const [settings, setSettings] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftId, setShiftId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [qrExpiry, setQrExpiry] = useState(null);
  const [msg, setMsg] = useState('');

  const [users, setUsers] = useState([]);
  const [regUserId, setRegUserId] = useState('u4');
  const [faceImg, setFaceImg] = useState(null);
  const [faceBusy, setFaceBusy] = useState(false);
  const [faceMsg, setFaceMsg] = useState('');

  const [checkins, setCheckins] = useState([]);
  const [viewUserId, setViewUserId] = useState('u4');

  const [form, setForm] = useState({ office_name: '', office_lat: '', office_lng: '', radius_m: '', qr_ttl_seconds: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [showQr, setShowQr] = useState(false);

  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const loadAll = async () => {
    const [sRes, shRes, uRes] = await Promise.all([
      supabase.rpc('get_settings'),
      supabase.rpc('get_shifts'),
      supabase.from('profiles').select('id, full_name'),
    ]);
    if (sRes.data) {
      setSettings(sRes.data);
      setForm({
        office_name: sRes.data.office_name,
        office_lat: sRes.data.office_lat,
        office_lng: sRes.data.office_lng,
        radius_m: sRes.data.radius_m,
        qr_ttl_seconds: sRes.data.qr_ttl_seconds,
      });
    }
    if (shRes.data?.length) { setShifts(shRes.data); setShiftId(shRes.data[0].id); }
    if (uRes.data) setUsers(uRes.data);
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => () => clearInterval(pollRef.current), []);

  const makeQr = async () => {
    setMsg('');
    const { data, error } = await supabase.rpc('generate_qr_token', { p_shift_id: shiftId || null });
    if (error) return setMsg('⚠️ ' + error.message);
    const deepLink = `${window.location.origin}/secure?qr=${encodeURIComponent(data.token)}`;
    const url = await QRCode.toDataURL(deepLink, { width: 320, margin: 1, errorCorrectionLevel: 'M' });
    setQrDataUrl(url);
    setQrToken(data.token);
    setQrExpiry(new Date(data.expires_at));
    setShowQr(true);
    pollRef.current = setInterval(() => {
      if (new Date() > new Date(data.expires_at)) { clearInterval(pollRef.current); setShowQr(false); setMsg('⏱️ Mã QR đã hết hạn. Tạo mã mới.'); }
    }, 1000);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaveMsg('');
    const { data, error } = await supabase.rpc('update_settings', {
      p_office_name: form.office_name,
      p_office_lat: Number(form.office_lat),
      p_office_lng: Number(form.office_lng),
      p_radius_m: Number(form.radius_m),
      p_qr_ttl_seconds: Number(form.qr_ttl_seconds),
    });
    if (error) return setSaveMsg('⚠️ ' + error.message);
    setSettings(data);
    setSaveMsg('✅ Đã lưu cấu hình');
  };

  const registerFace = async (e) => {
    e.preventDefault();
    if (!faceImg) return;
    setFaceBusy(true);
    setFaceMsg('Đang trích xuất đặc trưng khuôn mặt...');
    try {
      await loadFaceModels();
      const img = new Image();
      img.onload = async () => {
        const { data: desc, error } = await getDescriptorFromImage(img).then((d) => ({ data: d })).catch((e) => ({ error: e }));
        if (error || !desc) { setFaceMsg('⚠️ Không tìm thấy khuôn mặt trong ảnh.'); setFaceBusy(false); return; }
        const { error: rErr } = await supabase.rpc('register_face', { p_user_id: regUserId, p_descriptor: Array.from(desc) });
        setFaceBusy(false);
        if (rErr) setFaceMsg('⚠️ ' + rErr.message);
        else setFaceMsg('✅ Đã đăng ký khuôn mặt thành công.');
      };
      img.src = URL.createObjectURL(faceImg);
    } catch (e) {
      setFaceBusy(false);
      setFaceMsg('⚠️ ' + e.message);
    }
  };

  const loadCheckins = async () => {
    const { data, error } = await supabase.rpc('get_checkins', { p_user_id: viewUserId });
    if (error) return;
    setCheckins(data || []);
  };

  return (
    <div className="secure-page">
      <PageHead
        title="Cổng quản trị chấm công bảo mật"
        sub="Sinh mã QR động, cấu hình điểm chấm công, đăng ký khuôn mặt"
      />

      <div className="secure-grid">
        <div className="card">
          <h3>🏢 Điểm chấm công & bán kính</h3>
          <form onSubmit={saveSettings} className="form-grid mt16">
            <label className="field form-grid-span">
              <span className="field-label">Tên văn phòng</span>
              <input className="input" value={form.office_name} onChange={(e) => setForm({ ...form, office_name: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Vĩ độ (Lat)</span>
              <input className="input" type="number" step="any" value={form.office_lat} onChange={(e) => setForm({ ...form, office_lat: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Kinh độ (Lng)</span>
              <input className="input" type="number" step="any" value={form.office_lng} onChange={(e) => setForm({ ...form, office_lng: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Bán kính (m)</span>
              <input className="input" type="number" value={form.radius_m} onChange={(e) => setForm({ ...form, radius_m: e.target.value })} />
            </label>
            <label className="field">
              <span className="field-label">Thời hạn QR (giây)</span>
              <input className="input" type="number" value={form.qr_ttl_seconds} onChange={(e) => setForm({ ...form, qr_ttl_seconds: e.target.value })} />
            </label>
            {saveMsg && <div className={`alert ${saveMsg.startsWith('✅') ? 'ok' : 'err'} form-grid-span`}>{saveMsg}</div>}
            <button className="btn primary form-grid-span" type="submit">Lưu cấu hình</button>
          </form>
          <p className="muted small mt16">
            💡 Lấy toạ độ chính xác tại Google Maps: click chuột phải vào vị trí văn phòng → copy vĩ độ/kinh độ. Bán kính nên ≥ 100m vì GPS di động sai số.
          </p>
        </div>

        <div className="card">
          <h3>🔳 Sinh mã QR động</h3>
          <p className="muted mt8">Bật màn hình này ở máy chấm công. Mã tự đổi sau mỗi {settings?.qr_ttl_seconds || 45}s — chụp màn hình gửi từ xa sẽ vô dụng.</p>
          <div className="mt16">
            <select className="input" value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
              {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>)}
            </select>
            <button className="btn primary block mt16" onClick={makeQr}>{showQr ? 'Tạo mã mới' : 'Bắt đầu phát QR'}</button>
          </div>
          {showQr && (
            <div className="qr-display mt16">
              <img src={qrDataUrl} alt="QR động" />
              <div className="muted small">Mã: <code>{qrToken.slice(0, 10)}…</code></div>
              <div className="muted small">Hết hạn lúc: {fmtDateTime(qrExpiry?.toISOString())}</div>
            </div>
          )}
          {msg && <div className="alert info mt16">{msg}</div>}
          <p className="muted small mt16">⚠️ Dùng máy tính/tablet đặt tại cửa chấm công. Nhân viên quét QR bằng camera điện thoại.</p>
        </div>
      </div>

      <div className="secure-grid mt24">
        <div className="card">
          <h3>🙋 Đăng ký khuôn mặt</h3>
          <p className="muted mt8">Trước khi nhân viên check-in bằng selfie, cần đăng ký ảnh khuôn mặt của họ.</p>
          <form onSubmit={registerFace} className="mt16">
            <label className="field">
              <span className="field-label">Nhân viên</span>
              <select className="input" value={regUserId} onChange={(e) => setRegUserId(e.target.value)}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </label>
            <button type="button" className="btn block mt16" onClick={() => fileRef.current?.click()}>
              {faceImg ? 'Đổi ảnh khuôn mặt' : 'Chọn ảnh khuôn mặt'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setFaceImg(e.target.files[0])} />
            {faceImg && <div className="face-preview"><img src={URL.createObjectURL(faceImg)} alt="face" /></div>}
            {faceMsg && <div className={`alert ${faceMsg.startsWith('✅') ? 'ok' : faceMsg.startsWith('⚠️') ? 'err' : 'info'} mt16`}>{faceMsg}</div>}
            <button className="btn primary block mt16" type="submit" disabled={faceBusy}>
              {faceBusy ? 'Đang xử lý...' : 'Đăng ký khuôn mặt'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>🗒️ Lịch sử chấm công</h3>
          <div className="row mt16">
            <select className="input" value={viewUserId} onChange={(e) => setViewUserId(e.target.value)}>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
            <button className="btn" onClick={loadCheckins}>Xem</button>
          </div>
          <div className="table-wrap mt16">
            <table className="table">
              <thead>
                <tr><th>Thời gian</th><th>Khoảng cách</th><th>Face</th><th>Xác minh</th></tr>
              </thead>
              <tbody>
                {checkins.map((c) => (
                  <tr key={c.id}>
                    <td>{fmtDateTime(c.check_in_at)}</td>
                    <td>{c.distance_m} m</td>
                    <td>{c.face_score != null ? `${c.face_score}%` : '—'}</td>
                    <td><Badge label={c.verified ? 'Đã xác minh' : 'Chưa'} color={c.verified ? 'green' : 'amber'} /></td>
                  </tr>
                ))}
                {checkins.length === 0 && <tr><td colSpan="4" className="muted">Chưa có chấm công.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
