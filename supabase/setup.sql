-- ============================================================
-- MONICA ATTENDANCE - Secure check-in (Supabase setup)
-- Dán toàn bộ file này vào SQL Editor -> Run
-- Client chỉ gọi RPC functions, không truy cập trực tiếp bảng
-- ============================================================

-- 1) BẢNG
create table if not exists profiles (
  id text primary key,
  full_name text not null,
  role text not null default 'employee',
  department text,
  face_descriptor jsonb,
  created_at timestamptz default now()
);

create table if not exists settings (
  id int primary key default 1,
  office_name text not null default 'Văn phòng Monica',
  office_lat double precision not null,
  office_lng double precision not null,
  radius_m int not null default 200,
  qr_ttl_seconds int not null default 45,
  updated_at timestamptz default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  grace_late int not null default 10
);

create table if not exists qr_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  shift_id uuid references shifts(id),
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id),
  shift_id uuid references shifts(id),
  lat double precision not null,
  lng double precision not null,
  distance_m int not null,
  qr_token text not null,
  selfie_url text,
  face_score float,
  verified boolean not null default false,
  check_in_at timestamptz default now()
);

-- 2) DỮ LIỆU MẪU
insert into settings (id, office_name, office_lat, office_lng, radius_m)
values (1, 'Văn phòng Monica', 10.791813, 106.556740, 200)
on conflict (id) do update
set office_lat = excluded.office_lat,
    office_lng = excluded.office_lng,
    radius_m = excluded.radius_m;

insert into profiles (id, full_name, role, department) values
  ('u1', 'Minh Chiến', 'admin', 'Ban Giám đốc'),
  ('u2', 'Nguyễn Thị Hương', 'hr', 'Phòng Nhân sự'),
  ('u3', 'Trần Văn Nam', 'leader', 'Phòng Kỹ thuật'),
  ('u4', 'Lê Thị Mai', 'employee', 'Phòng Kỹ thuật'),
  ('u5', 'Phạm Minh Tú', 'employee', 'Phòng Kinh doanh'),
  ('u6', 'Hoàng Anh Quân', 'employee', 'Phòng Kế toán'),
  ('u7', 'Vũ Thị Lan', 'employee', 'Phòng Nhân sự'),
  ('u8', 'Ngô Đình Khánh', 'employee', 'Phòng Kỹ thuật')
on conflict (id) do nothing;

insert into shifts (name, start_time, end_time, grace_late) values
  ('Ca hành chính', '08:00', '17:30', 10),
  ('Ca sáng', '07:00', '11:30', 5),
  ('Ca chiều', '13:30', '18:00', 5),
  ('Ca đêm', '22:00', '06:00', 10)
on conflict do nothing;

-- 3) HÀM SERVER-SIDE (security definer -> bypass RLS, CHẠY PHÍA SERVER)

-- Lấy cấu hình chấm công
create or replace function public.get_settings()
returns settings
language sql security definer stable
as $$ select * from settings where id = 1 $$;

-- Danh sách ca làm việc
create or replace function public.get_shifts()
returns setof shifts
language sql security definer stable
as $$ select * from shifts order by start_time $$;

-- Sinh QR động (chỉ admin), token có hạn theo settings.qr_ttl_seconds
create or replace function public.generate_qr_token(
  p_shift_id uuid default null
) returns json
language plpgsql security definer as $$
declare
  v_ttl int;
  v_token text;
