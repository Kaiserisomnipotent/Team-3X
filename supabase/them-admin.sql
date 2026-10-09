-- Chạy SAU schema.sql. Đổi email bên dưới thành Gmail của anh lead (và của ông nếu muốn làm admin).
-- Những email này được duyệt tự động với quyền admin khi đăng nhập lần đầu.
insert into public.invites (email, role, team, start_date) values
  ('email-anh-lead@gmail.com', 'admin', 'Khôi', current_date)
on conflict (email) do update set role = excluded.role;

-- Nếu người đó ĐÃ đăng nhập trước khi chạy file này, nâng quyền trực tiếp:
update public.profiles set role = 'admin'
where lower(email) in ('email-anh-lead@gmail.com');
