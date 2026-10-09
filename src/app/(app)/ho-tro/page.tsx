import { requireStaff } from '@/lib/auth';
import { CheckinCard } from '@/components/CheckinCard';
import type { Checkin, Profile } from '@/lib/types';

export default async function HelpPage() {
  const { supabase } = await requireStaff();
  const [open, done, pr] = await Promise.all([
    supabase.from('checkins').select('*').eq('help_status', 'open').order('checkin_date', { ascending: true }).limit(100),
    supabase.from('checkins').select('*').eq('help_status', 'resolved').order('updated_at', { ascending: false }).limit(20),
    supabase.from('profiles').select('id,full_name,email'),
  ]);
  const name = new Map(((pr.data || []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]).map(p => [p.id, p.full_name || p.email]));
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Leader · Hỗ trợ</span>
        <h1>Yêu cầu hỗ trợ</h1>
        <p className="lede">Gom từ ô "Cần anh lead hỗ trợ gì?" trong check-in của nhân sự. Trả lời tại đây — nhân sự thấy ngay ở trang Check-in của họ.</p>
      </div>
      <section className="blk" style={{ marginTop: 0 }}>
        <h3>Đang chờ ({(open.data || []).length})</h3>
        {(open.data || []).length
          ? <div className="stack">{(open.data as Checkin[]).map(c => <CheckinCard key={c.id} c={c} who={name.get(c.user_id)} canReply />)}</div>
          : <div className="empty-box">Không có yêu cầu nào đang chờ.</div>}
      </section>
      {!!(done.data || []).length && (
        <section className="blk">
          <h3>Đã trả lời gần đây</h3>
          <div className="stack">{(done.data as Checkin[]).map(c => <CheckinCard key={c.id} c={c} who={name.get(c.user_id)} />)}</div>
        </section>
      )}
    </div>
  );
}
