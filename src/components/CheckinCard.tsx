import { fmtDate } from '@/lib/journey';
import { replyCheckin } from '@/app/actions';
import type { Checkin } from '@/lib/types';

export function CheckinCard({ c, who, canReply }: { c: Checkin; who?: string; canReply?: boolean }) {
  return (
    <div className={`helpcard${c.help_status === 'open' ? '' : ' done'}`}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{who ? `${who} · ` : ''}{fmtDate(c.checkin_date)}</b>
        {c.help_status === 'open' && <span className="pill s-down">Cần hỗ trợ</span>}
        {c.help_status === 'resolved' && <span className="pill s-up">Đã trả lời</span>}
      </div>
      {c.did && <div style={{ fontSize: 14 }}><span className="muted">Làm: </span>{c.did}</div>}
      {c.result && <div style={{ fontSize: 14 }}><span className="muted">Kết quả: </span>{c.result}</div>}
      {c.need_help && <div style={{ fontSize: 14 }}><span className="muted">Cần hỗ trợ: </span><b>{c.need_help}</b></div>}
      {c.leader_reply && <div className="reply"><span className="muted">Leader: </span>{c.leader_reply}</div>}
      {canReply && c.need_help && (
        <form action={replyCheckin} className="row" style={{ alignItems: 'flex-end' }}>
          <input type="hidden" name="id" value={c.id} />
          <label className="f" style={{ flex: 1, minWidth: 220 }}>{c.leader_reply ? 'Sửa câu trả lời' : 'Trả lời'}<textarea name="reply" required defaultValue={c.leader_reply || ''} style={{ minHeight: 50 }} /></label>
          <button className="btn sm" type="submit">Gửi &amp; đánh dấu xong</button>
        </form>
      )}
    </div>
  );
}
