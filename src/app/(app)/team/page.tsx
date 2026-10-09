import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { loadTeam } from '@/lib/teamData';
import { fmtDate, fmtDM, fmtNum } from '@/lib/journey';
import { scorePill } from '@/components/Journey';
import { QUIZ_IDS } from '@/lib/quizIds';

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const { supabase } = await requireStaff();
  const { team } = await searchParams;
  const { rows: everyone, ky } = await loadTeam(supabase);
  // Chỉ hiện nhân sự đang theo lộ trình (leader/admin không tính).
  const all = everyone.filter(r => r.p.role === 'member');
  const teams = Array.from(new Set(all.map(r => r.p.team).filter(Boolean))) as string[];
  const rows = team ? all.filter(r => r.p.team === team) : all;
  const notChecked = rows.filter(r => !r.checkedToday);
  return (
    <div className="page" style={{ maxWidth: 1180 }}>
      <div className="head">
        <span className="eyebrow">Leader · Theo dõi</span>
        <h1>Tiến độ cả team</h1>
        <p className="lede">Sắp theo ngày trong hành trình. Cột đỏ là đầu việc quá hạn — ưu tiên kèm những bạn này trong buổi họp team thứ 6. Kỳ doanh số hiện tại: {fmtDM(ky.start)}–{fmtDM(ky.end)}.</p>
      </div>
      <div className="tabs">
        <Link href="/team" aria-current={!team ? 'page' : undefined}>Tất cả ({all.length})</Link>
        {teams.map(t => <Link key={t} href={`/team?team=${encodeURIComponent(t)}`} aria-current={team === t ? 'page' : undefined}>Nhóm {t}</Link>)}
      </div>
      {!!notChecked.length && (
        <div className="note warn" style={{ marginBottom: 12 }}>Chưa check-in hôm nay: {notChecked.map(r => r.p.full_name || r.p.email).join(', ')}</div>
      )}
      <div className="tw"><table>
        <thead><tr><th>Nhân sự</th><th>Nhóm</th><th className="r">Ngày</th><th>Tiến độ</th><th className="r">Quá hạn</th><th>Kỳ doanh số này</th><th>Kiểm tra</th><th>Check-in 7 ngày</th><th>Việc giao</th></tr></thead>
        <tbody>
          {rows.length ? rows.map(({ p, s, quiz, ks, official, checkedToday, checkins7, openHelp, openTasks, lateTasks }) => (
            <tr key={p.id}>
              <td><Link href={`/team/${p.id}`}><b>{p.full_name || p.email}</b></Link><div className="srcline">từ {fmtDate(p.start_date)}</div></td>
              <td>{p.team || '—'}</td>
              <td className="r num">{s.day}</td>
              <td style={{ minWidth: 140 }}><div className="bar"><i style={{ width: `${s.pct}%` }} /></div><span className="num srcline">{s.done}/{s.total} · {s.pct}%</span></td>
              <td className="r num" style={{ color: s.overdue ? 'var(--down)' : 'var(--muted)', fontWeight: 600 }}>{s.overdue}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{official && <><span className="pill s-ceil">Đạt ĐK</span> </>}<span className="num">{ks.tk}/7 TK · {fmtNum(ks.net)}/10 tr</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>{QUIZ_IDS.map(q => <span key={q}>{quiz[q] == null ? <span className="pill s-idle" title="Chưa làm">–</span> : scorePill(quiz[q])} </span>)}</td>
              <td style={{ whiteSpace: 'nowrap' }}><span className="num">{checkins7}/7</span> {checkedToday ? <span className="pill s-up">Hôm nay</span> : <span className="pill s-idle">Chưa</span>} {openHelp > 0 && <Link href="/ho-tro" className="pill s-down">Cần hỗ trợ</Link>}</td>
              <td className="num" style={{ whiteSpace: 'nowrap' }}>{openTasks} mở{lateTasks ? <span style={{ color: 'var(--down)' }}> · {lateTasks} trễ</span> : ''}</td>
            </tr>
          )) : <tr><td colSpan={9} className="srcline">Chưa có nhân sự nào được duyệt.</td></tr>}
        </tbody>
      </table></div>
    </div>
  );
}
