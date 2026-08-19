import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://uiqktjsetehkketmrtjc.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kqC2x0u_pmCBUt20Il9pxA_26XGRkN8';

export const supabase = createClient(url, key);

export const haversineM = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
};

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Trình duyệt không hỗ trợ GPS'));
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      const msg =
        err.code === 1
          ? 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật lại trong trình duyệt.'
          : err.code === 2
            ? 'Không xác định được vị trí. Kiểm tra GPS/đứng gần cửa sổ.'
            : 'Yêu cầu vị trí bị quá thời gian. Thử lại.';
      reject(new Error(msg));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
