-- =====================================================================
-- Học viện Team 3X — cấu trúc database + phân quyền
-- Cách chạy: Supabase > SQL Editor > New query > dán toàn bộ file này > Run.
-- Chạy lại nhiều lần vẫn an toàn.
-- =====================================================================

-- ---------- Bảng mời: ai được vào, vào với vai trò gì ----------
-- Email có trong bảng này sẽ được duyệt tự động khi đăng nhập lần đầu.
-- Email không có trong bảng vẫn đăng nhập được nhưng ở trạng thái "chờ duyệt".
create table if not exists public.invites (
  email       text primary key,
  role        text not null default 'member' check (role in ('member','leader','admin')),
  team        text,
  start_date  date,
  created_at  timestamptz not null default now()
);

-- ---------- Hồ sơ nhân sự ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  team        text,
  start_date  date not null default current_date,
  role        text not null default 'pending' check (role in ('pending','member','leader','admin','disabled')),
  created_at  timestamptz not null default now()
);

-- ---------- Hàm kiểm tra quyền (dùng trong policy) ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('member','leader','admin'), false)
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('leader','admin'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

-- ---------- Tự tạo hồ sơ khi có người đăng nhập Google lần đầu ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.invites%rowtype;
begin
  select * into inv from public.invites where lower(email) = lower(new.email);
  insert into public.profiles (id, email, full_name, team, start_date, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    inv.team,
    coalesce(inv.start_date, current_date),
    coalesce(inv.role, 'pending')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Tiến độ lộ trình (tick đầu việc) ----------
create table if not exists public.task_progress (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  task_id  text not null,
  done_at  timestamptz not null default now(),
  primary key (user_id, task_id)
);

-- ---------- Điểm kiểm tra (chỉ server ghi, học viên không tự sửa được) ----------
create table if not exists public.quiz_scores (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  quiz_id     text not null,
  best_score  int  not null check (best_score between 0 and 100),
  attempts    int  not null default 1,
  updated_at  timestamptz not null default now(),
  primary key (user_id, quiz_id)
);

-- ---------- Số liệu kinh doanh tự nhập ----------
create table if not exists public.kpi_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  log_date      date not null default current_date,
  new_accounts  int  not null default 0 check (new_accounts >= 0),
  id_transfers  int  not null default 0 check (id_transfers >= 0),
  net_fee       numeric(12,2) not null default 0 check (net_fee >= 0),  -- đơn vị: triệu đồng
  created_at    timestamptz not null default now()
);
create index if not exists kpi_logs_user_date on public.kpi_logs (user_id, log_date);

-- ---------- Check-in cuối ngày ----------
create table if not exists public.checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  checkin_date  date not null default current_date,
  did           text not null default '',
  result        text not null default '',
  need_help     text not null default '',
  help_status   text not null default 'none' check (help_status in ('none','open','resolved')),
  leader_reply  text,
  replied_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, checkin_date)
);

-- Học viên không tự sửa được phần trả lời của leader; trạng thái hỗ trợ tự tính.
create or replace function public.guard_checkin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if public.is_staff() and new.user_id <> auth.uid() then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.leader_reply := old.leader_reply;
    new.replied_by   := old.replied_by;
    new.user_id      := old.user_id;
    new.checkin_date := old.checkin_date;
  else
    new.leader_reply := null;
    new.replied_by   := null;
  end if;
  new.help_status := case
    when btrim(new.need_help) = '' then 'none'
    when tg_op = 'UPDATE' and old.help_status = 'resolved' and new.need_help = old.need_help then 'resolved'
    else 'open' end;
  return new;
end $$;
drop trigger if exists checkins_guard on public.checkins;
create trigger checkins_guard before insert or update on public.checkins
  for each row execute function public.guard_checkin();

