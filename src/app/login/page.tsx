import LoginButton from './LoginButton';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <div className="card">
        <span className="eyebrow">Team 3X · SSI Nguyễn Hữu Cảnh</span>
        <h1 style={{ fontSize: 36 }}>Hành trình 99 ngày</h1>
        <p className="muted">Hệ thống đào tạo nội bộ. Đăng nhập bằng Gmail cá nhân đã đăng ký với leader.</p>
        {error === 'disabled' && <div className="note warn">Tài khoản đã bị khoá. Liên hệ leader nếu đây là nhầm lẫn.</div>}
        {error === 'auth' && <div className="note warn">Đăng nhập chưa thành công, thử lại.</div>}
        <LoginButton />
        <p className="srcline">Nội dung chỉ dùng trong team. Mọi lượt xem đều được ghi lại theo tài khoản.</p>
      </div>
    </main>
  );
}
