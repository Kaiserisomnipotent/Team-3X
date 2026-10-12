import { requireActive, isStaff } from '@/lib/auth';
import { journeyStats } from '@/lib/journey';
import { STATIC_PAGES } from '@/lib/pages';
import { QUIZ_COUNT } from '@/lib/quizMeta';
import RailNav, { type NavItem } from '@/components/RailNav';
import Protect from '@/components/Protect';
import TopBar from '@/components/TopBar';
import AutoRefresh from '@/components/AutoRefresh';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireActive();
  const staff = isStaff(profile);

  const [tp, qs, open, help] = await Promise.all([
    supabase.from('task_progress').select('task_id').eq('user_id', profile.id),
    supabase.from('quiz_scores').select('best_score').eq('user_id', profile.id),
    supabase.from('assigned_tasks').select('id', { count: 'exact', head: true }).eq('assignee', profile.id).neq('status', 'done'),
    staff ? supabase.from('checkins').select('id', { count: 'exact', head: true }).eq('help_status', 'open') : Promise.resolve({ count: 0 }),
  ]);
  const done = new Set((tp.data || []).map(r => r.task_id as string));
  const passed = (qs.data || []).filter(r => (r.best_score as number) >= 4).length;
  const s = journeyStats(profile.start_date, done, passed, QUIZ_COUNT);

  const items: NavItem[] = [
    { group: 'Học viên' },
    { href: '/', label: 'Bảng của tôi' },
    { href: '/lo-trinh', label: 'Lộ trình 99 ngày', count: s.overdue, tone: 'bad' },
    { href: '/kiem-tra', label: 'Bài kiểm tra', count: passed, tone: 'ok' },
    { href: '/viec-duoc-giao', label: 'Việc được giao', count: open.count || 0, tone: 'bad' },
    { href: '/check-in', label: 'Check-in hằng ngày' },
    { href: '/video', label: 'Video bài giảng', step: '▶' },
    { group: 'Quy trình chuẩn' },
    ...STATIC_PAGES.filter(p => p.group === 'Quy trình chuẩn').map(p => ({ href: '/' + p.slug, label: p.title, step: p.step })),
    { group: 'Kiến thức' },
    ...STATIC_PAGES.filter(p => p.group === 'Kiến thức').map(p => ({ href: '/' + p.slug, label: p.title, step: p.step })),
  ];
  if (staff) {
    items.push(
      { group: 'Leader' },
      { href: '/team', label: 'Tiến độ cả team', step: '▦' },
      { href: '/ho-tro', label: 'Yêu cầu hỗ trợ', step: '?', count: help.count || 0, tone: 'bad' },
      { href: '/giao-viec', label: 'Giao việc', step: '+' },
    );
    if (profile.role === 'admin') items.push({ href: '/admin', label: 'Quản lý tài khoản', step: '⚙' });
  }

  return (
    <>
      <TopBar />
      <div className="shell">
        <nav className="rail" aria-label="Mục lục">
          <div className="me">
            <div className="name">{profile.full_name || profile.email}</div>
            <div className="day">Ngày {s.day}/99 · {s.pct}%</div>
            <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${s.pct}%` }} /></div>
          </div>
          <RailNav items={items} />
          <form className="out" action="/auth/signout" method="post"><button className="btn ghost sm" type="submit">Đăng xuất</button></form>
        </nav>
        <main id="main">{children}</main>
      </div>
      <Protect email={profile.email} />
      <AutoRefresh />
    </>
  );
}
