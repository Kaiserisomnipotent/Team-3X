import { requireAdmin } from '@/lib/auth';
import { addInvite, deleteInvite, updateMember } from '@/app/actions';
import { fmtDate, todayISO } from '@/lib/journey';
import type { Profile } from '@/lib/types';

const ROLES = [
  ['pending', 'Chờ duyệt'], ['member', 'Nhân sự'], ['leader', 'Leader'], ['admin', 'Admin'], ['disabled', 'Đã khoá'],
] as const;

function MemberRow({ p }: { p: Profile }) {
  return (
    <form action={updateMember} className="logform" style={{ gridTemplateColumns: 'minmax(180px,1.4fr) repeat(3,minmax(120px,1fr)) auto', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <input type="hidden" name="id" value={p.id} />
      <label className="f">{p.email}<input type="text" name="full_name" defaultValue={p.full_name} /></label>
      <label className="f">Nhóm<input type="text" name="team" defaultValue={p.team || ''} /></label>
      <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={p.start_date} /></label>
      <label className="f">Vai trò<select name="role" defaultValue={p.role}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <button className="btn sm" type="submit">Lưu</button>
    </form>
  );
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
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
        <p className="lede">Duyệt người mới, đặt nhóm và ngày bắt đầu (ngày 1 của hành trình 99 ngày). Khi nhân sự nghỉ việc, đổi vai trò thành "Đã khoá" — họ mất quyền truy cập ngay.</p>
      </div>

      <section className="blk" style={{ marginTop: 0 }}>
        <h3>Chờ duyệt ({pending.length})</h3>
        {pending.length ? <div className="panel">{pending.map(p => <MemberRow key={p.id} p={p} />)}<p className="srcline" style={{ marginTop: 8 }}>Đổi vai trò thành "Nhân sự" rồi bấm Lưu để duyệt.</p></div>
          : <div className="empty-box">Không có ai đang chờ.</div>}
      </section>

      <section className="blk">
        <h3>Mời trước (duyệt tự động khi đăng nhập)</h3>
        <form action={addInvite} className="panel logform">
          <label className="f">Gmail<input type="email" name="email" required placeholder="nguyenvana@gmail.com" /></label>
          <label className="f">Nhóm<input type="text" name="team" placeholder="Khôi" /></label>
          <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={todayISO()} /></label>
          <label className="f">Vai trò<select name="role" defaultValue="member"><option value="member">Nhân sự</option><option value="leader">Leader</option><option value="admin">Admin</option></select></label>
          <button className="btn" type="submit">Thêm</button>
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
        <div className="panel">{others.map(p => <MemberRow key={p.id} p={p} />)}</div>
      </section>
    </div>
  );
}
