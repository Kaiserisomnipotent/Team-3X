import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { AssignForm } from '@/components/AssignForm';
import { deleteAssigned } from '@/app/actions';
import { dayNum, fmtDate, todayISO } from '@/lib/journey';
import type { AssignedTask, Profile } from '@/lib/types';

const LABEL = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Xong' } as const;

export default async function AssignPage() {
  const { supabase } = await requireStaff();
  const [pr, at] = await Promise.all([
    supabase.from('profiles').select('*').in('role', ['member', 'leader', 'admin']).order('full_name'),
    supabase.from('assigned_tasks').select('*').neq('status', 'done').order('due_date', { ascending: true, nullsFirst: false }).limit(300),
  ]);
  const members = (pr.data || []) as Profile[];
  const name = new Map(members.map(m => [m.id, m.full_name || m.email]));
  const t = dayNum(todayISO());
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Leader · Công việc</span>
        <h1>Giao việc</h1>
        <p className="lede">Giao việc ngoài lộ trình cho một hoặc nhiều người. Nhân sự thấy trong "Việc được giao" và được nhắc qua email mỗi sáng nếu sắp đến hạn.</p>
      </div>
      <AssignForm members={members} />
      <section className="blk">
        <h3>Đang mở ({(at.data || []).length})</h3>
        {(at.data || []).length ? (
          <div className="tw"><table>
            <thead><tr><th>Việc</th><th>Người làm</th><th>Hạn</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{(at.data as AssignedTask[]).map(r => (
              <tr key={r.id}>
                <td><b>{r.title}</b></td>
                <td><Link href={`/team/${r.assignee}`}>{name.get(r.assignee) || '—'}</Link></td>
                <td className="num" style={{ color: r.due_date && dayNum(r.due_date) < t ? 'var(--down)' : undefined }}>{fmtDate(r.due_date) || '—'}</td>
                <td><span className={`pill ${r.status === 'doing' ? 's-ref' : 's-idle'}`}>{LABEL[r.status]}</span></td>
                <td className="r"><form action={deleteAssigned}><input type="hidden" name="id" value={r.id} /><button className="btn ghost sm" type="submit">Xoá</button></form></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty-box">Không có việc nào đang mở.</div>}
      </section>
    </div>
  );
}
