import { redirect } from 'next/navigation';
import { getMe } from '@/lib/auth';

export default async function Pending() {
  const { user, profile } = await getMe();
  if (!user) redirect('/login');
  if (profile && profile.role !== 'pending') redirect('/');
  return (
    <main className="login">
      <div className="card">
        <span className="eyebrow">Chờ duyệt</span>
        <h1 style={{ fontSize: 32 }}>Đã nhận đăng ký</h1>
        <p>Tài khoản <b>{user.email}</b> đang chờ leader duyệt. Nhắn leader để được mở quyền, sau đó tải lại trang này.</p>
        <form action="/auth/signout" method="post"><button className="btn ghost" type="submit">Đăng nhập bằng email khác</button></form>
      </div>
    </main>
  );
}
