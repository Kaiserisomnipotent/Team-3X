import type { Profile } from '@/lib/types';

// Các mảnh giao diện dùng chung cho trang Quản lý tài khoản (admin) và Nhóm của tôi (leader).

export type Seen = { last?: string; banned: boolean };

export const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

const stack = { display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' } as const;

/** Trạng thái tài khoản: đang hoạt động, chờ duyệt hay đã khoá, và lần vào gần nhất. */
export function StatusCell({ p, seen }: { p: Profile; seen?: Seen }) {
  if (p.role === 'disabled') return <div className="f" style={stack}><span className="pill s-down">Đã khoá</span><span className="srcline">{seen && !seen.banned ? 'Đã chặn truy cập; chưa chặn đăng nhập Google' : 'Không đăng nhập được'}</span></div>;
  if (p.role === 'pending') return <div className="f" style={stack}><span className="pill s-idle">Chờ duyệt</span><span className="srcline">Chưa xem được nội dung</span></div>;
  return <div className="f" style={stack}><span className="pill s-up">Đang hoạt động</span><span className="srcline">{seen?.last ? `Vào gần nhất ${fmtTime(seen.last)}` : 'Chưa truy cập'}</span></div>;
}

/** Lời mời đã được chấp nhận chưa: người được mời đăng nhập bằng đúng Gmail là chấp nhận. */
export function InviteStatus({ p, seen }: { p?: Profile; seen?: Seen }) {
  if (!p) return <div className="f" style={stack}><span className="pill s-idle">Chờ chấp nhận</span><span className="srcline">Chưa đăng nhập</span></div>;
  if (p.role === 'disabled') return <div className="f" style={stack}><span className="pill s-down">Đã vào · bị khoá</span></div>;
  if (p.role === 'pending') return <div className="f" style={stack}><span className="pill s-idle">Đã vào · chờ duyệt</span></div>;
  return <div className="f" style={stack}><span className="pill s-up">Đã chấp nhận</span><span className="srcline">{seen?.last ? `Vào gần nhất ${fmtTime(seen.last)}` : 'Chưa truy cập'}</span></div>;
}

const NO_MAIL = 'Bạn nhắn người đó tự đăng nhập bằng đúng Gmail này.';
const INVITE_MSG: Record<string, [string, string]> = {
  sent: ['info', 'Đã thêm và gửi email mời.'],
  failed: ['warn', `Đã thêm vào danh sách, nhưng gửi email thất bại (kiểm tra GMAIL_USER / GMAIL_APP_PASSWORD trên Vercel). ${NO_MAIL}`],
  nokey: ['warn', `Đã thêm vào danh sách. Chưa gửi email vì chưa cấu hình email trên Vercel (xem README, mục Email). ${NO_MAIL}`],
};

/** Thông báo kết quả sau mỗi thao tác (đọc từ query string). */
export function Notices({ sp }: { sp: Record<string, string | undefined> }) {
  const ACCT: Record<string, string> = {
    saved: 'Đã lưu.',
    deleted: 'Đã xoá tài khoản và toàn bộ dữ liệu của người đó.',
    locked: 'Đã khoá tài khoản. Người này bị đăng xuất và không đăng nhập lại được.',
    unlocked: 'Đã mở khoá, tài khoản trở lại vai trò Nhân sự.',
    owner_on: 'Đã trao quyền chủ sở hữu.',
    owner_off: 'Đã thu quyền chủ sở hữu.',
  };
  return (
    <>
      {sp.err && <div className="note warn">{sp.err}</div>}
      {sp.invite && INVITE_MSG[sp.invite] && <div className={`note ${INVITE_MSG[sp.invite][0]}`}>{INVITE_MSG[sp.invite][1]}{sp.applied && ' Tài khoản này đã đăng nhập từ trước nên leader phụ trách, ngày bắt đầu và vai trò mới đã được áp dụng ngay.'}</div>}
      {sp.acct && ACCT[sp.acct] && <div className="note info">{ACCT[sp.acct]}</div>}
    </>
  );
}
