import { requireAdmin } from '@/lib/auth';
import { addInvite, deleteInvite, deleteMember, lockMember, unlockMember, updateMember } from '@/app/actions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, todayISO } from '@/lib/journey';
import type { Profile } from '@/lib/types';

const ROLES = [
  ['pending', 'Chờ duyệt'], ['member', 'Nhân sự'], ['leader', 'Leader'], ['admin', 'Admin'], ['disabled', 'Đã khoá'],
] as const;

type Seen = { last?: string; banned: boolean };
const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

/** Trạng thái tài khoản: nhìn là biết đang hoạt động, chờ duyệt hay đã khoá, và lần truy cập gần nhất. */
function StatusCell({ p, seen }: { p: Profile; seen?: Seen }) {
  const last = seen?.last ? `Vào gần nhất ${fmtTime(seen.last)}` : 'Chưa truy cập';
  if (p.role === 'disabled') return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-down">Đã khoá</span><span className="srcline">{seen && !seen.banned ? 'Đã chặn truy cập; chưa chặn đăng nhập Google' : 'Không đăng nhập được'}</span></div>;
  if (p.role === 'pending') return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-idle">Chờ duyệt</span><span className="srcline">Chưa xem được nội dung</span></div>;
  return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-up">Đang hoạt động</span><span className="srcline">{last}</span></div>;
}

