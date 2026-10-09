import Link from 'next/link';
import { requireActive } from '@/lib/auth';
import { fmtDate, journeyStats, todayISO } from '@/lib/journey';
import { QUIZ_COUNT } from '@/lib/quizMeta';
import { DayPanel, KpiForm, KpiLogTable, KpiTiles, NextPanel } from '@/components/Journey';
import type { AssignedTask, Checkin, KpiLog } from '@/lib/types';

export default async function Dashboard() {
  const { supabase, profile } = await requireActive();
  const [tp, qs, kpi, ci, at] = await Promise.all([
    supabase.from('task_progress').select('task_id').eq('user_id', profile.id),
    supabase.from('quiz_scores').select('best_score').eq('user_id', profile.id),
    supabase.from('kpi_logs').select('*').eq('user_id', profile.id).order('log_date', { ascending: false }).limit(400),
    supabase.from('checkins').select('*').eq('user_id', profile.id).eq('checkin_date', todayISO()).maybeSingle(),
    supabase.from('assigned_tasks').select('*').eq('assignee', profile.id).neq('status', 'done').order('due_date', { ascending: true, nullsFirst: false }).limit(5),
  ]);
  const done = new Set((tp.data || []).map(r => r.task_id as string));
  const passed = (qs.data || []).filter(r => (r.best_score as number) >= 4).length;
  const s = journeyStats(profile.start_date, done, passed, QUIZ_COUNT);
  const logs = (kpi.data || []) as KpiLog[];
  const today = ci.data as Checkin | null;
  const tasks = (at.data || []) as AssignedTask[];

  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Học viên · Tổng quan</span>
        <h1>Bảng của tôi</h1>
        <p className="lede">Chào {profile.full_name || 'bạn'}. Bắt đầu ngày {fmtDate(profile.start_date)}{profile.team ? ` · nhóm ${profile.team}` : ''}. Hệ thống đếm ngày, nhắc việc đến hạn và lưu tiến độ cho leader theo dõi.</p>
      </div>

      <div className="grid2" style={{ marginBottom: 14 }}>
        <div className={`note ${today ? 'info' : 'warn'}`}>
          {today
            ? <>Đã check-in hôm nay. {today.help_status === 'open' ? 'Yêu cầu hỗ trợ đang chờ leader.' : today.help_status === 'resolved' ? 'Leader đã trả lời yêu cầu hỗ trợ.' : ''} <Link href="/check-in">Xem / sửa</Link></>
            : <>Chưa check-in hôm nay. <Link href="/check-in"><b>Check-in ngay</b></Link> (khoảng 1 phút).</>}
        </div>
        <div className="note">
          {tasks.length
            ? <>Leader giao bạn <b>{tasks.length}</b> việc chưa xong. <Link href="/viec-duoc-giao">Mở danh sách</Link></>
            : <>Không có việc leader giao đang chờ.</>}
        </div>
      </div>

      <div className="dash">
        <DayPanel s={s} />
        <NextPanel start={profile.start_date} done={done} />
      </div>

      <section className="blk">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h3>Số liệu kinh doanh</h3>
          <span className="srcline">Ghi mỗi khi có TK mới, chuyển ID hoặc phí net — tự cộng theo tuần và kỳ doanh số.</span>
        </div>
        <KpiTiles start={profile.start_date} logs={logs} />
        <KpiForm />
        <KpiLogTable logs={logs} canDelete />
      </section>

      <section className="blk">
        <h3>Hành trình một nhìn</h3>
        <div className="flow">
          <div><span className="n">Ngày 1–3</span><b>Nhận việc</b><small>Đăng ký Người đồng hành, ký HĐ điện tử, cài app, đọc nội quy.</small></div>
          <div><span className="n">Tuần 1–2</span><b>Nền tảng</b><small>Module 1, sản phẩm SSI, tạo kênh TikTok, live 6h30 sáng.</small></div>
          <div><span className="n">Tuần 3–8</span><b>Kiến thức &amp; kênh</b><small>FA, TA, CSKH. Live 3→5 buổi/tuần. Zalo 50 tin/ngày.</small></div>
          <div><span className="n">Tuần 9–14</span><b>Chuyển đổi</b><small>Room cộng đồng → room VIP. Đạt 10tr phí net + 7 TK.</small></div>
          <div><span className="n">Ngày 99</span><b>Chính thức</b><small>Chuyên viên Tư vấn đầu tư SSI, hoa hồng 65%.</small></div>
        </div>
      </section>

      <section className="blk">
        <h3>Quy ước màu — đọc như bảng điện</h3>
        <div className="legend">
          <span className="pill s-up">Hoàn thành</span><span className="pill s-ref">Đang trong hạn</span>
          <span className="pill s-down">Quá hạn</span><span className="pill s-floor">Sắp tới</span><span className="pill s-ceil">Điểm tuyệt đối</span>
        </div>
      </section>
    </div>
  );
}
