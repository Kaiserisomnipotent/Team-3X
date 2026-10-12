-- Chạy SAU schema.sql. Đổi email bên dưới thành Gmail của chủ sở hữu.
-- Chủ sở hữu (tối đa 2 người): không ai khoá/xoá/hạ quyền được, và chỉ chủ mới quản lý admin.
-- Bàn giao: chủ hiện tại trao quyền chủ cho người mới ngay trên web (trang Quản lý tài khoản),
-- hoặc chạy lại file này với email mới.

-- 1) Người chưa đăng nhập lần nào: mời trước với quyền admin.
insert into public.invites (email, role, start_date) values
  ('email-chu-so-huu@gmail.com', 'admin', current_date)
on conflict (email) do update set role = excluded.role;

-- 2) Người đã đăng nhập: nâng thành admin + chủ sở hữu.
update public.profiles set role = 'admin', is_owner = true
where lower(email) in ('email-chu-so-huu@gmail.com');

-- 3) Chủ sở hữu cho người chưa đăng nhập: đăng nhập lần đầu xong thì chạy lại bước 2.