function MemberRow({ p, meId, seen }: { p: Profile; meId: string; seen?: Seen }) {
  const self = p.id === meId, locked = p.role === 'disabled';
  return (
    <form action={updateMember} className="logform" style={{ gridTemplateColumns: 'minmax(180px,1.3fr) repeat(3,minmax(110px,1fr)) minmax(150px,1fr) auto', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <input type="hidden" name="id" value={p.id} />
      <label className="f">{p.email}<input type="text" name="full_name" defaultValue={p.full_name} /></label>
      <label className="f">Nhóm<input type="text" name="team" defaultValue={p.team || ''} /></label>
      <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={p.start_date} /></label>
      <label className="f">Vai trò<select name="role" defaultValue={p.role} disabled={self}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <StatusCell p={p} seen={seen} />
      <div className="row" style={{ alignSelf: 'flex-end', gap: 6 }}>
        <SubmitButton className="btn sm">Lưu</SubmitButton>
        {!self && (locked
          ? <SubmitButton className="btn ghost sm" formAction={unlockMember}>Mở khoá</SubmitButton>
          : <SubmitButton className="btn ghost sm" formAction={lockMember} confirmText={`Khoá tài khoản ${p.email}? Họ sẽ mất quyền truy cập ngay.`}>Khoá</SubmitButton>)}
        {!self && <SubmitButton className="btn ghost sm" formAction={deleteMember} confirmText={`XOÁ HẲN tài khoản ${p.email} cùng toàn bộ tiến độ, điểm, check-in? Không hoàn tác được.`}>Xoá</SubmitButton>}
      </div>
    </form>
  );
}

/** Lời mời đã được chấp nhận chưa: người được mời đăng nhập bằng đúng Gmail là chấp nhận. */
function InviteStatus({ p, seen }: { p?: Profile; seen?: Seen }) {
  if (!p) return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-idle">Chờ chấp nhận</span><span className="srcline">Chưa đăng nhập</span></div>;
  if (p.role === 'disabled') return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-down">Đã vào · bị khoá</span></div>;
  if (p.role === 'pending') return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-idle">Đã vào · chờ duyệt</span></div>;
  return <div className="f" style={{ display: 'grid', gap: 4, justifyItems: 'start', alignContent: 'end' }}><span className="pill s-up">Đã chấp nhận</span><span className="srcline">{seen?.last ? `Vào gần nhất ${fmtTime(seen.last)}` : 'Chưa truy cập'}</span></div>;
}

const INVITE_MSG: Record<string, [string, string]> = {
  sent: ['info', 'Đã thêm và gửi email mời.'],
  failed: ['warn', 'Đã thêm vào danh sách, nhưng gửi email thất bại. Resend chưa có tên miền riêng chỉ gửi được tới email chủ tài khoản Resend. Bạn nhắn người đó tự đăng nhập bằng đúng Gmail này.'],
  nokey: ['warn', 'Đã thêm vào danh sách. Chưa gửi email vì chưa cấu hình RESEND_API_KEY trên Vercel. Bạn nhắn người đó tự đăng nhập bằng đúng Gmail này.'],
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ invite?: string; applied?: string; acct?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile: me } = await requireAdmin();
  const [pr, inv, vl, au] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('invites').select('*').order('created_at', { ascending: false }),
    supabase.from('view_logs').select('user_id,viewed_at').order('viewed_at', { ascending: false }).limit(2000),
    supabaseAdmin().auth.admin.listUsers({ perPage: 200 }).catch(() => null),
  ]);
  const all = (pr.data || []) as Profile[];
  // Lần truy cập gần nhất (từ nhật ký xem trang) và trạng thái chặn đăng nhập (từ Supabase Auth).
  const seenBy = new Map<string, Seen>();
  (au?.data?.users || []).forEach(u => seenBy.set(u.id, { last: u.last_sign_in_at || undefined, banned: !!u.banned_until && new Date(u.banned_until) > new Date() }));
  (vl.data || []).forEach(r => { const s = seenBy.get(r.user_id as string) || { banned: false }; if (!s.last || r.viewed_at > s.last) s.last = r.viewed_at as string; seenBy.set(r.user_id as string, s); });
  const byEmail = new Map(all.map(p => [p.email.toLowerCase(), p]));
  const pending = all.filter(p => p.role === 'pending'), others = all.filter(p => p.role !== 'pending');
  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <div className="head">
        <span className="eyebrow">Admin</span>
        <h1>Quản lý tài khoản</h1>
        <p className="lede">Duyệt người mới, đặt nhóm và ngày bắt đầu (ngày 1 của hành trình 99 ngày). Khi nhân sự nghỉ việc, bấm "Khoá" (giữ lại dữ liệu, mở khoá được) hoặc "Xoá" (xoá hẳn tài khoản và dữ liệu).</p>
      </div>

      {sp.invite && INVITE_MSG[sp.invite] && <div className={`note ${INVITE_MSG[sp.invite][0]}`}>{INVITE_MSG[sp.invite][1]}{sp.applied && ' Tài khoản này đã đăng nhập từ trước nên nhóm, ngày bắt đầu và vai trò mới đã được áp dụng ngay.'}</div>}
      {sp.acct === 'deleted' && <div className="note info">Đã xoá tài khoản và toàn bộ dữ liệu của người đó.</div>}
      {sp.acct === 'locked' && <div className="note info">Đã khoá tài khoản. Người này bị đăng xuất và không đăng nhập lại được.</div>}
      {sp.acct === 'unlocked' && <div className="note info">Đã mở khoá, tài khoản trở lại vai trò Nhân sự.</div>}
      {sp.acct === 'lockfailed' && <div className="note warn">Khoá / mở khoá chưa thành công, thử lại.</div>}
      {sp.acct === 'failed' && <div className="note warn">Xoá tài khoản chưa thành công, thử lại.</div>}

      <section className="blk" style={{ marginTop: 0 }}>
        <h3>Chờ duyệt ({pending.length})</h3>
        {pending.length ? <div className="panel">{pending.map(p => <MemberRow key={p.id} p={p} meId={me.id} seen={seenBy.get(p.id)} />)}<p className="srcline" style={{ marginTop: 8 }}>Đổi vai trò thành "Nhân sự" rồi bấm Lưu để duyệt.</p></div>
          : <div className="empty-box">Không có ai đang chờ.</div>}
      </section>

      <section className="blk">
        <h3>Mời trước (duyệt tự động khi đăng nhập)</h3>
        <form action={addInvite} className="panel logform">
          <label className="f">Gmail<input type="email" name="email" required placeholder="nguyenvana@gmail.com" /></label>
          <label className="f">Nhóm<input type="text" name="team" placeholder="Khôi" /></label>
          <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={todayISO()} /></label>
          <label className="f">Vai trò<select name="role" defaultValue="member"><option value="member">Nhân sự</option><option value="leader">Leader</option><option value="admin">Admin</option></select></label>
          <SubmitButton>Thêm &amp; gửi mail</SubmitButton>
        </form>
        {(inv.data || []).length > 0 && (
          <div className="tw"><table>
            <thead><tr><th>Gmail</th><th>Nhóm</th><th>Bắt đầu</th><th>Vai trò</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{(inv.data || []).map(i => (
              <tr key={i.email}>
                <td>{i.email}</td><td>{i.team || '—'}</td><td className="num">{fmtDate(i.start_date) || '—'}</td><td>{i.role}</td>
                <td><InviteStatus p={byEmail.get(String(i.email).toLowerCase())} seen={byEmail.get(String(i.email).toLowerCase()) ? seenBy.get(byEmail.get(String(i.email).toLowerCase())!.id) : undefined} /></td>
                <td className="r"><form action={deleteInvite}><input type="hidden" name="email" value={i.email} /><button className="btn ghost sm" type="submit">Xoá</button></form></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="blk">
        <h3>Tất cả tài khoản ({others.length})</h3>
        <div className="panel">{others.map(p => <MemberRow key={p.id} p={p} meId={me.id} seen={seenBy.get(p.id)} />)}</div>
      </section>
    </div>
  );
}
