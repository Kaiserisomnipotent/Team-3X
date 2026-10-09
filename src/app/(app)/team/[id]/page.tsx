import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { ALL_TASKS, dayOf, fmtDate, journeyStats, statusOf } from '@/lib/journey';
import { QUIZ_COUNT } from '@/lib/quizMeta';
import { QUIZZES } from '@/lib/quizzes';
import { DayPanel, KpiLogTable, KpiTiles, scorePill } from '@/components/Journey';
import { CheckinCard } from '@/components/CheckinCard';
import { AssignForm } from '@/components/AssignForm';
import { deleteAssigned } from '@/app/actions';
import type { AssignedTask, Checkin, KpiLog, Profile } from '@/lib/types';

const LABEL = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Xong' } as const;

export default async function MemberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  const profile = p as Profile;
  const [tp, qs, kpi, ci, at, vl] = await Promise.all([
    supabase.from('task_progress').select('task_id,done_at').eq('user_id', id),
    supabase.from('quiz_scores').select('quiz_id,best_score,attempts').eq('user_id', id),
    supabase.from('kpi_logs').select('*').eq('user_id', id).order('log_date', { ascending: false }).limit(400),
    supabase.from('checkins').select('*').eq('user_id', id).order('checkin_date', { ascending: false }).limit(14),
    supabase.from('assigned_tasks').select('*').eq('assignee', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('view_logs').select('viewed_at').eq('user_id', id).order('viewed_at', { ascending: false }).limit(1),
  ]);
  const done = new Set((tp.data || []).map(r => r.task_id as string));
  const quiz = Object.fromEntries((qs.data || []).map(r => [r.quiz_id as string, r as { best_score: number; attempts: number }]));
  const passed = Object.values(quiz).filter(q => q.best_score >= 4).length;
  const s = journeyStats(profile.start_date, done, passed, QUIZ_COUNT);
  const day = dayOf(profile.start_date);
  const overdue = ALL_TASKS.filter(t => statusOf(t, done.has(t.id), day).cls === 's-down');
  const lastSeen = vl.data?.[0]?.viewed_at as string | undefined;

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="head">
        <span className="eyebrow"><Link href="/team">← Tiến độ cả team</Link></span>
        <h1>{profile.full_name || profile.email}</h1>
        <p className="lede">{profile.email} · nhóm {profile.team || '—'} · bắt đầu {fmtDate(profile.start_date)}{lastSeen ? ` · vào web lần cuối ${new Date(lastSeen).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}` : ' · chưa vào web'}</p>
      </div>

      <div className="dash">
        <DayPanel s={s} />
        <div className="panel">
          <span className="eyebrow">Đầu việc quá hạn ({overdue.length})</span>
          <ul className="next" style={{ marginTop: 8 }}>
            {overdue.length ? overdue.map(t => <li key={t.id}><span style={{ fontSize: 14, fontWeight: 600 }}>{t.t}</span><span className="pill s-down">Hạn ngày {t.phase.to}</span></li>)
              : <li className="srcline">Không có đầu việc quá hạn.</li>}
          </ul>
          <span className="eyebrow" style={{ display: 'block', marginTop: 16 }}>Bài kiểm tra</span>
          <div className="stack" style={{ marginTop: 8, gap: 6 }}>
            {QUIZZES.map(q => <div key={q.id} className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}><span>{q.title}</span><span className="row">{quiz[q.id] && <span className="srcline">{quiz[q.id].attempts} lần</span>}{scorePill(quiz[q.id]?.best_score)}</span></div>)}
          </div>
        </div>
      </div>

      <section className="blk">
        <h3>Số liệu kinh doanh</h3>
        <KpiTiles start={profile.start_date} logs={(kpi.data || []) as KpiLog[]} />
        <KpiLogTable logs={(kpi.data || []) as KpiLog[]} canDelete={false} limit={15} />
      </section>

      <section className="blk">
        <h3>Check-in 14 ngày gần nhất</h3>
        {(ci.data || []).length
          ? <div className="stack">{(ci.data as Checkin[]).map(c => <CheckinCard key={c.id} c={c} canReply />)}</div>
          : <div className="empty-box">Chưa check-in lần nào.</div>}
      </section>

      <section className="blk">
        <h3>Việc đã giao</h3>
        <AssignForm members={[profile]} preset={profile.id} />
        {(at.data || []).length ? (
          <div className="tw"><table>
            <thead><tr><th>Việc</th><th>Hạn</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>{(at.data as AssignedTask[]).map(t => (
              <tr key={t.id}>
                <td><b>{t.title}</b>{t.detail && <div className="srcline" style={{ whiteSpace: 'pre-wrap' }}>{t.detail}</div>}</td>
                <td className="num">{fmtDate(t.due_date) || '—'}</td>
                <td><span className={`pill ${t.status === 'done' ? 's-up' : t.status === 'doing' ? 's-ref' : 's-idle'}`}>{LABEL[t.status]}</span></td>
                <td className="r"><form action={deleteAssigned}><input type="hidden" name="id" value={t.id} /><button className="btn ghost sm" type="submit">Xoá</button></form></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="srcline">Chưa giao việc nào.</p>}
      </section>
    </div>
  );
}
