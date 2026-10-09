import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="login"><div className="card">
      <h1 style={{ fontSize: 32 }}>Không tìm thấy trang</h1>
      <p className="muted">Đường dẫn không tồn tại hoặc bạn không có quyền xem.</p>
      <Link href="/" className="btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Về Bảng của tôi</Link>
    </div></main>
  );
}
