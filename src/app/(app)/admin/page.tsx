import { requireAdmin } from '@/lib/auth';
import { addInvite, deleteInvite, deleteMember, grantOwner, lockMember, revokeOwner, unlockMember, updateMember } from '@/app/actions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import SubmitButton from '@/components/SubmitButton';
import { InviteStatus, Notices, StatusCell, type Seen } from '@/components/AccountBits';
import { fmtDate, todayISO } from '@/lib/journey';
import type { Profile } from '@/lib/types';

const ROLES = [
  ['pending', 'Chờ duyệt'], ['member', 'Nhân sự'], ['leader', 'Leader'], ['admin', 'Admin'], ['disabled', 'Đã khoá'],
] as const;
const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES);

function MemberRow({ p, me, seen, leaders }: { p: Profile; me: Profile; seen?: Seen; leaders: Profile[] }) {
  const self = p.id === me.id, locked = p.role === 'disabled';
  // Chủ sở hữu: không ai đụng được. Admin: chỉ chủ sở hữu đụng được.
  const canManage = !self && !p.is_owner && (p.role !== 'admin' || me.is_owner);
  const roles = ROLES.filter(([v]) => v !== 'admin' || me.is_owner || p.role === 'admin');
  return (
    <form action={updateMember} className="logform" style={{ gridTemplateColumns: 'minmax(180px,1.3fr) repeat(3,minmax(110px,1fr)) minmax(150px,1fr) auto', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <input type="hidden" name="id" value={p.id} />
      <label className="f">
        <span>{p.email}{p.is_owner && <span className="pill s-ceil" style={{ marginLeft: 6 }}>Chủ sở hữu</span>}{self && <span className="srcline"> (bạn)</span>}</span>
        <input type="text" name="full_name" defaultValue={p.full_name} />
      </label>
      <label className="f">Leader phụ trách
        <select name="leader_id" defaultValue={p.leader_id || ''}>
          <option value="">— Chưa gắn —</option>
          {leaders.filter(l => l.id !== p.id).map(l => <option key={l.id} value={l.id}>{l.full_name || l.email}</option>)}
        </select>
      </label>
      <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={p.start_date} /></label>
      <label className="f">Vai trò<select name="role" defaultValue={p.role} disabled={!canManage}>{roles.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <StatusCell p={p} seen={seen} />
      <div className="row" style={{ alignSelf: 'flex-end', gap: 6 }}>
        <SubmitButton className="btn sm">Lưu</SubmitButton>
        {canManage && (locked
          ? <SubmitButton className="btn ghost sm" formAction={unlockMember}>Mở khoá</SubmitButton>
          : <SubmitButton className="btn ghost sm" formAction={lockMember} confirmText={`Khoá tài khoản ${p.email}? Họ sẽ mất quyền truy cập ngay.`}>Khoá</SubmitButton>)}
        {canManage && <SubmitButton className="btn ghost sm" formAction={deleteMember} confirmText={`XOÁ HẲN tài khoản ${p.email} cùng toàn bộ tiến độ, điểm, check-in? Không hoàn tác được.`}>Xoá</SubmitButton>}
        {me.is_owner && p.role === 'admin' && !p.is_owner && <SubmitButton className="btn ghost sm" formAction={grantOwner} confirmText={`Trao quyền CHỦ SỞ HỮU cho ${p.email}? Người này sẽ có toàn quyền như bạn (tối đa 2 chủ).`}>Trao quyền chủ</SubmitButton>}
        {me.is_owner && p.is_owner && <SubmitButton className="btn ghost sm" formAction={revokeOwner} confirmText={self ? 'Thôi làm chủ sở hữu? Chỉ làm được khi còn một chủ sở hữu khác.' : `Thu quyền chủ sở hữu của ${p.email}?`}>{self ? 'Thôi làm chủ' : 'Thu quyền chủ'}</SubmitButton>}
      </div>
    </form>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, profile: me } = await requireAdmin();
  const [pr, inv, vl, au] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('invites').select('*').order('created_at', { ascending: false }),
    supabase.from('view_logs').select('user_id,viewed_at').order('viewed_at', { ascending: false }).limit(2000),
    supabaseAdmin().auth.admin.listUsers({ perPage: 200 }).catch(() => null),
  ]);
  const all = (pr.data || []) as Profile[];
  // Lần vào gần nhất (nhật ký xem trang + lần đăng nhập) và trạng thái chặn đăng nhập (Supabase Auth).
  const seenBy = new Map<string, Seen>();
  (au?.data?.users || []).forEach(u => seenBy.set(u.id, { last: u.last_sign_in_at || undefined, banned: !!u.banned_until && new Date(u.banned_until) > new Date() }));
  (vl.data || []).forEach(r => { const s = seenBy.get(r.user_id as string) || { banned: false }; if (!s.last || r.viewed_at > s.last) s.last = r.viewed_at as string; seenBy.set(r.user_id as string, s); });
  const byEmail = new Map(all.map(p => [p.email.toLowerCase(), p]));
  const nameOf = new Map(all.map(p => [p.id, p.full_name || p.email]));
  const leaders = all.filter(p => p.role === 'leader' || p.role === 'admin');
  const pending = all.filter(p => p.role === 'pending'), others = all.filter(p => p.role !== 'pending');
  const owners = all.filter(p => p.is_owner);
  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <div className="head">
        <span className="eyebrow">Admin</span>
        <h1>Quản lý tài khoản</h1>
        <p className="lede">Duyệt người mới, gắn leader phụ trách và ngày bắt đầu (ngày 1 của hành trình 99 ngày). Nhân sự nghỉ việc: bấm "Khoá" (giữ dữ liệu, mở khoá được) hoặc "Xoá" (xoá hẳn).</p>
        <p className="srcline">Phân quyền: <b>Leader</b> chỉ thấy và quản lý người mình phụ trách, tự mời nhân sự vào nhóm mình. <b>Admin</b> thấy cả team, quản lý leader và nhân sự. <b>Chủ sở hữu</b> ({owners.map(o => o.full_name || o.email).join(', ') || 'chưa có'}) là người duy nhất thêm, khoá hay hạ quyền admin; không ai khoá hay xoá được chủ sở hữu.</p>
      </div>

      <Notices sp={sp} />

      <section className="blk" style={{ marginTop: 0 }}>
        <h3>Chờ duyệt ({pending.length})</h3>
        {pending.length ? <div className="panel">{pending.map(p => <MemberRow key={p.id} p={p} me={me} seen={seenBy.get(p.id)} leaders={leaders} />)}<p className="srcline" style={{ marginTop: 8 }}>Đổi vai trò thành "Nhân sự", chọn leader phụ trách rồi bấm Lưu để duyệt.</p></div>
          : <div className="empty-box">Không có ai đang chờ.</div>}
      </section>

      <section className="blk">
        <h3>Mời trước (duyệt tự động khi đăng nhập, có gửi email mời)</h3>
        <form action={addInvite} className="panel logform">
          <label className="f">Gmail<input type="email" name="email" required placeholder="nguyenvana@gmail.com" /></label>
          <label className="f">Leader phụ trách
            <select name="leader_id" defaultValue=""><option value="">— Chưa gắn —</option>{leaders.map(l => <option key={l.id} value={l.id}>{l.full_name || l.email}</option>)}</select>
          </label>
          <label className="f">Ngày bắt đầu<input type="date" name="start_date" defaultValue={todayISO()} /></label>
          <label className="f">Vai trò<select name="role" defaultValue="member"><option value="member">Nhân sự</option><option value="leader">Leader</option>{me.is_owner && <option value="admin">Admin</option>}</select></label>
          <SubmitButton>Thêm &amp; gửi mail</SubmitButton>
        </form>
        {(inv.data || []).length > 0 && (
          <div className="tw"><table>
            <thead><tr><th>Gmail</th><th>Leader</th><th>Bắt đầu</th><th>Vai trò</th><th>Người mời</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{(inv.data || []).map(i => {
              const p = byEmail.get(String(i.email).toLowerCase());
              return (
                <tr key={i.email}>
                  <td>{i.email}</td>
                  <td>{(i.leader_id && nameOf.get(i.leader_id)) || i.team || '—'}</td>
                  <td className="num">{fmtDate(i.start_date) || '—'}</td>
                  <td>{ROLE_LABEL[i.role] || i.role}</td>
                  <td>{(i.invited_by && nameOf.get(i.invited_by)) || '—'}</td>
                  <td><InviteStatus p={p} seen={p ? seenBy.get(p.id) : undefined} /></td>
                  <td className="r"><form action={deleteInvite}><input type="hidden" name="email" value={i.email} /><button className="btn ghost sm" type="submit">Xoá</button></form></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </section>

      <section className="blk">
        <h3>Tất cả tài khoản ({others.length})</h3>
        <div className="panel">{others.map(p => <MemberRow key={p.id} p={p} me={me} seen={seenBy.get(p.id)} leaders={leaders} />)}</div>
      </section>
    </div>
  );
}
