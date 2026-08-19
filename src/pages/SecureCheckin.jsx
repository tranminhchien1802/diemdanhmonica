import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase, haversineM, getCurrentPosition } from '../lib/supabase';
import { loadFaceModels, getDescriptor, getDescriptorFromImage, faceDistance, distanceToPercent, isMatch } from '../lib/face';
import { fmtDateTime } from '../utils/helpers';

const steps = ['Vị trí', 'Quét QR', 'Chụp selfie', 'Hoàn tất'];

export default function SecureCheckin() {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState('u4');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftId, setShiftId] = useState('');
  const [pos, setPos] = useState(null);
  const [distance, setDistance] = useState(null);
  const [geoMsg, setGeoMsg] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrError, setQrError] = useState('');
  const scannerRef = useRef(null);
  const qrRegion = useRef(null);

  const [camReady, setCamReady] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [selfie, setSelfie] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [matchPct, setMatchPct] = useState(null);
  const [matched, setMatched] = useState(false);
  const [faceErr, setFaceErr] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [done, setDone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('qr');
    if (qrParam) setQrToken(qrParam);
    (async () => {
      const [uRes, sRes, shRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name'),
        supabase.rpc('get_settings'),
        supabase.rpc('get_shifts'),
      ]);
      if (uRes.error) return setErr('Không tải được danh sách nhân viên: ' + uRes.error.message);
      setUsers(uRes.data);
      setSettings(sRes.data);
      setShifts(shRes.data || []);
      setShiftId(shRes.data?.[0]?.id || '');
    })();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const getGps = async () => {
    setGeoBusy(true);
    setGeoMsg('');
    try {
      const p = await getCurrentPosition();
      setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      const d = haversineM(p.coords.latitude, p.coords.longitude, settings.office_lat, settings.office_lng);
      setDistance(d);
      if (d <= settings.radius_m) {
        setGeoMsg(`✅ Trong phạm vi (cách ${d} m)`);
        setTimeout(() => setStep(1), 500);
      } else {
        setGeoMsg(`⛔ Ngoài phạm vi: cách ${d} m (tối đa ${settings.radius_m} m)`);
      }
    } catch (e) {
      setGeoMsg('⚠️ ' + e.message);
    } finally {
      setGeoBusy(false);
    }
  };

  const startScan = async () => {
    setScanning(true);
    setQrError('');
    const sc = new Html5Qrcode('qr-reader-region');
    scannerRef.current = sc;
    try {
      await sc.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          setQrToken(text);
          sc.stop();
          setScanning(false);
          setTimeout(() => setStep(2), 800);
        },
        () => {},
      );
    } catch (e) {
      setQrError('Không mở được camera. ' + e.message);
      setScanning(false);
    }
  };

  const skipScan = () => { setScanning(false); setStep(2); };

  const goSelfie = () => { setStep(2); };

  const startCamera = async () => {
    setFaceErr('');
    setFaceReady(false);
    setCamReady(false);
    setSelfie(null);
    setSelfieBlob(null);
    setMatchPct(null);
    setMatched(false);
    try {
      setFaceErr('Đang tải mô hình nhận diện khuôn mặt...');
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCamReady(true);
      setFaceErr('');
    } catch (e) {
      setFaceErr('Không mở được camera / tải mô hình. ' + e.message);
    }
  };

  const captureSelfie = async () => {
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    canvas.toBlob(async (blob) => {
      const url = URL.createObjectURL(blob);
      setSelfie(url);
      setSelfieBlob(blob);
      stopCamera();
      setCamReady(false);
      setFaceErr('Đang so khớp khuôn mặt...');
      const img = new Image();
      img.onload = async () => {
        try {
          const { data, error } = await supabase.from('profiles').select('face_descriptor').eq('id', userId).single();
          if (error || !data?.face_descriptor) {
            setFaceErr('Nhân viên chưa đăng ký khuôn mặt. Nhờ Admin đăng ký trước.');
            setFaceReady(true);
            return;
          }
          const desc = await getDescriptorFromImage(img);
          if (!desc) { setFaceErr('Không tìm thấy khuôn mặt trong ảnh. Chụp lại.'); setFaceReady(true); return; }
          const d = faceDistance(desc, data.face_descriptor);
          const pct = distanceToPercent(d);
          setMatchPct(pct);
          setMatched(isMatch(d));
          setFaceReady(true);
        } catch (e) {
          setFaceErr('Lỗi so khớp: ' + e.message);
          setFaceReady(true);
        }
      };
      img.src = url;
    }, 'image/jpeg', 0.9);
  };

  const uploadSelfie = async () => {
    const name = `selfie_${userId}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('selfies').upload(name, selfieBlob, { contentType: 'image/jpeg' });
    if (error) throw new Error('Upload ảnh lỗi: ' + error.message);
    const { data } = supabase.storage.from('selfies').getPublicUrl(name);
    return data.publicUrl;
  };

  const finish = async () => {
    setSaving(true);
    setErr('');
    try {
      if (!matched) throw new Error('Khuôn mặt không khớp — không cho chấm công.');
      const selfieUrl = await uploadSelfie();
      const { data, error } = await supabase.rpc('record_checkin', {
        p_user_id: userId,
        p_shift_id: shiftId,
        p_lat: pos.lat,
        p_lng: pos.lng,
        p_qr_token: qrToken,
        p_selfie_url: selfieUrl,
        p_face_score: matchPct,
      });
      if (error) throw new Error(error.message);
      setDone(data);
      setStep(3);
    } catch (e) {
      setErr('⚠️ ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setStep(0); setPos(null); setDistance(null); setGeoMsg(''); setQrToken(''); setQrError('');
    setSelfie(null); setSelfieBlob(null); setMatchPct(null); setMatched(false); setDone(null); setErr('');
    stopCamera();
  };

  return (
    <div className="secure-page">
      <div className="secure-head">
        <h1>Chấm công bảo mật</h1>
        <p>GPS + QR động + nhận diện khuôn mặt — chống gian lận 3 lớp</p>
      </div>

      {!done ? (
        <>
          <div className="stepper">
            {steps.map((s, i) => (
              <div key={s} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="step-dot">{i < step ? '✓' : i + 1}</div>
                <div className="step-label">{s}</div>
              </div>
            ))}
          </div>

          <div className="secure-card">
            {step === 0 && (
              <>
                <h2>📍 Xác thực vị trí</h2>
                <p className="muted">Trước hết hệ thống kiểm tra bạn có đang trong bán kính chấm công không.</p>
                <div className="form-grid">
                  <label className="field">
                    <span className="field-label">Nhân viên</span>
                    <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field-label">Ca làm việc</span>
                    <select className="input" value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
                      {shifts.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>)}
                    </select>
                  </label>
                </div>
                {settings && (
                  <div className="geo-info">
                    <div>Văn phòng: <b>{settings.office_name}</b></div>
                    <div>Bán kính cho phép: <b>{settings.radius_m} m</b></div>
                    {pos && <div>Vị trí của bạn: <b>{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</b> {distance != null && `→ ${distance} m`}</div>}
                  </div>
                )}
                {geoMsg && <div className={`alert ${geoMsg.startsWith('✅') ? 'ok' : geoMsg.startsWith('⛔') ? 'err' : 'info'}`}>{geoMsg}</div>}
                <button className="btn primary block" onClick={getGps} disabled={geoBusy}>
                  {geoBusy ? 'Đang lấy tọa độ GPS...' : 'Xác định vị trí & kiểm tra bán kính'}
                </button>
                <p className="muted small mt16">Hệ thống yêu cầu quyền truy cập vị trí. Vui lòng bật GPS và cho phép.</p>
              </>
            )}

            {step === 1 && (
              <>
                <h2>📷 Quét mã QR</h2>
                <p className="muted">Quét mã QR động đang hiển thị tại máy chấm công. Mã chỉ có hiệu lực trong {settings?.qr_ttl_seconds || 45}s.</p>
                <div id="qr-reader-region" ref={qrRegion} style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
                {qrError && <div className="alert err">{qrError}</div>}
                {!scanning && (
                  <div className="row mt16">
                    <button className="btn primary" onClick={startScan}>Mở camera quét QR</button>
                    <button className="btn" onClick={skipScan}>Nhập mã QR thủ công</button>
                  </div>
                )}
                {scanning && <button className="btn" onClick={() => { scannerRef.current?.stop(); setScanning(false); }}>Hủy</button>}
                {qrToken && <div className="alert ok">QR hợp lệ: <code>{qrToken.slice(0, 16)}…</code></div>}
                {qrToken && <button className="btn primary block mt16" onClick={goSelfie}>Quét xong → Chụp selfie</button>}
                {!qrToken && (
                  <>
                    <div className="divider mt16"><span>Hoặc nhập mã thủ công</span></div>
                    <div className="row mt8">
                      <input
                        className="input"
                        style={{ flex: 1 }}
                        placeholder="Dán mã QR từ màn hình máy chấm công"
                        onChange={(e) => setQrToken(e.target.value.trim())}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h2>🤳 Chụp selfie & nhận diện</h2>
                <p className="muted">Chụp ảnh khuôn mặt để xác minh danh tính. Hệ thống so khớp với khuôn mặt đã đăng ký.</p>
                {!qrToken && <div className="alert err">⚠️ Chưa có mã QR hợp lệ. Quay lại quét QR.</div>}
                <div className="selfie-box">
                  {camReady ? (
                    <video ref={videoRef} className="selfie-video" autoPlay playsInline muted />
                  ) : selfie ? (
                    <img src={selfie} alt="selfie" className="selfie-img" />
                  ) : (
                    <div className="selfie-placeholder">📸 Camera</div>
                  )}
                </div>
                {!camReady && !selfie && <button className="btn primary block" onClick={startCamera}>Bật camera & tải mô hình</button>}
                {camReady && <button className="btn primary block" onClick={captureSelfie}>Chụp & xác minh</button>}
                {faceErr && <div className={`alert ${faceErr.startsWith('Khuôn mặt không khớp') ? 'err' : 'info'}`}>{faceErr}</div>}
                {matchPct != null && (
                  <div className="match-result">
                    <div className="match-ring" style={{ '--pct': matchPct }}>
                      <span>{matchPct}%</span>
                    </div>
                    <div>
                      <div className={matched ? 'text-green' : 'text-red'}><b>{matched ? '✓ Khuôn mặt khớp' : '✗ Không khớp'}</b></div>
                      <div className="muted small">Độ tương đồng khuôn mặt</div>
                    </div>
                  </div>
                )}
                {selfie && !matched && <button className="btn block mt16" onClick={() => { startCamera(); }}>Chụp lại</button>}
              </>
            )}

            {err && <div className="alert err mt16">{err}</div>}
            <div className="row mt24">
              {step > 0 && step < 3 && <button className="btn" onClick={() => setStep(step - 1)}>← Quay lại</button>}
              {step === 1 && qrToken && (
                <button className="btn primary" onClick={() => setStep(2)}>Tiếp tục →</button>
              )}
              {step === 2 && matched && (
                <button className="btn primary" onClick={finish} disabled={saving}>
                  {saving ? 'Đang ghi nhận...' : 'Xác nhận check-in →'}
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="secure-card done">
          <div className="done-check">✓</div>
          <h2>Chấm công thành công!</h2>
          <div className="done-info">
            <div><span>Thời gian</span><b>{fmtDateTime(done.check_in_at)}</b></div>
            <div><span>Vị trí</span><b>{done.distance_m} m từ văn phòng</b></div>
            <div><span>Độ khớp khuôn mặt</span><b>{done.face_score}%</b></div>
            <div><span>Xác minh</span><b style={{ color: done.verified ? '#059669' : '#dc2626' }}>{done.verified ? 'Đã xác minh' : 'Chưa xác minh'}</b></div>
          </div>
          <button className="btn primary block" onClick={restart}>Chấm công lần nữa</button>
        </div>
      )}
    </div>
  );
}
