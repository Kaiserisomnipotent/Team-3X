import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { addInvite, deleteInvite } from '@/app/actions';
import { supabaseAdmin } from '@/lib/supabase/admin';
import SubmitButton from '@/components/SubmitButton';
import { InviteStatus, Notices, StatusCell, type Seen } from '@/components/AccountBits';
import { fmtDate, todayISO } from '@/lib/journey';
import type { Profile } from '@/lib/types';

/** Leader: mời người vào nhóm mình và theo dõi ai đã nhận lời mời. Admin dùng trang Quản lý tài khoản. */
export default async function MyGroupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, profile: me } = await requireStaff();
  if (me.role === 'admin') redirect('/admin');
  // RLS: leader chỉ đọc được người mình phụ trách và lời mời do chính mình gửi.
  const [pr, inv, vl] = await Promise.all([
    supabase.from('profiles').select('*').eq('leader_id', me.id).order('created_at', { ascending: false }),
    supabase.from('invites').select('*').order('created_at', { ascending: false }),
    supabase.from('view_logs').select('user_id,viewed_at').order('viewed_at', { ascending: false }).limit(1000),
  ]);
  const mine = (pr.data || []) as Profile[];
  const ids = new Set(mine.map(p => p.id));
  const au = await supabaseAdmin().auth.admin.listUsers({ perPage: 200 }).catch(() => null);
  const seenBy = new Map<string, Seen>();
  (au?.data?.users || []).filter(u => ids.has(u.id)).forEach(u => seenBy.set(u.id, { last: u.last_sign_in_at || undefined, banned: !!u.banned_until && new Date(u.banned_until) > new Date() }));
  (vl.data || []).forEach(r => { const s = seenBy.get(r.user_id as string) || { banned: false }; if (!s.last || r.viewed_at > s.last) s.last = r.viewed_at as string; seenBy.set(r.user_id as string, s); });
  const byEmail = new Map(mine.map(p => [p.email.toLowerCase(), p]));

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <div className="head">
        <span className="eyebrow">Leader · Nhóm</span>
        <h1>Nhóm của tôi</h1>
        <p className="lede">Mời người bạn tuyển vào nhóm: nhập Gmail, hệ thống gửi email mời và tự gắn người đó vào nhóm bạn khi họ đăng nhập. Tiến độ chi tiết xem ở <Link href="/team">Tiến độ nhóm</Link>.</p>
      </div>

      <Notices sp={sp} />

      <section className="blk" style={{ marginTop: 0 }}>
        <h3>Mời người mới vào nhóm</h3>
        <form action={addInvite} className="panel logform">
          <label className="f">Gmail<input type="email" name="email" required placeholder="nguyenvana@gmail.com" /></label>
          <label className="f">Ngày bắt đầu (ngày 1 của 99 ngày)<input type="date" name="start_date" defaultValue={todayISO()} /></label>
          <SubmitButton>Mời &amp; gửi mail</SubmitButton>
        </form>
        {(inv.data || []).length > 0 ? (
          <div className="tw"><table>
            <thead><tr><th>Gmail</th><th>Bắt đầu</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{(inv.data || []).map(i => {
              const p = byEmail.get(String(i.email).toLowerCase());
              return (
                <tr key={i.email}>
                  <td>{i.email}</td>
                  <td className="num">{fmtDate(i.start_date) || '—'}</td>
                  <td><InviteStatus p={p} seen={p ? seenBy.get(p.id) : undefined} /></td>
                  <td className="r">{!p && <form action={deleteInvite}><input type="hidden" name="email" value={i.email} /><button className="btn ghost sm" type="submit">Huỷ lời mời</button></form>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <div className="empty-box">Bạn chưa mời ai.</div>}
      </section>

      <section className="blk">
        <h3>Người bạn phụ trách ({mine.length})</h3>
        {mine.length ? (
          <div className="tw"><table>
            <thead><tr><th>Nhân sự</th><th>Bắt đầu</th><th>Trạng thái</th></tr></thead>
            <tbody>{mine.map(p => (
              <tr key={p.id}>
                <td><Link href={`/team/${p.id}`}><b>{p.full_name || p.email}</b></Link><div className="srcline">{p.email}</div></td>
                <td className="num">{fmtDate(p.start_date)}</td>
                <td><StatusCell p={p} seen={seenBy.get(p.id)} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty-box">Chưa có ai trong nhóm. Mời người mới ở trên, hoặc nhờ admin gắn người có sẵn vào nhóm bạn.</div>}
        <p className="srcline" style={{ marginTop: 8 }}>Cần khoá tài khoản khi nhân sự nghỉ việc: báo admin.</p>
      </section>
    </div>
  );
}