-- ---------- Việc leader giao ----------
create table if not exists public.assigned_tasks (
  id          uuid primary key default gen_random_uuid(),
  assignee    uuid not null references public.profiles(id) on delete cascade,
  created_by  uuid references public.profiles(id),
  title       text not null,
  detail      text not null default '',
  due_date    date,
  status      text not null default 'todo' check (status in ('todo','doing','done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists assigned_tasks_assignee on public.assigned_tasks (assignee, status);

-- Người được giao chỉ đổi được trạng thái, không sửa nội dung/hạn.
create or replace function public.guard_assigned_task() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if not public.is_staff() then
    new.assignee   := old.assignee;
    new.created_by := old.created_by;
    new.title      := old.title;
    new.detail     := old.detail;
    new.due_date   := old.due_date;
  end if;
  return new;
end $$;
drop trigger if exists assigned_tasks_guard on public.assigned_tasks;
create trigger assigned_tasks_guard before update on public.assigned_tasks
  for each row execute function public.guard_assigned_task();

-- ---------- Nhật ký xem bài (phục vụ truy vết nếu lộ nội dung) ----------
create table if not exists public.view_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  page       text not null,
  viewed_at  timestamptz not null default now()
);
create index if not exists view_logs_user on public.view_logs (user_id, viewed_at desc);

-- =====================================================================
-- PHÂN QUYỀN (Row Level Security)
-- Nguyên tắc: học viên chỉ thấy và ghi dữ liệu của chính mình;
-- leader/admin thấy toàn team; chỉ admin quản lý tài khoản.
-- =====================================================================
alter table public.invites        enable row level security;
alter table public.profiles       enable row level security;
alter table public.task_progress  enable row level security;
alter table public.quiz_scores    enable row level security;
alter table public.kpi_logs       enable row level security;
alter table public.checkins       enable row level security;
alter table public.assigned_tasks enable row level security;
alter table public.view_logs      enable row level security;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
    and tablename in ('invites','profiles','task_progress','quiz_scores','kpi_logs','checkins','assigned_tasks','view_logs')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- invites: chỉ admin
create policy invites_admin on public.invites for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: mỗi người đọc hồ sơ mình; leader/admin đọc tất cả; chỉ admin sửa/xoá
create policy profiles_read on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());
create policy profiles_admin_delete on public.profiles for delete
  using (public.is_admin());

-- task_progress
create policy tp_read on public.task_progress for select
  using (user_id = auth.uid() or public.is_staff());
create policy tp_insert on public.task_progress for insert
  with check (user_id = auth.uid() and public.is_active());
create policy tp_delete on public.task_progress for delete
  using (user_id = auth.uid() and public.is_active());

-- quiz_scores: chỉ đọc (ghi qua server bằng service role)
create policy qs_read on public.quiz_scores for select
  using (user_id = auth.uid() or public.is_staff());

-- kpi_logs
create policy kpi_read on public.kpi_logs for select
  using (user_id = auth.uid() or public.is_staff());
create policy kpi_insert on public.kpi_logs for insert
  with check (user_id = auth.uid() and public.is_active());
create policy kpi_delete on public.kpi_logs for delete
  using ((user_id = auth.uid() and public.is_active()) or public.is_admin());

-- checkins
create policy ci_read on public.checkins for select
  using (user_id = auth.uid() or public.is_staff());
create policy ci_insert on public.checkins for insert
  with check (user_id = auth.uid() and public.is_active());
create policy ci_update_own on public.checkins for update
  using (user_id = auth.uid() and public.is_active())
  with check (user_id = auth.uid());
create policy ci_update_staff on public.checkins for update
  using (public.is_staff()) with check (public.is_staff());

-- assigned_tasks
create policy at_read on public.assigned_tasks for select
  using (assignee = auth.uid() or public.is_staff());
create policy at_insert on public.assigned_tasks for insert
  with check (public.is_staff());
create policy at_update on public.assigned_tasks for update
  using ((assignee = auth.uid() and public.is_active()) or public.is_staff());
create policy at_delete on public.assigned_tasks for delete
  using (public.is_staff());

-- view_logs: học viên chỉ ghi; leader/admin đọc
create policy vl_insert on public.view_logs for insert
  with check (user_id = auth.uid() and public.is_active());
create policy vl_read on public.view_logs for select
  using (public.is_staff());
