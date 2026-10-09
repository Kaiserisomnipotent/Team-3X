import { requireActive } from '@/lib/auth';
import { saveCheckin } from '@/app/actions';
import { fmtDate, todayISO } from '@/lib/journey';
import type { Checkin } from '@/lib/types';
import { CheckinCard } from '@/components/CheckinCard';
import SubmitButton from '@/components/SubmitButton';

export default async function CheckinPage() {
  const { supabase, profile } = await requireActive();
  const { data } = await supabase.from('checkins').select('*').eq('user_id', profile.id).order('checkin_date', { ascending: false }).limit(30);
  const rows = (data || []) as Checkin[];
  const today = rows.find(r => r.checkin_date === todayISO());
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Học viên · Báo cáo ngày</span>
        <h1>Check-in hằng ngày</h1>
        <p className="lede">Cuối ngày dành 1 phút: hôm nay làm gì, ra kết quả gì, cần anh lead hỗ trợ gì. Leader thấy ngay và trả lời tại đây — không cần nhắn riêng.</p>
      </div>

      <form action={saveCheckin} className="panel stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Hôm nay · {fmtDate(todayISO())}</h3>
          {today && <span className="pill s-up">Đã check-in · có thể sửa</span>}
        </div>
        <label className="f">Hôm nay làm gì?<textarea name="did" required defaultValue={today?.did} placeholder="VD: Live 6h30 90 phút, nhắn 50 tin Zalo, học Module 2 phần vĩ mô VN" /></label>
        <label className="f">Kết quả<textarea name="result" defaultValue={today?.result} placeholder="VD: 35 mắt xem, 4 follow mới, 2 khách rep Zalo, hẹn gọi 1 khách" /></label>
        <label className="f">Cần anh lead hỗ trợ gì? (để trống nếu không)<textarea name="need_help" defaultValue={today?.need_help} placeholder="VD: Khách hỏi margin M+ cho mã ngoài danh sách, em chưa biết trả lời" /></label>
        <div><SubmitButton>{today ? 'Cập nhật check-in' : 'Gửi check-in'}</SubmitButton></div>
      </form>

      <section className="blk">
        <h3>30 ngày gần nhất</h3>
        {rows.length ? <div className="stack">{rows.map(r => <CheckinCard key={r.id} c={r} />)}</div> : <div className="empty-box">Chưa có check-in nào.</div>}
      </section>
    </div>
  );
}
