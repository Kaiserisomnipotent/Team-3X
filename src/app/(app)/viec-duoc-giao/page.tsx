import { requireActive } from '@/lib/auth';
import TaskStatus from '@/components/TaskStatus';
import { dayNum, fmtDate, todayISO } from '@/lib/journey';
import type { AssignedTask } from '@/lib/types';

export default async function MyTasks() {
  const { supabase, profile } = await requireActive();
  const { data } = await supabase.from('assigned_tasks').select('*').eq('assignee', profile.id)
    .order('status', { ascending: true }).order('due_date', { ascending: true, nullsFirst: false }).limit(200);
  const rows = (data || []) as AssignedTask[];
  const t = dayNum(todayISO());
  const open = rows.filter(r => r.status !== 'done'), closed = rows.filter(r => r.status === 'done').slice(0, 20);
  const Card = ({ r }: { r: AssignedTask }) => {
    const late = r.due_date && r.status !== 'done' && dayNum(r.due_date) < t;
    return (
      <div className="task" style={{ gridTemplateColumns: '1fr auto' }}>
        <div>
          <div className="t" style={r.status === 'done' ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{r.title}</div>
          {r.detail && <div className="d" style={{ whiteSpace: 'pre-wrap' }}>{r.detail}</div>}
          <div className="d">{r.due_date ? <>Hạn {fmtDate(r.due_date)} {late && <span className="pill s-down" style={{ marginLeft: 6 }}>Quá hạn</span>}</> : 'Không đặt hạn'}</div>
        </div>
        <TaskStatus id={r.id} status={r.status} />
      </div>
    );
  };
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Học viên · Công việc</span>
        <h1>Việc được giao</h1>
        <p className="lede">Việc anh lead giao riêng cho bạn, ngoài lộ trình 99 ngày. Cập nhật trạng thái để leader nắm tiến độ.</p>
      </div>
      <div className="phase">{open.length ? open.map(r => <Card key={r.id} r={r} />) : <div className="empty-box" style={{ border: 0 }}>Không có việc nào đang chờ.</div>}</div>
      {!!closed.length && <section className="blk"><h3>Đã xong gần đây</h3><div className="phase">{closed.map(r => <Card key={r.id} r={r} />)}</div></section>}
    </div>
  );
}
