import { assignTask } from '@/app/actions';
import type { Profile } from '@/lib/types';

/** Form giao việc. Chọn nhiều người cùng lúc khi giao từ trang "Giao việc". */
export function AssignForm({ members, preset }: { members: Profile[]; preset?: string }) {
  return (
    <form action={assignTask} className="panel stack">
      {preset ? <input type="hidden" name="assignee" value={preset} /> : (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow" style={{ marginBottom: 8 }}>Giao cho</legend>
          <div className="row">
            {members.map(m => (
              <label key={m.id} className="row" style={{ gap: 6, fontSize: 14, border: '1px solid var(--line)', borderRadius: 999, padding: '4px 10px' }}>
                <input type="checkbox" name="assignee" value={m.id} /> {m.full_name || m.email}{m.team ? <span className="srcline">· {m.team}</span> : null}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid2">
        <label className="f">Việc cần làm<input type="text" name="title" required maxLength={200} placeholder="VD: Gọi lại 10 khách đã rep Zalo tuần này" /></label>
        <label className="f">Hạn chót<input type="date" name="due_date" /></label>
      </div>
      <label className="f">Chi tiết / hướng dẫn<textarea name="detail" placeholder="Tuỳ chọn: tiêu chí hoàn thành, link tài liệu…" /></label>
      <div><button className="btn" type="submit">Giao việc</button></div>
    </form>
  );
}
