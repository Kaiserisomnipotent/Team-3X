import { requireActive } from '@/lib/auth';
import { dayOf } from '@/lib/journey';
import Roadmap from './Roadmap';

export default async function RoadmapPage() {
  const { supabase, profile } = await requireActive();
  const { data } = await supabase.from('task_progress').select('task_id').eq('user_id', profile.id);
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Học viên · Checklist</span>
        <h1>Lộ trình 99 ngày</h1>
        <p className="lede">Bốn giai đoạn, mỗi đầu việc có hạn theo ngày tính từ ngày bắt đầu. Tick khi xong — leader thấy ngay trên bảng tiến độ team. Việc có nhãn <span className="tag" style={{ margin: 0 }}>Hằng ngày</span> / <span className="tag" style={{ margin: 0 }}>Hằng tuần</span> chỉ tick khi đã duy trì đủ cả giai đoạn.</p>
      </div>
      <div className="legend" style={{ marginBottom: 16 }}>
        <span className="pill s-up">Hoàn thành</span><span className="pill s-ref">Đang trong hạn</span><span className="pill s-down">Quá hạn</span><span className="pill s-floor">Sắp tới</span>
      </div>
      <Roadmap initialDone={(data || []).map(r => r.task_id as string)} day={dayOf(profile.start_date)} />
    </div>
  );
}
