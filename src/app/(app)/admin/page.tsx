import { requireAdmin } from '@/lib/auth';
import { addInvite, deleteInvite, deleteMember, setMemberLock, updateMember } from '@/app/actions';
import SubmitButton from '@/components/SubmitButton';
import { fmtDate, todayISO } from '@/lib/journey';
import type { Profile } from '@/lib/types';

const ROLES = [
  ['pending', 'Chờ duyệt'], ['member', 'Nhân sự'], ['leader', 'Leader'], ['admin', 'Admin'], ['disabled', 'Đã khoá'],
] as const;

function MemberRow({ p, meId }: { p: Profile; meId: string }) {
  const self = p.id === meId, locked = p.role === 'disabled';
  return (
    <form action={updateMember} className="logform" style={{ gridTemplateColumns: 'minmax(180px,1.4fr) repeat(3,minmax(120px,1fr)) auto', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <input type="hidden" name="id" value={p.id} />
      <label className="f">{p.email}{locked && <span className="pill s-down" style={{ marginLeft: 6 }}>Đã khoá</span>}<input type="text" name="full_name" defaultValue={p.full_name} /></label>
      <label className="f">Nhóm<input type="text" name="team" defaultValue={p.team || ''} /></label>
      <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={p.start_date} /></label>
      <label className="f">Vai trò<select name="role" defaultValue={p.role} disabled={self}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <div className="row" style={{ alignSelf: 'flex-end', gap: 6 }}>
        <SubmitButton className="btn sm">Lưu</SubmitButton>
        {!self && (locked
          ? <SubmitButton className="btn ghost sm" formAction={setMemberLock} name="lock" value="0">Mở khoá</SubmitButton>
          : <SubmitButton className="btn ghost sm" formAction={setMemberLock} name="lock" value="1" confirmText={`Khoá tài khoản ${p.email}? Họ sẽ mất quyền truy cập.`}>Khoá</SubmitButton>)}
        {!self && <SubmitButton className="btn ghost sm" formAction={deleteMember} confirmText={`XOÁ HẲN tài khoản ${p.email} cùng toàn bộ tiến độ, điểm, check-in? Không hoàn tác được.`}>Xoá</SubmitButton>}
      </div>
    </form>
  );
}

const INVITE_MSG: Record<string, [string, string]> = {
  sent: ['info', 'Đã thêm và gửi email mời.'],
  failed: ['warn', 'Đã thêm vào danh sách, nhưng gửi email thất bại. Resend chưa có tên miền riêng chỉ gửi được tới email chủ tài khoản Resend. Bạn nhắn người đó tự đăng nhập bằng đúng Gmail này.'],
  nokey: ['warn', 'Đã thêm vào danh sách. Chưa gửi email vì chưa cấu hình RESEND_API_KEY trên Vercel. Bạn nhắn người đó tự đăng nhập bằng đúng Gmail này.'],
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ invite?: string; applied?: string; acct?: string }> }) {
  const sp = await searchParams;
  const { supabase, profile: me } = await requireAdmin();
  const [pr, inv] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('invites').select('*').order('created_at', { ascending: false }),
  ]);
  const all = (pr.data || []) as Profile[];
  const pending = all.filter(p => p.role === 'pending'), others = all.filter(p => p.role !== 'pending');
  const joined = new Set(all.map(p => p.email.toLowerCase()));
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
        {pending.length ? <div className="panel">{pending.map(p => <MemberRow key={p.id} p={p} meId={me.id} />)}<p className="srcline" style={{ marginTop: 8 }}>Đổi vai trò thành "Nhân sự" rồi bấm Lưu để duyệt.</p></div>
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
                <td>{joined.has(String(i.email).toLowerCase()) ? <span className="pill s-up">Đã vào</span> : <span className="pill s-idle">Chưa đăng nhập</span>}</td>
                <td className="r"><form action={deleteInvite}><input type="hidden" name="email" value={i.email} /><button className="btn ghost sm" type="submit">Xoá</button></form></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="blk">
        <h3>Tất cả tài khoản ({others.length})</h3>
        <div className="panel">{others.map(p => <MemberRow key={p.id} p={p} meId={me.id} />)}</div>
      </section>
    </div>
  );
}