begin
  select qr_ttl_seconds into v_ttl from settings where id = 1;
  v_token := encode(gen_random_bytes(16), 'hex');
  insert into qr_tokens (token, shift_id, expires_at)
  values (v_token, p_shift_id, now() + make_interval(secs => coalesce(v_ttl, 45)));
  return json_build_object('token', v_token, 'expires_at',
    (select to_char(expires_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from qr_tokens where token = v_token));
end $$;

-- Đăng ký / cập nhật descriptor khuôn mặt
create or replace function public.register_face(
  p_user_id text,
  p_descriptor jsonb
) returns boolean
language plpgsql security definer as $$
begin
  update profiles set face_descriptor = p_descriptor where id = p_user_id;
  return found;
end $$;

-- GHI CHẤM CÔNG: validate QR + GPS radius PHÍA SERVER rồi mới insert
create or replace function public.record_checkin(
  p_user_id text,
  p_shift_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_qr_token text,
  p_selfie_url text default null,
  p_face_score float default null
) returns json
language plpgsql security definer as $$
declare
  v_settings settings;
  v_qr qr_tokens;
  v_distance double precision;
  v_checkin checkins;
begin
  select * into v_settings from settings where id = 1;
  if v_settings.id is null then
    raise exception 'Chưa cấu hình điểm chấm công';
  end if;

  -- Bước A: validate QR động
  select * into v_qr from qr_tokens
    where token = p_qr_token and used = false and expires_at > now()
    order by created_at desc limit 1;
  if v_qr.id is null then
    raise exception 'Mã QR không hợp lệ hoặc đã hết hạn';
  end if;

  -- Bước B: tính khoảng cách (Haversine) phía server
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(p_lat - v_settings.office_lat) / 2), 2) +
    cos(radians(v_settings.office_lat)) * cos(radians(p_lat)) *
    power(sin(radians(p_lng - v_settings.office_lng) / 2), 2)
  )) into v_distance;

  if v_distance > v_settings.radius_m then
    update qr_tokens set used = false where id = v_qr.id;
    raise exception 'Ngoài phạm vi chấm công: % m (tối đa % m)', round(v_distance), v_settings.radius_m;
  end if;

  -- Bước C: đánh dấu QR đã dùng + ghi nhận
  update qr_tokens set used = true where id = v_qr.id;

  insert into checkins
    (user_id, shift_id, lat, lng, distance_m, qr_token, selfie_url, face_score, verified)
  values
    (p_user_id, p_shift_id, p_lat, p_lng, v_distance, p_qr_token, p_selfie_url, p_face_score,
     p_face_score is not null)
  returning * into v_checkin;

  return row_to_json(v_checkin);
end $$;

-- Lịch sử chấm công của một nhân viên
create or replace function public.get_checkins(p_user_id text)
returns setof checkins
language sql security definer stable
as $$ select * from checkins where user_id = p_user_id order by check_in_at desc limit 100 $$;

-- Cập nhật settings (toạ độ, bán kính, ttl) - chỉ admin
create or replace function public.update_settings(
  p_office_name text,
  p_office_lat double precision,
  p_office_lng double precision,
  p_radius_m int,
  p_qr_ttl_seconds int
) returns settings
language plpgsql security definer as $$
declare v_settings settings;
begin
  update settings set
    office_name = p_office_name,
    office_lat = p_office_lat,
    office_lng = p_office_lng,
    radius_m = p_radius_m,
    qr_ttl_seconds = p_qr_ttl_seconds,
    updated_at = now()
  where id = 1;
  select * into v_settings from settings where id = 1;
  return v_settings;
end $$;

-- 4) PHÂN QUYỀN: khoá toàn bộ bảng, chỉ cho phép gọi hàm
alter table profiles enable row level security;
alter table settings enable row level security;
alter table shifts enable row level security;
alter table qr_tokens enable row level security;
alter table checkins enable row level security;

grant execute on function public.get_settings() to anon, authenticated;
grant execute on function public.get_shifts() to anon, authenticated;
grant execute on function public.generate_qr_token(uuid) to anon, authenticated;
grant execute on function public.register_face(text, jsonb) to anon, authenticated;
grant execute on function public.record_checkin(text, uuid, double precision, double precision, text, text, double precision) to anon, authenticated;
grant execute on function public.get_checkins(text) to anon, authenticated;
grant execute on function public.update_settings(text, double precision, double precision, int, int) to anon, authenticated;
